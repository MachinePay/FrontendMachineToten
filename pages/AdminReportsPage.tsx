import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Order } from "../types";
import { authenticatedFetch } from "../services/apiService";
import { getCurrentStoreId } from "../utils/tenantResolver"; // 🏪 MULTI-TENANT

interface AIRecommendation {
  topProducts: { name: string; quantity: number; revenue: number }[];
  peakDays: { day: string; orders: number }[];
  peakHours: { hour: string; orders: number }[];
  monthlyRevenue: number;
  insights: string;
}

// Cores para os gráficos
const COLORS = [
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

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
      const storeId = getCurrentStoreId();
      console.log(`📊 [AdminReportsPage] Buscando pedidos da loja: ${storeId}`);

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/user-orders`,
        {
          headers: {
            "x-store-id": storeId, // 🏪 MULTI-TENANT
          },
        }
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
      const prompt = `Você é um consultor de negócios para um restaurante de sushi. Analize os seguintes dados e forneça recomendações estratégicas:

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

  // Gerar dados de evolução de vendas (últimos 30 dias)
  const salesEvolutionData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map((date) => {
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.timestamp);
        return orderDate.toDateString() === date.toDateString();
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        pedidos: dayOrders.length,
        faturamento: revenue,
      };
    });
  }, [orders]);

  // Gerar dados para gráfico de pizza (categorias)
  const categoriesData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.category || "Outros";
        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + item.quantity
        );
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

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
          {/* Cards de métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                💰 Faturamento do Mês
              </h3>
              <p className="text-3xl font-bold text-green-900">
                R$ {recommendation.monthlyRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Média: R${" "}
                {(recommendation.monthlyRevenue / orders.length || 0).toFixed(
                  2
                )}{" "}
                por pedido
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                📦 Total de Pedidos
              </h3>
              <p className="text-3xl font-bold text-blue-900">
                {orders.length}
              </p>
              <p className="text-sm text-blue-700 mt-2">Últimos 30 dias</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-lg border-l-4 border-amber-600">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                🏆 Produto Top
              </h3>
              <p className="text-xl font-bold text-gray-900">
                {recommendation.topProducts[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-amber-700 mt-2">
                {recommendation.topProducts[0]?.quantity || 0} unidades
              </p>
            </div>
          </div>

          {/* Gráfico de Evolução de Vendas (Linha) - 30 dias */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              📈 Evolução de Vendas - Últimos 30 Dias
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "faturamento" ? `R$ ${value.toFixed(2)}` : value,
                    name === "faturamento" ? "Faturamento" : "Pedidos",
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) =>
                    value === "faturamento" ? "Faturamento (R$)" : "Pedidos"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="faturamento"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="pedidos"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grid com 2 gráficos lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Categorias Mais Vendidas */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                🥧 Categorias Mais Vendidas
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} unidades`,
                      "Total",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoriesData.map((cat, index) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium text-slate-700">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-slate-600">{cat.value} un.</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de Barras - Top 5 Produtos */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                🏆 Top 5 Produtos
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={recommendation.topProducts}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    width={120}
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? `R$ ${value.toFixed(2)}` : value,
                      name === "revenue" ? "Faturamento" : "Quantidade",
                    ]}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#f59e0b"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Produtos mais vendidos - Lista detalhada */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              📊 Detalhamento de Produtos
            </h2>
            <div className="space-y-3">
              {recommendation.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 text-lg">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      R$ {product.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Média: R${" "}
                      {(product.revenue / product.quantity).toFixed(2)}
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
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                  >
                    <span className="font-semibold text-slate-700">
                      {hour.hour}
                    </span>
                    <span className="text-red-600 font-bold">
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
