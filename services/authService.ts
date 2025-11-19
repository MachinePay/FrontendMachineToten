import type { User } from "../types";

// Configuração da URL da API via variável de ambiente
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/api`;

// Validar CPF (formato básico)
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");
  return cleanCPF.length === 11;
};

// Buscar usuário por CPF via API
export const findUserByCPF = async (cpf: string): Promise<User | null> => {
  try {
    // server.js expõe GET /api/users (lista). Buscamos todos e filtramos pelo CPF.
    const resp = await fetch(`${API_URL}/users`);
    if (!resp.ok) return null;
    const users: User[] = await resp.json();
    const clean = String(cpf).replace(/\D/g, "");
    const match = users.find(
      (u) => u.cpf && String(u.cpf).replace(/\D/g, "") === clean
    );
    return match || null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
};

// Registrar novo usuário via API
export const registerUser = async (userData: {
  name: string;
  cpf: string;
  email: string;
  telefone: string;
}): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      console.error("Erro ao registrar:", data.error || data);
      return null;
    }
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return null;
  }
};

// Salvar pedido via API
export const saveOrder = async (
  userId: string,
  items: any[],
  total: number
) => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        items,
        total,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return data.order;
    } else {
      console.error("Erro ao salvar pedido:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    return null;
  }
};

// Obter histórico do usuário via API
export const getUserHistory = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/historico`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    return [];
  }
};
