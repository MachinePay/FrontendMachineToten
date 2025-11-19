import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendMessageToChatbot, startChat } from "../services/geminiService";
import { useAuth } from "../contexts/AuthContext";

// Interface que define a estrutura de uma mensagem
interface Message {
  sender: "user" | "bot"; // Quem enviou: usuário ou bot
  text: string; // Conteúdo da mensagem
}

// Componente principal do Chatbot
const Chatbot: React.FC = () => {
  // Estado para controlar se o chatbot está aberto ou fechado
  const [isOpen, setIsOpen] = useState(false);
  // Lista de mensagens da conversa
  const [messages, setMessages] = useState<Message[]>([]);
  // Texto digitado pelo usuário no input
  const [userInput, setUserInput] = useState("");
  // Estado para indicar se está aguardando resposta do bot
  const [isLoading, setIsLoading] = useState(false);
  // Obtém o usuário autenticado do contexto
  const { currentUser } = useAuth();
  // Referência para scroll automático até o fim das mensagens
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Executa uma única vez ao montar o componente
  useEffect(() => {
    startChat(); // Inicia a sessão de chat
    // Adiciona mensagem inicial de boas-vindas do bot
    setMessages([{ sender: "bot", text: "Olá! Como posso ajudar você hoje?" }]);
  }, []);

  // Função para fazer scroll automático até o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Executa scroll sempre que há novas mensagens
  useEffect(scrollToBottom, [messages]);

  // Função para enviar mensagem (otimizada com useCallback)
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault(); // Previne reload da página
      // Valida se há texto e não está carregando
      if (!userInput.trim() || isLoading) return;

      // Cria e adiciona mensagem do usuário
      const userMessage: Message = { sender: "user", text: userInput };
      setMessages((prev) => [...prev, userMessage]);
      setUserInput(""); // Limpa o input
      setIsLoading(true); // Ativa estado de carregamento

      // Envia mensagem para o serviço e recebe resposta do bot
      const botResponse = await sendMessageToChatbot(userInput);

      // Cria e adiciona resposta do bot
      const botMessage: Message = { sender: "bot", text: botResponse };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false); // Desativa estado de carregamento
    },
    [userInput, isLoading]
  );

  // Se não há usuário autenticado, não renderiza nada
  if (!currentUser) return null;

  return (
    <>
      {/* Botão flutuante para abrir/fechar o chatbot */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-amber-600 text-white rounded-full p-4 shadow-lg hover:bg-amber-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          aria-label="Open chatbot"
        >
          {/* Ícone de chat */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8.5z"></path>
          </svg>
        </button>
      </div>

      {/* Janela do chatbot (aparece quando isOpen é true) */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 transform transition-all duration-300 ease-out origin-bottom-right scale-100">
          {/* Cabeçalho do chatbot */}
          <div className="bg-amber-600 text-white p-3 rounded-t-lg">
            <h3 className="font-semibold text-center">Atendente Virtual</h3>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-stone-50">
            {/* Renderiza cada mensagem da conversa */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex my-2 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-xs shadow ${
                    msg.sender === "user"
                      ? "bg-amber-200 text-amber-900"
                      : "bg-stone-200 text-stone-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Indicador de carregamento (animação de pontos) */}
            {isLoading && (
              <div className="flex justify-start my-2">
                <div className="rounded-lg px-3 py-2 max-w-xs shadow bg-stone-200 text-stone-800">
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-stone-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Referência para scroll automático */}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de entrada de mensagem */}
          <form onSubmit={handleSendMessage} className="p-2 border-t flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isLoading} // Desabilita enquanto aguarda resposta
            />
            {/* Botão de envio com ícone de seta */}
            <button
              type="submit"
              className="bg-amber-600 text-white px-4 rounded-r-md hover:bg-amber-700 disabled:bg-amber-300"
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
