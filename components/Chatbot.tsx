import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendMessageToChatbot, startChat } from "../services/geminiService";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startChat();
      setMessages([
        {
          sender: "bot",
          text: `Olá ${
            currentUser?.name || ""
          }! Como posso ajudar com seu pedido hoje?`,
        },
      ]);
    }
  }, [isOpen, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!userInput.trim() || isLoading) return;

      const userMessage: Message = { sender: "user", text: userInput };
      setMessages((prev) => [...prev, userMessage]);
      setUserInput("");
      setIsLoading(true);

      const botResponse = await sendMessageToChatbot(userInput);

      const botMessage: Message = { sender: "bot", text: botResponse };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    },
    [userInput, isLoading]
  );

  if (!currentUser) return null;

  return (
    <div className="relative">
      {/* Botão do Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
          isOpen
            ? "bg-red-100 text-red-700"
            : "text-stone-500 hover:bg-stone-100 hover:text-red-600"
        }`}
        title="Ajuda com IA"
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
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="hidden md:inline text-sm font-medium">Ajuda</span>
      </button>

      {/* Janela do Chat (Dropdown) */}
      {isOpen && (
        <>
          {/* Overlay invisível para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-12 w-80 sm:w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-stone-200 overflow-hidden animate-fade-in-down origin-top-right">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-sm">Atendente Virtual</h3>
                  <p className="text-xs text-red-100">Sushi Man AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1"
              >
                ✕
              </button>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 p-4 overflow-y-auto bg-stone-50 scrollbar-thin">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[85%] text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-red-600 text-white rounded-br-none"
                        : "bg-white text-stone-700 border border-stone-100 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-stone-100"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 px-4 py-2 bg-stone-100 border-0 rounded-full focus:ring-2 focus:ring-red-600 focus:bg-white transition-all text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  disabled={isLoading || !userInput.trim()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
