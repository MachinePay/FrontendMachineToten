import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getCurrentStoreId } from "../utils/tenantResolver"; // 🏪 MULTI-TENANT
import type { User } from "../types";

// --- Componente WelcomeScreen ---
interface WelcomeScreenProps {
  onNameSubmit: (name: string) => void;
  isLoading?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNameSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Por favor, digite seu nome");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    onNameSubmit(trimmedName);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-stone-100 to-red-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-center mb-8">
          <img
            src="/selfMachine.jpg"
            alt="Self Machine"
            className="w-48 h-auto mx-auto mb-6 rounded-xl shadow-lg"
          />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Sushi Man</h1>
          <p className="text-stone-600">
            Bem-vindo à nossa deliciosa experiência!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-stone-700 mb-2"
            >
              Como você se chama?
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors text-lg disabled:bg-red-300 disabled:cursor-wait"
          >
            {isLoading ? "Carregando..." : "Começar Pedido"}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Você poderá fazer login depois para ganhar pontos! ⭐
        </p>
      </div>
    </div>
  );
};

// --- Componente Login por CPF ---
interface CPFLoginProps {
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
}

const CPFLogin: React.FC<CPFLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [cleanedCPF, setCleanedCPF] = useState("");

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 11);
    return limited
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
    setError("");
    setRequiresRegistration(false);
    setName("");
  };

  // PASSO 1: Verificar se CPF existe
  const checkCPF = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCPF = cpf.replace(/\D/g, "");

    if (!cleanCPF || cleanCPF.length !== 11) {
      setError("CPF inválido. Digite 11 dígitos.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCleanedCPF(cleanCPF);

    try {
      const storeId = getCurrentStoreId();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/users/check-cpf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-store-id": storeId, // 🏪 MULTI-TENANT
          },
          body: JSON.stringify({ cpf: cleanCPF }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao verificar CPF");
      }

      const data = await response.json();

      if (data.exists && data.user) {
        // Usuário encontrado - fazer login direto
        await Swal.fire({
          title: "👋 Bem-vindo de volta!",
          html: `Olá, <strong>${
            data.user.name
          }</strong>!<br><br>Você tem <strong>${
            data.user.pontos || 0
          } pontos</strong> acumulados! 🌟`,
          icon: "success",
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Ver Cardápio",
          timer: 3000,
          timerProgressBar: true,
        });
        onLoginSuccess(data.user);
      } else if (data.requiresRegistration) {
        // CPF não encontrado - pedir nome para cadastro
        setRequiresRegistration(true);
      }
    } catch (err) {
      setError("Erro ao verificar CPF. Tente novamente.");
      console.error("Erro ao verificar CPF:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // PASSO 2: Cadastrar novo usuário com nome
  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const storeId = getCurrentStoreId();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-store-id": storeId, // 🏪 MULTI-TENANT
          },
          body: JSON.stringify({ cpf: cleanedCPF, name: name.trim() }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          setError("CPF já cadastrado. Tente fazer login.");
          setRequiresRegistration(false);
          setName("");
          return;
        }
        throw new Error("Erro ao cadastrar");
      }

      const data = await response.json();

      if (data.success && data.user) {
        await Swal.fire({
          title: "🎉 Bem-vindo!",
          html: `Olá, <strong>${data.user.name}</strong>!<br><br>Sua conta foi criada com sucesso.<br>Aproveite nossos deliciosos pastéis!`,
          icon: "success",
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Começar Pedido",
          timer: 3000,
          timerProgressBar: true,
        });
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError("Erro ao cadastrar. Tente novamente.");
      console.error("Erro ao cadastrar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-stone-100 to-red-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {requiresRegistration ? "Cadastrar Conta" : "Fazer Login"}
          </h1>
          <p className="text-stone-600">
            {requiresRegistration
              ? "Complete seu cadastro com seu nome"
              : "Digite seu CPF para continuar"}
          </p>
        </div>

        {!requiresRegistration ? (
          // PASSO 1: Formulário de CPF
          <form onSubmit={checkCPF} className="space-y-6">
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-red-600 transition-colors text-lg"
                autoFocus
                disabled={isLoading}
              />
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || cpf.replace(/\D/g, "").length !== 11}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors text-lg disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          // PASSO 2: Formulário de Cadastro com Nome
          <form onSubmit={registerUser} className="space-y-6">
            <div>
              <label
                htmlFor="cpf-display"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                CPF
              </label>
              <input
                id="cpf-display"
                type="text"
                value={cpf}
                disabled
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg bg-stone-100 text-stone-600 text-lg"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-red-600 transition-colors text-lg"
                autoFocus
                disabled={isLoading}
              />
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="text-sm text-red-800">
                <strong>🎉 CPF não cadastrado!</strong>
                <br />
                Vamos criar sua conta. Digite seu nome para continuar.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || name.trim().length < 3}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors text-lg disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequiresRegistration(false);
                setName("");
                setError("");
              }}
              className="w-full py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
            >
              ← Voltar para CPF
            </button>
          </form>
        )}

        {!requiresRegistration && (
          <button
            onClick={onBack}
            className="w-full mt-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
};

// --- Componente LoginPage Principal ---
const LoginPage: React.FC = () => {
  const [guestUserName, setGuestUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCPFLogin, setShowCPFLogin] = useState(false);
  const { login, currentUser } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Sempre limpar o nome quando entrar na página de login
    localStorage.removeItem("guestUserName");
    setGuestUserName(null);
  }, []);

  // Se já estiver logado, navegar automaticamente para /menu
  useEffect(() => {
    if (currentUser) {
      // naviga no próximo tick para evitar conflitos com render
      setTimeout(() => navigate("/menu"), 0);
    }
  }, [currentUser, navigate]);

  // Função chamada quando o usuário digita seu nome na boas-vindas
  const handleNameSubmit = async (name: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Armazenar nome no localStorage para usar na MenuPage
      localStorage.setItem("guestUserName", name);
      setGuestUserName(name);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao processar nome:", error);
      setIsLoading(false);
    }
  };

  // Continuar como convidado - cria um usuário 'guest' temporário, faz login e navega para menu
  const handleGuestContinue = () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: guestUserName || "Convidado",
      historico: [],
      role: "customer",
    };

    // Limpa o carrinho antes de fazer login
    clearCart();
    // Seta o usuário como logado (mesmo que seja convidado) para permitir o acesso às rotas protegidas
    login(guestUser);
    // Navegar no próximo tick para garantir que o AuthProvider atualize `currentUser`
    setTimeout(() => navigate("/menu"), 0);
  };

  // Fazer login por CPF
  const handleCPFLoginClick = () => {
    setShowCPFLogin(true);
  };

  // Sucesso no login por CPF
  const handleLoginSuccess = (user: User) => {
    // Limpa o carrinho antes de fazer login
    clearCart();
    login(user);
    // Limpar nome de convidado quando faz login
    localStorage.removeItem("guestUserName");
    // Navegar no próximo tick para garantir que o AuthProvider atualize `currentUser`
    setTimeout(() => navigate("/menu"), 0);
  };

  // Se mostrando tela de login por CPF
  if (showCPFLogin) {
    return (
      <CPFLogin
        onBack={() => setShowCPFLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Se não tem nome, mostrar tela de boas-vindas
  if (!guestUserName) {
    return (
      <WelcomeScreen onNameSubmit={handleNameSubmit} isLoading={isLoading} />
    );
  }

  // Se tem nome, mostrar opções de continuar como convidado ou fazer login
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Bem-vindo(a)!</h1>
          <p className="mt-2 text-stone-600">
            Olá, <strong>{guestUserName}</strong>!
          </p>
          <p className="mt-4 text-sm text-stone-600">
            Você pode continuar como convidado ou fazer login para ganhar
            pontos.
          </p>
        </div>

        {/* Botão para continuar como convidado */}
        <button
          onClick={handleGuestContinue}
          className="w-full flex items-center justify-center p-4 text-lg font-semibold text-white bg-red-600 rounded-xl border-2 border-red-600 hover:bg-red-700 hover:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          🚀 Continuar como Convidado
        </button>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-1 border-t-2 border-stone-200"></div>
          <span className="px-3 text-stone-500 text-sm">ou</span>
          <div className="flex-1 border-t-2 border-stone-200"></div>
        </div>

        {/* Texto para login */}
        <div className="text-center">
          <p className="text-sm text-stone-600 mb-4">
            ⭐ Faça login com seu CPF para acumular pontos e acessar seu
            histórico!
          </p>
        </div>

        {/* Botão para login por CPF */}
        <button
          onClick={handleCPFLoginClick}
          className="w-full flex items-center justify-center p-4 text-lg font-semibold text-stone-700 bg-blue-50 rounded-xl border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          🔐 Fazer Login com CPF
        </button>

        {/* Botão para trocar de nome */}
        <button
          onClick={() => {
            localStorage.removeItem("guestUserName");
            setGuestUserName(null);
          }}
          className="w-full py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
