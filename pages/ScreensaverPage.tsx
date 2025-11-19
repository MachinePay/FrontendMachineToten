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
