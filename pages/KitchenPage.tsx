import React, { useState, useEffect, useCallback } from 'react';
import type { Order } from '../types';

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

const OrderCard: React.FC<OrderCardProps> = ({ order, onComplete, isPriority, index }) => {
  const waitingMinutes = getWaitingTime(order.timestamp);
  const isUrgent = waitingMinutes > 10;

  // Determina cor de fundo
  let bgColor = 'bg-white';
  let borderColor = 'border-amber-500';
  
  if (isPriority) {
    bgColor = 'bg-yellow-100';
    borderColor = 'border-yellow-600';
  } else if (isUrgent) {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-500';
  }

  return (
    <div className={`${bgColor} p-6 rounded-xl shadow-lg border-t-4 ${borderColor} relative`}>
      {/* Badge de prioridade */}
      {isPriority && (
        <div className="absolute -top-3 -right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
          ⚡ FAZER AGORA
        </div>
      )}
      
      {/* Badge de urgente */}
      {isUrgent && !isPriority && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          🔥 URGENTE
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          {/* Número da ordem na fila */}
          <div className="text-xs text-stone-500 font-semibold mb-1">
            #{index + 1} na fila
          </div>
          
          <h3 className="font-bold text-xl text-stone-800">
            Pedido #{order.id.slice(-6)}
          </h3>
          
          {order.userName && (
            <p className="text-base text-amber-700 font-semibold">
              Cliente: {order.userName}
            </p>
          )}
          
          {/* Tempo de espera */}
          <p className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-stone-500'}`}>
            ⏱️ Aguardando {waitingMinutes} min
          </p>
        </div>
        
        <span className="font-bold text-lg">R${parseFloat(order.total).toFixed(2)}</span>
      </div>

      {/* Lista de itens */}
      <ul className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex justify-between border-b pb-1">
            <span className="font-medium">{item.quantity}x {item.name}</span>
            <span className="text-stone-600">R${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Botão concluir */}
      <button
        onClick={() => onComplete(order.id)}
        className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition-colors"
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
  const [reasoning, setReasoning] = useState<string>('');

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Busca pedidos otimizados pela IA
  const fetchOrders = useCallback(async () => {
    try {
      console.log('🤖 Buscando pedidos otimizados pela IA...');
      
      const resp = await fetch(`${BACKEND_URL}/api/ai/kitchen-priority`);
      const data: AIKitchenResponse = await resp.json();
      
      console.log(`✅ Recebido ${data.orders.length} pedido(s)`);
      console.log(`🤖 IA: ${data.aiEnabled ? 'Ativa' : 'Desativada'}`);
      console.log(`💡 Reasoning: ${data.reasoning || data.message || 'Nenhum'}`);
      
      setActiveOrders(data.orders);
      setAiEnabled(data.aiEnabled);
      setReasoning(data.reasoning || data.message || '');
      
    } catch (err) {
      console.error('❌ Erro ao carregar pedidos:', err);
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
    console.log('🔄 Concluindo pedido:', orderId);
    
    try {
      // Remove do estado imediatamente (feedback visual)
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Chama backend
      const resp = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, { 
        method: 'DELETE' 
      });
      
      if (!resp.ok) {
        console.error('❌ Falha ao concluir pedido');
        await fetchOrders(); // Resincroniza
      } else {
        console.log('✅ Pedido concluído com sucesso');
      }
    } catch (err) {
      console.error('❌ Erro ao concluir pedido:', err);
      await fetchOrders(); // Resincroniza
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-amber-800 mb-3">
          🍳 Cozinha Inteligente
        </h1>
        
        {/* Badge de status da IA */}
        <div className="flex items-center gap-3 mb-4">
          {aiEnabled ? (
            <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
              🤖 IA Ativa
            </span>
          ) : (
            <span className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-bold">
              📋 Ordem Padrão
            </span>
          )}
          
          {/* Contador de pedidos */}
          <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold">
            {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Reasoning da IA */}
        {reasoning && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow">
            <p className="text-sm font-semibold text-blue-900">
              💡 Estratégia IA: {reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Carregando pedidos...</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-stone-700">🎉 Tudo pronto!</h2>
          <p className="text-stone-500 mt-2">Nenhum pedido ativo no momento.</p>
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
