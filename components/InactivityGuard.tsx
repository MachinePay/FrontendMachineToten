import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const INACTIVITY_MS = 30_000; // 30 seconds
const COUNTDOWN_SECONDS = 10; // 10 seconds grace period

const InactivityGuard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const inactivityTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Lógica atualizada para detectar onde estamos
  const isScreensaver = location.pathname === "/";
  const isKitchen = location.pathname.startsWith("/cozinha");
  const isAdmin = location.pathname.startsWith("/admin");
  const isPayment = location.pathname === "/payment";
  const isLogin = location.pathname === "/login";

  // O guard deve funcionar em:
  // 1. Todas as páginas EXCETO: screensaver, cozinha e admin
  // 2. Página de login TAMBÉM tem guard (para voltar ao vídeo após inatividade)
  // 3. Página de pagamento NÃO tem guard (não pode interromper pagamento)
  const guardEnabled = useMemo(
    () => !isScreensaver && !isKitchen && !isAdmin && !isPayment,
    [isScreensaver, isKitchen, isAdmin, isPayment]
  );

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      // Show prompt after inactivity
      setShowPrompt(true);
      setCountdown(COUNTDOWN_SECONDS);
      // Start countdown
      clearCountdownTimer();
      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // time's up -> logout and go to screensaver
            clearCountdownTimer();
            setShowPrompt(false);
            // Logout and cleanup (async)
            (async () => {
              // Se tiver usuário logado, faz logout
              if (currentUser) {
                await logout();
              }
              try {
                clearCart();
                // Limpa nome de convidado também
                localStorage.removeItem("guestUserName");
              } catch {
                /* ignore */
              }
              navigate("/", { replace: true });
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_MS);
  }, [logout, clearCart, navigate, currentUser]);

  const resetActivity = useCallback(() => {
    if (!guardEnabled) return;
    // If prompt visible, close it and stop countdown
    if (showPrompt) {
      setShowPrompt(false);
      clearCountdownTimer();
      setCountdown(COUNTDOWN_SECONDS);
    }
    // Restart inactivity timer
    startInactivityTimer();
  }, [guardEnabled, showPrompt, startInactivityTimer]);

  useEffect(() => {
    if (!guardEnabled) {
      // disable guard: cleanup timers and prompt
      clearInactivityTimer();
      clearCountdownTimer();
      setShowPrompt(false);
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    // Start first timer when guard enabled
    startInactivityTimer();

    const events: (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "touchstart",
      "wheel",
    ];
    const handler = () => resetActivity();
    events.forEach((evt) =>
      window.addEventListener(evt, handler, { passive: true } as any)
    );

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler as any));
      clearInactivityTimer();
      clearCountdownTimer();
    };
  }, [guardEnabled, startInactivityTimer, resetActivity]);

  if (!guardEnabled) return null;

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] max-w-sm text-center">
            <div className="text-2xl font-semibold mb-2">Ainda está aí?</div>
            <div className="text-stone-600 mb-4">
              Voltaremos ao início em {countdown}s se não houver interação.
            </div>
            <button
              onClick={resetActivity}
              className="px-4 py-2 rounded-md bg-stone-900 text-white hover:bg-stone-800"
            >
              Sim, continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InactivityGuard;
