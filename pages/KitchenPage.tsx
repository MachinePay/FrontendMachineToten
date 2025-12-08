import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Order } from "../types";
import { authenticatedFetch } from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentStoreId } from "../utils/tenantResolver"; // 🏪 MULTI-TENANT

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

// --- Função de Voz (Text-to-Speech) ---
const speakOrder = (text: string) => {
  if (!("speechSynthesis" in window)) return;

  // Cancela falas anteriores para não sobrepor
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR"; // Português do Brasil
  utterance.rate = 1.1; // Um pouco mais rápido

  // Tenta encontrar voz brasileira
  const voices = window.speechSynthesis.getVoices();
  const brVoice = voices.find((v) => v.lang.includes("pt-BR"));
  if (brVoice) utterance.voice = brVoice;

  window.speechSynthesis.speak(utterance);
};

// --- Componente auxiliar para exibir um pedido ---
interface OrderCardProps {
  order: Order;
  onComplete: (orderId: string) => void;
  isPriority: boolean;
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
      className={`${bgColor} p-6 md:p-3 lg:p-6 rounded-xl shadow-lg border-t-4 ${borderColor} relative flex flex-col h-full animate-fade-in-down`}
    >
      {isPriority && (
        <div className="absolute -top-3 -right-3 bg-yellow-500 text-white px-3 md:px-2 lg:px-3 py-1 md:py-0.5 lg:py-1 rounded-full text-xs md:text-[10px] lg:text-xs font-bold shadow-lg animate-pulse z-10">
          ⚡ FAZER AGORA
        </div>
      )}

      {isUrgent && !isPriority && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 md:px-2 lg:px-3 py-1 md:py-0.5 lg:py-1 rounded-full text-xs md:text-[10px] lg:text-xs font-bold z-10">
          🔥 URGENTE
        </div>
      )}

      <div className="flex justify-between items-start mb-4 md:mb-2 lg:mb-4 border-b border-stone-100 pb-2 md:pb-1 lg:pb-2">
        <div>
          <div className="text-xs md:text-[10px] lg:text-xs text-stone-500 font-semibold mb-1 md:mb-0.5 lg:mb-1 uppercase tracking-wide">
            #{index + 1} na fila
          </div>

          <h3 className="font-bold text-xl md:text-base lg:text-xl text-stone-800 leading-tight">
            Pedido #{order.id.slice(-4)}
          </h3>

          {order.userName && (
            <p className="text-sm md:text-xs lg:text-sm text-stone-600 font-medium mt-1 md:mt-0.5 lg:mt-1">
              👤 {order.userName}
            </p>
          )}

          <p
            className={`text-xs md:text-[10px] lg:text-xs font-bold mt-1 md:mt-0.5 lg:mt-1 ${
              isUrgent ? "text-red-600" : "text-amber-600"
            }`}
          >
            ⏱️ Aguardando {waitingMinutes} min
          </p>
        </div>
      </div>

      <ul className="space-y-2 md:space-y-1 lg:space-y-2 mb-4 md:mb-2 lg:mb-4 flex-grow">
        {order.items.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center border-b border-stone-100 pb-2 md:pb-1 lg:pb-2 last:border-0"
          >
            <div className="flex items-center gap-2 md:gap-1 lg:gap-2">
              <span className="bg-stone-200 text-stone-700 font-bold px-2 md:px-1.5 lg:px-2 py-0.5 rounded text-sm md:text-xs lg:text-sm">
                {item.quantity}x
              </span>
              <span className="font-medium text-stone-800 text-sm md:text-xs lg:text-sm">
                {item.name}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Observação */}
      {order.observation && (
        <div className="mb-4 md:mb-2 lg:mb-4 p-3 md:p-2 lg:p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-xs md:text-[10px] lg:text-xs font-bold text-yellow-800 uppercase mb-1 md:mb-0.5 lg:mb-1 flex items-center gap-1">
            📝 Observação:
          </p>
          <p className="text-sm md:text-xs lg:text-sm text-stone-800 font-medium whitespace-pre-wrap italic leading-snug md:leading-tight lg:leading-snug">
            "{order.observation}"
          </p>
        </div>
      )}

      <button
        onClick={() => onComplete(order.id)}
        className="w-full bg-green-600 text-white font-bold py-3 md:py-2 lg:py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md active:transform active:scale-95 text-sm md:text-xs lg:text-sm"
      >
        ✅ Concluir Pedido
      </button>
    </div>
  );
};

