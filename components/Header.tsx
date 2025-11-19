// Importa React e componentes de roteamento do react-router-dom
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// Importa o contexto de autenticação personalizado
import { useAuth } from '../contexts/AuthContext';

// Define o componente Header como um componente funcional React com tipagem TypeScript
const Header: React.FC = () => {
  // Obtém o usuário atual e a função de logout do contexto de autenticação
  const { currentUser, logout } = useAuth();
  // Hook para navegar entre rotas
  const navigate = useNavigate();

  // Função que faz logout e redireciona para a página inicial
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define o estilo para links ativos (Cardápio, Cozinha, Admin)
  const activeLinkStyle = {
    color: '#a16207', // cor âmbar escuro
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  };

  return (
    // Header sticky no topo da página com sombra
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Container centralizado com padding responsivo */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flexbox para alinhar logo, navegação e user info */}
        <div className="flex items-center justify-between h-16">
          {/* Logo/Título - redireciona para menu se logado, senão para home */}
          <div className="flex-shrink-0">
             <NavLink to={currentUser ? "/menu" : "/"} className="text-2xl font-bold text-amber-600">
              Pastelaria Kiosk Pro
            </NavLink>
          </div>
          
          {/* Navegação - visível apenas em telas médias e maiores */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Mostra links apenas para usuários clientes (não cozinha/admin) */}
            {currentUser && (!currentUser.role || currentUser.role === "customer") && (
              <>
                <NavLink to="/menu" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-stone-600 hover:text-amber-600 transition-colors">Cardápio</NavLink>
              </>
            )}
            {/* Links especiais para cozinha - só aparece se for usuário cozinha */}
            {currentUser && currentUser.role === "kitchen" && (
              <>
                <NavLink to="/cozinha" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-stone-600 hover:text-amber-600 transition-colors">Pedidos</NavLink>
              </>
            )}
            {/* Links especiais para admin - só aparece se for usuário admin */}
            {currentUser && currentUser.role === "admin" && (
              <>
                <NavLink to="/admin" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-stone-600 hover:text-amber-600 transition-colors">Painel Admin</NavLink>
                <NavLink to="/admin/reports" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-stone-600 hover:text-amber-600 transition-colors">Recomendações IA</NavLink>
              </>
            )}
          </nav>
          
          {/* Seção direita - mostra saudação e botão de logout ou mensagem de boas-vindas */}
          <div className="flex items-center">
            {currentUser ? (
              // Se usuário autenticado: mostra nome e botão de logout
              <div className="flex items-center space-x-4">
                <span className="text-stone-700">Olá, {currentUser.name}!</span>
                <button
                  onClick={handleLogout}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105"
                >
                  Sair
                </button>
              </div>
            ) : (
                // Se não autenticado: mostra mensagem de boas-vindas
                <div className="text-stone-600">Bem-vindo!</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
