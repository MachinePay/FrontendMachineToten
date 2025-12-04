import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 mb-2">
            MachineToten
          </h1>
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
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors text-lg disabled:bg-amber-300 disabled:cursor-wait"
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

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
    setUserNotFound(false);
  };

  const searchUserByCPF = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCPF = cpf.replace(/\D/g, "");

    if (!cleanCPF || cleanCPF.length !== 11) {
      setError("CPF inválido. Digite 11 dígitos.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Nova rota do backend para login com CPF
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/login-cpf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cleanCPF, name: "Cliente" })
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer login');
      }

      const user = await response.json();

      // Mostra mensagem apropriada com SweetAlert
      if (user.isNewUser) {
        // Usuário foi criado agora
        await Swal.fire({
          title: '🎉 Bem-vindo!',
          html: `Olá, <strong>${user.name}</strong>!<br><br>Sua conta foi criada com sucesso.<br>Aproveite nossos deliciosos pastéis!`,
          icon: 'success',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Começar Pedido',
          timer: 3000,
          timerProgressBar: true
        });
        onLoginSuccess(user);
      } else {
        // Usuário já existia
        await Swal.fire({
          title: '👋 Bem-vindo de volta!',
          html: `Olá, <strong>${user.name}</strong>!<br><br>Você tem <strong>${user.pontos || 0} pontos</strong> acumulados! 🌟`,
          icon: 'success',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Ver Cardápio',
          timer: 3000,
          timerProgressBar: true
        });
        onLoginSuccess(user);
      }
    } catch (err) {
      setError("Erro ao buscar CPF. Tente novamente.");
      console.error('Erro no login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) {
    return (
      <RegisterScreen
        cpf={cpf}
        onBack={() => {
          setShowRegister(false);
          setUserNotFound(false);
          setCpf("");
        }}
        onRegisterSuccess={onLoginSuccess}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">
            Fazer Login
          </h1>
          <p className="text-stone-600">Digite seu CPF para continuar</p>
        </div>

        <form onSubmit={searchUserByCPF} className="space-y-6">
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
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors text-lg"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          {userNotFound && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>CPF não encontrado!</strong>
                <br />
                Você pode criar uma nova conta com este CPF.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || cpf.replace(/\D/g, "").length !== 11}
            className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors text-lg disabled:bg-amber-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Buscando..." : "Continuar"}
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full mt-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
};

// --- Componente de Registro ---
interface RegisterScreenProps {
  cpf: string;
  onBack: () => void;
  onRegisterSuccess: (user: User) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  cpf,
  onBack,
  onRegisterSuccess,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (!email.includes("@")) {
      setError("Email inválido");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.replace(/\D/g, ""),
        historico: [],
        pontos: 0,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setError("CPF já cadastrado. Faça login.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        // try to read server error message
        let text = "";
        try {
          const data = await res.json();
          text = data && data.error ? data.error : JSON.stringify(data);
        } catch (e) {
          try {
            text = await res.text();
          } catch (e2) {
            text = "";
          }
        }
        console.error("Server error on create user:", res.status, text);
        setError(text || "Falha ao salvar");
        setIsLoading(false);
        return;
      }

      const created = await res.json();
      onRegisterSuccess(created as User);
    } catch (err) {
      console.error(err);
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">
            Criar Conta
          </h1>
          <p className="text-stone-600">
            Complete seus dados para se registrar
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg bg-stone-100 text-stone-600"
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
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-stone-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors text-lg disabled:bg-green-300 disabled:cursor-wait"
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full mt-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
        >
          ← Voltar
        </button>
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
          <h1 className="text-3xl font-bold text-amber-800">Bem-vindo(a)!</h1>
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
          className="w-full flex items-center justify-center p-4 text-lg font-semibold text-white bg-amber-500 rounded-xl border-2 border-amber-500 hover:bg-amber-600 hover:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
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
