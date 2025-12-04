import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Lista de vídeos disponíveis na pasta public/videos
const LOCAL_VIDEOS = [
  '/videos/videoscreensave.mp4',
];

export default function ScreensaverPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [videos] = useState<string[]>(LOCAL_VIDEOS);
  const [videoError, setVideoError] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (videos.length === 0) return;

    // Troca de vídeo a cada 5 segundos
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % videos.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [videos.length]);

  useEffect(() => {
    // Qualquer clique na tela leva para login
    const handleClick = () => {
      navigate('/login');
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [navigate]);

  const handleVideoError = () => {
    console.error('Erro ao carregar vídeo:', videos[current]);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      {!videoError && videos.length > 0 ? (
        <>
          <video
            key={videos[current]}
            src={videos[current]}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
          />
          
          {/* Mensagem com degradê e animação sobre o vídeo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
                <h1 
                className="text-7xl font-bold tracking-tight animate-pulse-slow"
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 40px rgba(245, 158, 11, 0.9), 0 0 80px rgba(245, 158, 11, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)',
                  filter: 'drop-shadow(0 8px 16px rgba(245, 158, 11, 0.4))',
                }}
                >
                Clique para começar seu pedido!
                </h1>
              
              {/* Indicador visual adicional */}
              <div 
                className="mt-8 text-6xl animate-bounce"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.8))',
                }}
              >
                👆
              </div>
            </div>
          </div>
          
          {/* CSS customizado para animações */}
          <style>{`
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            
            .animate-pulse-slow {
              animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
        </>
      ) : (
        <div className="text-center p-8">
          <div className="text-6xl mb-8">🍰</div>
          <h1 className="text-5xl font-bold text-amber-900 mb-4">
            Pastelaria Kiosk Pro
          </h1>
          <p className="text-2xl text-amber-700 mb-8">
            Bem-vindo! Toque na tela para começar
          </p>
          <div className="animate-bounce text-amber-600 text-xl">
            👆 Toque aqui
          </div>
        </div>
      )}
    </div>
  );
}
