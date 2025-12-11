import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as apiLogin, isAuthenticated } from "../services/apiService";
import { getCurrentStoreId } from "../utils/tenantResolver"; // 🏪 MULTI-TENANT

const KitchenLoginPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const storeId = getCurrentStoreId(); // 🏪 Identifica a loja atual

  useEffect(() => {
    // Se já está logado como cozinha, redirecionar
    if (currentUser?.role === "kitchen" || isAuthenticated()) {
      navigate("/cozinha");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Usa o novo serviço de autenticação JWT
      const success = await apiLogin("kitchen", password);

      if (success) {
        // Atualiza o contexto local com o usuário da cozinha
        const kitchenUser = {
          id: "kitchen_user",
          name: "Cozinha",
          historico: [],
          role: "kitchen" as const,
        };
        login(kitchenUser);
        navigate("/cozinha");
      } else {
        setError("Senha incorreta");
        setPassword("");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <img
            src="/selfMachine.jpg"
            alt="Self Machine"
            className="w-32 h-auto mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🍳 Acesso Cozinha
          </h1>
          <p className="text-slate-600">Digite a senha para acessar</p>
          {/* 🏪 Mostra qual loja está sendo acessada */}
          <div className="mt-3 inline-block bg-slate-100 text-slate-800 px-4 py-2 rounded-full text-sm font-semibold">
            🏪 Loja: <span className="font-mono">{storeId}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Digite a senha"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-slate-500 transition-colors"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors text-lg disabled:bg-slate-400 disabled:cursor-wait"
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default KitchenLoginPage;
