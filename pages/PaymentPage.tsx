import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import type { Order } from "../types";

// URL do Backend
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PaymentPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser, addOrderToHistory } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<
    "credit" | "debit" | "pix" | null
  >(null);
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Se o carrinho estiver vazio, volta para o menu
  useEffect(() => {
    if (cartItems.length === 0 && status !== "success") {
      navigate("/menu");
    }
  }, [cartItems, navigate, status]);

  const handlePayment = async () => {
    if (!paymentMethod || !currentUser) return;

    setStatus("processing");

    try {
      // 1. Simular tempo de processamento da maquininha/gateway
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Montar payload do pedido
      const payload = {
        userId: currentUser.id,
        userName: currentUser.name,
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: cartTotal,
        paymentMethod: paymentMethod, // Enviando o método escolhido para o backend
        status: "paid", // Assumindo que o pagamento foi aprovado na simulação
      };

      // 3. Enviar para o seu Backend
      const resp = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error("Falha ao registrar pedido");

      const savedOrder: Order = await resp.json();

      // 4. Sucesso
      addOrderToHistory(savedOrder);
      setStatus("success");
      clearCart();

      // 5. Redirecionar após 5 segundos (Screensaver ou Menu)
      setTimeout(() => {
        navigate("/"); // Vai para o screensaver/início
      }, 5000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Erro ao processar pagamento. Tente novamente.");
      setTimeout(() => setStatus("idle"), 3000);
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

          {status === "error" && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center font-semibold">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={!paymentMethod || status === "processing"}
            className={`mt-4 w-full py-4 rounded-xl font-bold text-xl transition-all transform shadow-lg
              ${
                !paymentMethod || status === "processing"
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 hover:scale-105"
              }`}
          >
            {status === "processing"
              ? "Processando..."
              : `Pagar R$ ${cartTotal.toFixed(2)}`}
          </button>
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
