import React, { useState, useEffect, useCallback } from "react";
import type { Order } from "../types";

// Interface para resposta da IA
interface AIKitchenResponse {
  orders: Order[];
  aiEnabled: boolean;
  reasoning?: string;
  message?: string;
}

// Função para calcular tempo de espera
const getWaitingTime = (timestamp: string): number => {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000); // minutos
};

// --- Componente auxiliar para exibir um pedido ---
interface OrderCardProps {
  order: Order;
  onComplete: (orderId: string) => void;
  isPriority: boolean; // Primeiro da lista (IA recomenda fazer agora)
  index: number;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onComplete,
  isPriority,
  index,
}) => {
  const waitingMinutes = getWaitingTime(order.timestamp);
  const isUrgent = waitingMinutes > 10;

  // Determina cor de fundo
  let bgColor = "bg-white";
  let borderColor = "border-amber-500";

  if (isPriority) {
    bgColor = "bg-yellow-50";
    borderColor = "border-yellow-500";
  } else if (isUrgent) {
    bgColor = "bg-red-50";
    borderColor = "border-red-500";
  }

  return (
    <div
      className={`${bgColor} p-6 rounded-xl shadow-lg border-t-4 ${borderColor} relative flex flex-col h-full`}
    >
      {/* Badge de prioridade */}
      {isPriority && (
        <div className="absolute -top-3 -right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
          ⚡ FAZER AGORA
        </div>
      )}

      {/* Badge de urgente */}
      {isUrgent && !isPriority && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
          🔥 URGENTE
        </div>
      )}

      <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-2">
        <div>
          {/* Número da ordem na fila */}
          <div className="text-xs text-stone-500 font-semibold mb-1 uppercase tracking-wide">
            #{index + 1} na fila
          </div>

          <h3 className="font-bold text-xl text-stone-800 leading-tight">
            Pedido #{order.id.slice(-4)}
          </h3>

          {order.userName && (
            <p className="text-sm text-stone-600 font-medium mt-1">
              👤 {order.userName}
            </p>
          )}

          {/* Tempo de espera */}
          <p
            className={`text-xs font-bold mt-1 ${
              isUrgent ? "text-red-600" : "text-amber-600"
            }`}
          >
            ⏱️ Aguardando {waitingMinutes} min
          </p>
        </div>
      </div>

      {/* Lista de itens - Flex grow para empurrar o botão para baixo */}
      <ul className="space-y-2 mb-4 flex-grow">
        {order.items.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center border-b border-stone-100 pb-2 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded text-sm">
                {item.quantity}x
              </span>
              <span className="font-medium text-stone-800">{item.name}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* --- OBSERVAÇÃO DO CLIENTE (NOVO) --- */}
      {order.observation && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-xs font-bold text-yellow-800 uppercase mb-1 flex items-center gap-1">
            📝 Observação:
          </p>
          <p className="text-sm text-stone-800 font-medium whitespace-pre-wrap italic leading-snug">
            "{order.observation}"
          </p>
        </div>
      )}

      {/* Botão concluir */}
      <button
        onClick={() => onComplete(order.id)}
        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md active:transform active:scale-95"
      >
        ✅ Concluir Pedido
      </button>
    </div>
  );
};

// --- Componente principal da página da cozinha com IA ---
const KitchenPage: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [reasoning, setReasoning] = useState<string>("");

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Busca pedidos otimizados pela IA
  const fetchOrders = useCallback(async () => {
    try {
      // console.log('🤖 Buscando pedidos otimizados pela IA...');

      const resp = await fetch(`${BACKEND_URL}/api/ai/kitchen-priority`);
      const data: AIKitchenResponse = await resp.json();

      setActiveOrders(data.orders);
      setAiEnabled(data.aiEnabled);
      setReasoning(data.reasoning || data.message || "");
    } catch (err) {
      console.error("❌ Erro ao carregar pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchOrders();
    // Polling a cada 12 segundos (conforme especificação: 10-15s)
    const interval = setInterval(fetchOrders, 12000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Função que marca pedido como concluído
  const handleCompleteOrder = async (orderId: string) => {
    console.log("🔄 Concluindo pedido:", orderId);

    try {
      // Remove do estado imediatamente (feedback visual)
      setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Chama backend
      const resp = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        console.error("❌ Falha ao concluir pedido");
        await fetchOrders(); // Resincroniza
      } else {
        console.log("✅ Pedido concluído com sucesso");
      }
    } catch (err) {
      console.error("❌ Erro ao concluir pedido:", err);
      await fetchOrders(); // Resincroniza
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen bg-stone-100">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-amber-800 mb-4 flex items-center gap-3">
          <span>🍳</span> Cozinha Inteligente
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Badge de status da IA */}
          {aiEnabled ? (
            <span className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
              <span>🤖</span> IA Ativa
            </span>
          ) : (
            <span className="bg-stone-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              📋 Ordem Padrão
            </span>
          )}

          {/* Contador de pedidos */}
          <span className="bg-amber-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            {activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Reasoning da IA */}
        {reasoning && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm max-w-4xl">
            <p className="text-sm font-medium text-blue-900 leading-relaxed">
              <strong className="block mb-1 text-blue-700">
                💡 Estratégia IA:
              </strong>
              {reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mb-4"></div>
          <p className="text-stone-500 font-medium">Carregando pedidos...</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-stone-200 max-w-2xl mx-auto">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-bold text-stone-700">Tudo pronto!</h2>
          <p className="text-stone-500 mt-2">
            Nenhum pedido ativo no momento. Bom descanso!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              onComplete={handleCompleteOrder}
              isPriority={index === 0} // Primeiro da lista é prioridade
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
