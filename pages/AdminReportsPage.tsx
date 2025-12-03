import React, { useState, useEffect } from "react";
import type { Order } from "../types";
import { authenticatedFetch } from "../services/apiService";

interface AIRecommendation {
  topProducts: { name: string; quantity: number; revenue: number }[];
  peakDays: { day: string; orders: number }[];
  peakHours: { hour: string; orders: number }[];
  monthlyRevenue: number;
  insights: string;
}

const AdminReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Buscar todos os pedidos
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/user-orders`
      );
      if (!res.ok) throw new Error("Erro ao buscar pedidos");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    }
  };

  // Gerar relatório com IA
  const generateAIReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Processar dados localmente primeiro
      const analysis = analyzeOrders(orders);

      // Gerar insights com IA
      const prompt = `Você é um consultor de negócios para uma pastelaria. Analise os seguintes dados e forneça recomendações estratégicas:

📊 DADOS DO MÊS:
- Faturamento Total: R$ ${analysis.monthlyRevenue.toFixed(2)}
- Total de Pedidos: ${orders.length}

🏆 PRODUTOS MAIS VENDIDOS:
${analysis.topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}: ${p.quantity} unidades (R$ ${p.revenue.toFixed(2)})`
  )
  .join("\n")}

📅 DIAS COM MAIS PEDIDOS:
${analysis.peakDays
  .map((d, i) => `${i + 1}. ${d.day}: ${d.orders} pedidos`)
  .join("\n")}

⏰ HORÁRIOS DE PICO:
${analysis.peakHours
  .map((h, i) => `${i + 1}. ${h.hour}: ${h.orders} pedidos`)
  .join("\n")}

Forneça 3-5 recomendações práticas e objetivas para:
1. Otimizar estoque dos produtos mais vendidos
2. Melhorar operação nos horários de pico
3. Aumentar vendas nos períodos mais fracos
4. Sugestões de promoções ou novos produtos

Seja direto e focado em ações práticas. Use emojis para deixar mais visual.`;

      const res = await authenticatedFetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/ai/suggestion`,
        {
          method: "POST",
          body: JSON.stringify({ prompt }),
        }
      );

      if (!res.ok) throw new Error("Erro na API de IA");

      const data = await res.json();

      setRecommendation({
        ...analysis,
        insights: data.text,
      });
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      setError("Erro ao gerar recomendações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Análise de dados dos pedidos
  const analyzeOrders = (
    orders: Order[]
  ): Omit<AIRecommendation, "insights"> => {
    // Filtrar pedidos do mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.timestamp);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });

    // Calcular faturamento mensal
    const monthlyRevenue = monthOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    // Produtos mais vendidos
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    monthOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.name) || {
          quantity: 0,
          revenue: 0,
        };
        productMap.set(item.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
        });
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Dias da semana com mais pedidos
    const dayMap = new Map<string, number>();
    const dayNames = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    monthOrders.forEach((order) => {
      const day = dayNames[new Date(order.timestamp).getDay()];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    const peakDays = Array.from(dayMap.entries())
      .map(([day, orders]) => ({ day, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3);

    // Horários de pico
    const hourMap = new Map<string, number>();
    monthOrders.forEach((order) => {
      const hour = new Date(order.timestamp).getHours();
      const hourRange = `${hour}:00 - ${hour + 1}:00`;
      hourMap.set(hourRange, (hourMap.get(hourRange) || 0) + 1);
    });

    const peakHours = Array.from(hourMap.entries())
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    return { topProducts, peakDays, peakHours, monthlyRevenue };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">
          📊 Recomendações IA
        </h1>
        <p className="text-slate-600">
          Análise inteligente de vendas e recomendações estratégicas
        </p>
      </div>

      {/* Botão para gerar relatório */}
      <div className="mb-8">
        <button
          onClick={generateAIReport}
          disabled={isLoading || orders.length === 0}
          className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "🤖 Gerando Análise..." : "🚀 Gerar Relatório com IA"}
        </button>
        {orders.length === 0 && (
          <p className="text-sm text-slate-500 mt-2">
            Nenhum pedido encontrado para análise
          </p>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Relatório */}
      {recommendation && (
        <div className="space-y-6">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                💰 Faturamento do Mês
              </h3>
              <p className="text-3xl font-bold text-green-900">
                R$ {recommendation.monthlyRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                📦 Total de Pedidos
              </h3>
              <p className="text-3xl font-bold text-blue-900">
                {orders.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                🏆 Produto Top
              </h3>
              <p className="text-xl font-bold text-amber-900">
                {recommendation.topProducts[0]?.name || "N/A"}
              </p>
            </div>
          </div>

          {/* Produtos mais vendidos */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              🏆 Top 5 Produtos
            </h2>
            <div className="space-y-3">
              {recommendation.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      R$ {product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dias e horários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dias de pico */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                📅 Dias com Mais Pedidos
              </h2>
              <div className="space-y-2">
                {recommendation.peakDays.map((day) => (
                  <div
                    key={day.day}
                    className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                  >
                    <span className="font-semibold text-slate-700">
                      {day.day}
                    </span>
                    <span className="text-blue-600 font-bold">
                      {day.orders} pedidos
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horários de pico */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                ⏰ Horários de Pico
              </h2>
              <div className="space-y-2">
                {recommendation.peakHours.map((hour) => (
                  <div
                    key={hour.hour}
                    className="flex justify-between items-center p-3 bg-amber-50 rounded-lg"
                  >
                    <span className="font-semibold text-slate-700">
                      {hour.hour}
                    </span>
                    <span className="text-amber-600 font-bold">
                      {hour.orders} pedidos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights da IA */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-xl shadow-lg border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
              🤖 Recomendações Estratégicas da IA
            </h2>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {recommendation.insights}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
