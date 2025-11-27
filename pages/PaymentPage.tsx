import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { clearPaymentQueue } from "../services/pointService";
import type { Order } from "../types";

// URL do Backend
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PaymentPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser, addOrderToHistory, logout } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<
    "credit" | "debit" | "pix" | null
  >(null);

  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState("");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  
  // Estados específicos para PIX com QR Code
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  
  // Refs para controlar pagamento ativo e permitir cancelamento
  const activePaymentId = useRef<string | null>(null);
  const activePaymentType = useRef<'pix' | 'card' | null>(null);
  const shouldCancelPolling = useRef(false);

  // ❌ FUNÇÃO PARA CANCELAR PAGAMENTO
  const handleCancelPayment = async () => {
    if (!activePaymentId.current) return;

    const confirmCancel = window.confirm(
      '⚠️ Tem certeza que deseja cancelar este pagamento?'
    );

    if (!confirmCancel) return;

    try {
      console.log(`🚫 Cancelando pagamento: ${activePaymentId.current}`);
      
      // Para o polling
      shouldCancelPolling.current = true;

      // Chama API de cancelamento
      const response = await fetch(
        `${BACKEND_URL}/api/payment/cancel/${activePaymentId.current}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        console.log('✅ Pagamento cancelado com sucesso');
      }

      // Limpa estados
      activePaymentId.current = null;
      activePaymentType.current = null;
      setQrCodeBase64(null);
      setPixPaymentId(null);
      setStatus('idle');
      setPaymentStatusMessage('');
      setPaymentMethod(null);

    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
      alert('Erro ao cancelar pagamento. Tente novamente.');
    }
  };

  // Se o carrinho estiver vazio, volta para o menu
  useEffect(() => {
    if (cartItems.length === 0 && status !== "success") {
      navigate("/menu");
    }
  }, [cartItems, navigate, status]);

  // Cleanup: Cancela pagamento se usuário sair da página
  useEffect(() => {
    return () => {
      if (activePaymentId.current && status === 'processing') {
        console.log('⚠️ Usuário saiu da página - cancelando pagamento...');
        shouldCancelPolling.current = true;
        
        // Cancela assincronamente (não bloqueia navegação)
        fetch(`${BACKEND_URL}/api/payment/cancel/${activePaymentId.current}`, {
          method: 'DELETE'
        }).catch(console.error);
      }
    };
  }, [status]);

  // 🎯 FUNÇÃO PARA PAGAMENTO PIX (QR Code)
  const handlePixPayment = async () => {
    setStatus("processing");
    setPaymentStatusMessage("Criando pedido...");
    shouldCancelPolling.current = false;

    try {
      // 1. PRIMEIRO: Criar pedido (desconta estoque no backend)
      const orderResp = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser!.id,
          userName: currentUser!.name,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: cartTotal,
          paymentId: null, // Ainda não temos o paymentId
        }),
      });

      if (!orderResp.ok) {
        throw new Error("Erro ao criar pedido");
      }

      const orderData = await orderResp.json();
      const orderId = orderData.id; // ID real: "order_123456789"
      console.log(`✅ Pedido criado: ${orderId}`);

      // 2. DEPOIS: Criar pagamento PIX com orderId real
      setPaymentStatusMessage("Gerando QR Code PIX...");
      const createResp = await fetch(`${BACKEND_URL}/api/pix/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          description: `Pedido de ${currentUser!.name}`,
          orderId: orderId, // USA O ID DO PEDIDO CRIADO
        }),
      });

      const pixData = await createResp.json();

      if (!createResp.ok || !pixData.paymentId || !pixData.qrCodeBase64) {
        throw new Error(pixData.error || "Erro ao gerar QR Code PIX");
      }

      // 2. Registrar pagamento ativo
      activePaymentId.current = pixData.paymentId;
      activePaymentType.current = 'pix';

      // 3. Exibir QR Code
      setQrCodeBase64(pixData.qrCodeBase64);
      setPixPaymentId(pixData.paymentId);
      setPaymentStatusMessage("Escaneie o QR Code com seu banco...");

      // 4. Polling: Verificar status do PIX a cada 3 segundos
      let attempts = 0;
      const maxAttempts = 60; // 3 minutos de espera
      let approved = false;

      while (attempts < maxAttempts && !approved && !shouldCancelPolling.current) {
        await new Promise((r) => setTimeout(r, 3000));

        // Verifica se foi cancelado durante o sleep
        if (shouldCancelPolling.current) {
          console.log('⚠️ Polling PIX cancelado pelo usuário');
          throw new Error('Pagamento cancelado');
        }

        const statusResp = await fetch(
          `${BACKEND_URL}/api/pix/status/${pixData.paymentId}`
        );
        const statusData = await statusResp.json();

        console.log("Status PIX:", statusData.status);

        if (statusData.status === "approved") {
          approved = true;
        }
        attempts++;
      }

      if (!approved) {
        throw new Error("Tempo esgotado. PIX não foi pago.");
      }

      // 5. Atualizar pedido com paymentId
      await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pixData.paymentId, paymentStatus: "paid" }),
      });

      // 6. Sucesso - adicionar ao histórico e limpar carrinho
      activePaymentId.current = null;
      activePaymentType.current = null;
      addOrderToHistory(orderData);
      setStatus("success");
      clearCart();
      setQrCodeBase64(null);

      // Redirecionar após 5 segundos
      setTimeout(async () => {
        await logout();
        navigate("/", { replace: true });
      }, 5000);
    } catch (err: any) {
      console.error("Erro PIX:", err);
      activePaymentId.current = null;
      activePaymentType.current = null;
      setStatus("error");
      setErrorMessage(err.message || "Erro ao processar pagamento PIX.");
      setQrCodeBase64(null);
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  // 💳 FUNÇÃO PARA PAGAMENTO COM CARTÃO (Maquininha)
  const handleCardPayment = async () => {
    setStatus("processing");
    setPaymentStatusMessage("Criando pedido...");
    shouldCancelPolling.current = false;

    try {
      // 1. PRIMEIRO: Criar pedido (desconta estoque no backend)
      const orderResp = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser!.id,
          userName: currentUser!.name,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: cartTotal,
          paymentId: null,
        }),
      });

      if (!orderResp.ok) {
        throw new Error("Erro ao criar pedido");
      }

      const orderData = await orderResp.json();
      const orderId = orderData.id;
      console.log(`✅ Pedido criado: ${orderId}`);

      // 2. DEPOIS: Criar pagamento na maquininha com orderId real
      setPaymentStatusMessage("Conectando com a maquininha...");
      const createResp = await fetch(`${BACKEND_URL}/api/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          description: `Pedido de ${currentUser!.name}`,
          orderId: orderId, // USA O ID DO PEDIDO CRIADO
          paymentMethod: paymentMethod, // credit ou debit
        }),
      });

      const paymentData = await createResp.json();

      if (!createResp.ok || !paymentData.id) {
        throw new Error(
          paymentData.error || "Erro ao conectar com a maquininha"
        );
      }

      // 2. Registrar pagamento ativo
      activePaymentId.current = paymentData.id;
      activePaymentType.current = 'card';

      // 3. Polling: Verificar status na maquininha
      setPaymentStatusMessage("Aguardando pagamento na maquininha...");

      let attempts = 0;
      const maxAttempts = 60;
      let approved = false;

      while (attempts < maxAttempts && !approved && !shouldCancelPolling.current) {
        await new Promise((r) => setTimeout(r, 3000));

        // Verifica se foi cancelado
        if (shouldCancelPolling.current) {
          console.log('⚠️ Polling cartão cancelado pelo usuário');
          throw new Error('Pagamento cancelado');
        }

        const statusResp = await fetch(
          `${BACKEND_URL}/api/payment/status/${paymentData.id}`
        );
        const statusData = await statusResp.json();

        console.log("Status Maquininha:", statusData.status);

        if (
          statusData.status === "approved" ||
          statusData.status === "FINISHED"
        ) {
          approved = true;
        }
        attempts++;
      }

      if (!approved) {
        throw new Error("Tempo esgotado ou pagamento não identificado.");
      }

      // 4. Atualizar pedido com paymentId
      await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: paymentData.id, paymentStatus: "paid" }),
      });

      // 5. Limpar fila da Point Pro 2
      setPaymentStatusMessage("Liberando maquininha...");
      const clearResult = await clearPaymentQueue();

      if (!clearResult.success) {
        console.warn("⚠️ Aviso: Não foi possível limpar a fila completamente");
      }

      // 6. Sucesso - adicionar ao histórico e limpar carrinho
      activePaymentId.current = null;
      activePaymentType.current = null;
      addOrderToHistory(orderData);
      setStatus("success");
      clearCart();

      // Redirecionar após 5 segundos
      setTimeout(async () => {
        await logout();
        navigate("/", { replace: true });
      }, 5000);
    } catch (err: any) {
      console.error("Erro Cartão:", err);
      activePaymentId.current = null;
      activePaymentType.current = null;
      setStatus("error");
      setErrorMessage(err.message || "Erro ao processar pagamento com cartão.");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };



  // 🚀 FUNÇÃO PRINCIPAL: Direciona para PIX ou Cartão
  const handlePayment = async () => {
    // Validação crítica
    if (!paymentMethod) {
      console.error('❌ Método de pagamento não especificado!');
      setErrorMessage('Por favor, selecione a forma de pagamento (PIX, Débito ou Crédito)');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (!currentUser) {
      console.error('❌ Usuário não autenticado!');
      return;
    }

    // Direciona para função específica
    if (paymentMethod === "pix") {
      await handlePixPayment();
    } else {
      await handleCardPayment();
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 animate-fade-in-down">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-2">
            Pagamento Aprovado!
          </h2>
          <p className="text-stone-600 text-lg mb-6">
            Seu pedido foi enviado para a cozinha.
          </p>
          <p className="text-sm text-stone-400">
            Redirecionando em instantes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-amber-800 mb-8 flex items-center gap-2">
        <button
          onClick={() => navigate("/menu")}
          className="text-amber-600 hover:bg-amber-100 p-2 rounded-full"
          disabled={status === "processing"}
        >
          ←
        </button>
        Finalizar Pagamento
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resumo do Pedido */}
        <div className="bg-white p-6 rounded-2xl shadow-lg h-fit">
          <h2 className="text-xl font-bold text-stone-800 mb-4 border-b pb-2">
            Resumo do Pedido
          </h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between text-stone-600">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-lg text-stone-500">Total a pagar:</span>
            <span className="text-3xl font-bold text-amber-600">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Seleção de Método */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-800">
            Escolha a forma de pagamento:
          </h2>

          <PaymentOption
            label="Cartão de Crédito"
            icon="💳"
            selected={paymentMethod === "credit"}
            onClick={() => setPaymentMethod("credit")}
          />
          <PaymentOption
            label="Cartão de Débito"
            icon="💳"
            selected={paymentMethod === "debit"}
            onClick={() => setPaymentMethod("debit")}
          />
          <PaymentOption
            label="PIX"
            icon="💠"
            selected={paymentMethod === "pix"}
            onClick={() => setPaymentMethod("pix")}
          />

          {/* Mensagem de Status ou QR Code PIX */}
          {status === "processing" && !qrCodeBase64 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded animate-pulse">
              <p className="text-blue-800 font-semibold text-center">
                {paymentStatusMessage}
              </p>
            </div>
          )}

          {/* QR Code PIX */}
          {status === "processing" && qrCodeBase64 && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 p-6 rounded-2xl shadow-xl animate-fade-in-down">
              <h3 className="text-center text-purple-900 font-bold text-xl mb-4 flex items-center justify-center gap-2">
                💠 Pague com PIX
              </h3>
              
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl shadow-lg mx-auto w-fit mb-4">
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="QR Code PIX" 
                  className="w-64 h-64 mx-auto"
                />
              </div>

              {/* Instruções */}
              <div className="text-center space-y-2">
                <p className="text-purple-800 font-semibold animate-pulse">
                  {paymentStatusMessage}
                </p>
                <div className="text-sm text-purple-600 space-y-1">
                  <p>📱 Abra o app do seu banco</p>
                  <p>📷 Escaneie o QR Code</p>
                  <p>✅ Confirme o pagamento</p>
                </div>
                <p className="text-xs text-purple-400 mt-4">
                  Aguardando confirmação...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Botão de Pagamento ou Cancelar */}
          {status === "processing" ? (
            <button
              onClick={handleCancelPayment}
              className="mt-4 w-full py-4 rounded-xl font-bold text-xl transition-all transform shadow-lg bg-red-600 text-white hover:bg-red-700 hover:scale-105"
            >
              ❌ Cancelar Pagamento
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={!paymentMethod}
              className={`mt-4 w-full py-4 rounded-xl font-bold text-xl transition-all transform shadow-lg ${
                !paymentMethod
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 hover:scale-105"
              }`}
            >
              Pagar R$ {cartTotal.toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente visual para os botões de seleção
const PaymentOption: React.FC<{
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, icon, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 text-left
      ${
        selected
          ? "border-amber-500 bg-amber-50 shadow-md transform scale-102"
          : "border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50"
      }`}
  >
    <span className="text-3xl">{icon}</span>
    <span
      className={`font-semibold text-lg ${
        selected ? "text-amber-900" : "text-stone-600"
      }`}
    >
      {label}
    </span>
    {selected && <span className="ml-auto text-amber-600 font-bold">✓</span>}
  </button>
);

export default PaymentPage;
