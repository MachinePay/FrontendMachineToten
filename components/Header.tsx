import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext"; // 🏪 MULTI-TENANT
import Chatbot from "./Chatbot"; // Importação adicionada

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { store } = useStore(); // 🏪 Obtém configurações da loja
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const activeLinkStyle = {
    color: "#dc2626", // red-600 - tema japonês
    fontWeight: 600,
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <NavLink
            to={currentUser ? "/menu" : "/"}
            className="flex items-center gap-2 group"
          >
            {store.logo ? (
              <img
                src={store.logo}
                alt={`${store.name} logo`}
                className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-xl shadow-sm group-hover:scale-105 transition-transform">
                🍣
              </div>
            )}
            <span className="text-xl font-bold text-stone-800 tracking-tight">
              {store.name}
            </span>
          </NavLink>
        </div>

        {/* Navegação Central (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {currentUser &&
            (!currentUser.role || currentUser.role === "customer") && (
              <NavLink
                to="/menu"
                style={({ isActive }) =>
                  isActive ? activeLinkStyle : undefined
                }
                className="text-stone-500 hover:text-red-600 transition-colors font-medium"
              >
                Cardápio
              </NavLink>
            )}

          {currentUser?.role === "kitchen" && (
            <NavLink
              to="/cozinha"
              style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
              className="text-stone-500 hover:text-red-600 transition-colors font-medium"
            >
              Pedidos Cozinha
            </NavLink>
          )}

          {currentUser?.role === "admin" && (
            <>
              <NavLink
                to="/admin"
                style={({ isActive }) =>
                  isActive ? activeLinkStyle : undefined
                }
                className="text-stone-500 hover:text-red-600 transition-colors font-medium"
              >
                Produtos
              </NavLink>
              <NavLink
                to="/admin/reports"
                style={({ isActive }) =>
                  isActive ? activeLinkStyle : undefined
                }
                className="text-stone-500 hover:text-red-600 transition-colors font-medium"
              >
                Relatórios IA
              </NavLink>
            </>
          )}
        </nav>

        {/* Área do Usuário (Direita) */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              {/* Chatbot agora mora aqui no Header */}
              <Chatbot />

              <div className="h-6 w-px bg-stone-200 mx-1"></div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-xs text-stone-400 font-medium">Olá,</p>
                  <p className="text-sm font-bold text-stone-700 max-w-[100px] truncate">
                    {currentUser.name}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                  title="Sair"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <span className="text-sm text-stone-500">Bem-vindo!</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
