import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as apiLogin, isAuthenticated } from "../services/apiService";

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já está logado como admin, redirecionar
    if (currentUser?.role === "admin" || isAuthenticated()) {
      navigate("/admin");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Usa o novo serviço de autenticação JWT
      const success = await apiLogin("admin", password);

      if (success) {
        // Atualiza o contexto local com o usuário admin
        const adminUser = {
          id: "admin_user",
          name: "Administrador",
          historico: [],
          role: "admin" as const,
        };
        login(adminUser);
        navigate("/admin");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            👑 Acesso Administrador
          </h1>
          <p className="text-slate-600">Digite a senha para acessar</p>
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
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-800 transition-colors text-lg disabled:bg-purple-400 disabled:cursor-wait"
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

export default AdminLoginPage;
