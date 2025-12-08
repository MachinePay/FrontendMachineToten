import React, { createContext, useState, useContext, ReactNode } from "react";
import type { User, Order } from "../types";
import { logout as apiLogout } from "../services/apiService";
import { getCurrentStoreId } from "../utils/tenantResolver";

// Define o formato do contexto de autenticação: quais valores e funções estarão disponíveis
interface AuthContextType {
  currentUser: User | null; // usuário atualmente logado ou null se ninguém estiver logado
  login: (user: User) => void; // função para setar o usuário como logado
  logout: () => Promise<void>; // função para deslogar (limpar o usuário e pagamentos)
  addOrderToHistory: (order: Order) => void; // adiciona um pedido ao histórico do usuário
}

// Cria o contexto com um valor inicial indefinido; será provido pelo AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider que envolve a aplicação e fornece o contexto de autenticação
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Estado local que guarda o usuário atual (ou null)
  // Inicializa a partir do localStorage para manter sessão após reload
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (e) {
      return null;
    }
  });

  // Função para realizar o login: recebe um usuário e atualiza o estado
  const login = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  };

  // Função para realizar logout: limpa pagamentos pendentes e depois deslogar
  const logout = async () => {
    try {
      // Limpar qualquer pagamento pendente na fila
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      console.log("🧼 Limpando pagamentos pendentes antes de logout...");

      const storeId = getCurrentStoreId();
      const response = await fetch(`${API_URL}/api/payment/clear-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-store-id": storeId, // 🏪 MULTI-TENANT
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${data.cleared || 0} pagamento(s) limpo(s)`);
      }
    } catch (error) {
      console.warn("⚠️ Erro ao limpar pagamentos (continua logout):", error);
    }

    // Limpar token JWT
    apiLogout();

    // Limpar usuário
    setCurrentUser(null);
    try {
      localStorage.removeItem("currentUser");
    } catch (e) {
      // ignore
    }
  };

  // Adiciona um pedido ao histórico do usuário preservando imutabilidade
  const addOrderToHistory = (order: Order) => {
    setCurrentUser((prevUser) => {
      // Se não houver usuário logado, não faz nada (retorna null)
      if (!prevUser) return null;
      // Retorna um novo objeto de usuário com o histórico atualizado (concatena o novo pedido)
      const next = {
        ...prevUser,
        historico: [...prevUser.historico, order],
      };
      try {
        localStorage.setItem("currentUser", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Providencia os valores/funções do contexto para os componentes filhos
  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, addOrderToHistory }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para consumir o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Garante que o hook seja usado dentro de um AuthProvider; caso contrário lança erro
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