// --- Componente principal ---
const KitchenPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [reasoning, setReasoning] = useState<string>("");

  // Estado do Áudio
  const [audioEnabled, setAudioEnabled] = useState(false);
  // Memória para não repetir pedidos que já foram falados
  const seenOrderIds = useRef<Set<string>>(new Set());

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const fetchOrders = useCallback(async () => {
    try {
      const storeId = getCurrentStoreId();
      const resp = await fetch(`${BACKEND_URL}/api/ai/kitchen-priority`, {
        headers: {
          "x-store-id": storeId,
        },
      });
      const data: AIKitchenResponse = await resp.json();

      setActiveOrders(data.orders);
      setAiEnabled(data.aiEnabled);
      setReasoning(data.reasoning || data.message || "");

      // --- LÓGICA DE ÁUDIO ---
      if (audioEnabled) {
        data.orders.forEach((order) => {
          if (!seenOrderIds.current.has(order.id)) {
            // Novo pedido detectado!
            seenOrderIds.current.add(order.id);

            const itemsText = order.items
              .map((i) => `${i.quantity} ${i.name}`)
              .join(", e ");
            const obsText = order.observation
              ? `. Atenção: ${order.observation}`
              : "";
            const speechText = `Novo pedido para ${
              order.userName || "cliente"
            }. ${itemsText}${obsText}.`;

            speakOrder(speechText);
          }
        });
      } else {
        // Se áudio desligado, marca como visto silenciosamente
        data.orders.forEach((o) => seenOrderIds.current.add(o.id));
      }
    } catch (err) {
      console.error("❌ Erro ao carregar pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, audioEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
      const resp = await authenticatedFetch(
        `${BACKEND_URL}/api/orders/${orderId}`,
        {
          method: "DELETE",
        }
      );
      if (!resp.ok) await fetchOrders();
    } catch (err) {
      await fetchOrders();
    }
  };

  return (
    <div className="container mx-auto px-4 py-3 md:py-2 lg:py-6 min-h-screen bg-stone-100">
      <div className="mb-4 md:mb-2 lg:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-2 lg:gap-3 mb-4 md:mb-2 lg:mb-4">
          {aiEnabled ? (
            <span className="bg-green-600 text-white px-4 md:px-3 lg:px-4 py-1.5 md:py-1 lg:py-1.5 rounded-full text-sm md:text-xs lg:text-sm font-bold shadow-sm flex items-center gap-2 md:gap-1 lg:gap-2">
              <span>🤖</span> IA Ativa
            </span>
          ) : (
            <span className="bg-stone-400 text-white px-4 md:px-3 lg:px-4 py-1.5 md:py-1 lg:py-1.5 rounded-full text-sm md:text-xs lg:text-sm font-bold shadow-sm">
              📋 Ordem Padrão
            </span>
          )}

          <span className="bg-amber-600 text-white px-4 md:px-3 lg:px-4 py-1.5 md:py-1 lg:py-1.5 rounded-full text-sm md:text-xs lg:text-sm font-bold shadow-sm">
            {activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""}
          </span>

          {/* Botão de Volume */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-2 md:gap-1 lg:gap-2 px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-full font-bold text-sm md:text-xs lg:text-sm shadow-sm transition-all ${
              audioEnabled
                ? "bg-amber-100 text-amber-800 border-2 border-amber-500"
                : "bg-stone-300 text-stone-600 hover:bg-stone-400"
            }`}
          >
            {audioEnabled ? <>🔊 Som Ativado</> : <>🔇 Som Desativado</>}
          </button>

          {/* Botão de Logout */}
          <button
            onClick={async () => {
              if (window.confirm("Deseja realmente sair?")) {
                await logout();
                navigate("/cozinha/login");
              }
            }}
            className="bg-red-500 text-white font-bold py-2 md:py-1.5 lg:py-2 px-6 md:px-4 lg:px-6 rounded-lg hover:bg-red-600 transition-colors shadow-md text-sm md:text-xs lg:text-sm"
          >
            🚪 Sair
          </button>
        </div>

        {reasoning && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 md:p-2 lg:p-4 rounded-r-lg shadow-sm max-w-4xl">
            <p className="text-sm md:text-xs lg:text-sm font-medium text-blue-900 leading-relaxed md:leading-snug lg:leading-relaxed">
              <strong className="block mb-1 md:mb-0.5 lg:mb-1 text-blue-700">
                💡 Estratégia IA:
              </strong>
              {reasoning}
            </p>
          </div>
        )}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-3 lg:gap-6">
          {activeOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              onComplete={handleCompleteOrder}
              isPriority={index === 0}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
