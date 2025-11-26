import React, { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import LoginPage from "./pages/LoginPage";
import MenuPage from "./pages/MenuPage";
import PaymentPage from "./pages/PaymentPage"; // Nova importação
import KitchenPage from "./pages/KitchenPage";
import KitchenLoginPage from "./pages/KitchenLoginPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import ScreensaverPage from "./pages/ScreensaverPage";
import Header from "./components/Header";
import Chatbot from "./components/Chatbot";
import InactivityGuard from "./components/InactivityGuard";
import { configurePoint, checkPointStatus } from "./services/pointService";
import type { UserRole } from "./types";

// Proteção de rota para clientes (customer)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // Se for kitchen ou admin, redirecionar para suas respectivas páginas
  if (currentUser.role === "kitchen") {
    return <Navigate to="/cozinha" replace />;
  }
  if (currentUser.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

// Proteção de rota por role específico
const RoleProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = "/login" }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const userRole = currentUser.role || "customer";
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // Configurar Point Smart 2 na inicialização do sistema
  useEffect(() => {
    const initializePoint = async () => {
      console.log('🚀 Inicializando Point Smart 2...');
      
      // 1. Configurar Point em modo PDV (bloqueia menu da maquininha)
      const configResult = await configurePoint();
      
      // 2. Verificar status da conexão (opcional, para debug)
      if (configResult.success) {
        const statusResult = await checkPointStatus();
        
        if (statusResult.connected) {
          console.log('✅ Sistema pronto para receber pagamentos');
          console.log(`📱 Dispositivo: ${statusResult.model || 'Point Smart 2'}`);
          console.log(`⚙️ Modo: ${statusResult.operating_mode || 'PDV'}`);
        }
      } else {
        console.warn('⚠️ Point não disponível - pagamentos podem não funcionar');
        console.warn('💡 Verifique se a maquininha está ligada e conectada');
      }
    };
    
    // Executa inicialização ao iniciar o sistema
    initializePoint();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <RouterBody />
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
};

const RouterBody: React.FC = () => {
  const location = useLocation();
  const isScreensaver = location.pathname === "/";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <InactivityGuard />
      {!isScreensaver && <Header />}
      <main className={isScreensaver ? "" : "p-4 md:p-8"}>
        <Routes>
          <Route path="/" element={<ScreensaverPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Rota protegida para clientes */}
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <MenuPage />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida para pagamento (NOVA) */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/* Rotas de login especiais (sem botão, só por URL) */}
          <Route path="/cozinha/login" element={<KitchenLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Rota protegida para cozinha */}
          <Route
            path="/cozinha"
            element={
              <RoleProtectedRoute
                allowedRoles={["kitchen"]}
                redirectTo="/cozinha/login"
              >
                <KitchenPage />
              </RoleProtectedRoute>
            }
          />

          {/* Rota protegida para admin */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute
                allowedRoles={["admin"]}
                redirectTo="/admin/login"
              >
                <AdminPage />
              </RoleProtectedRoute>
            }
          />

          {/* Rota protegida para relatórios do admin */}
          <Route
            path="/admin/reports"
            element={
              <RoleProtectedRoute
                allowedRoles={["admin"]}
                redirectTo="/admin/login"
              >
                <AdminReportsPage />
              </RoleProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isScreensaver && <Chatbot />}
    </div>
  );
};

export default App;
