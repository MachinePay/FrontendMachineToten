/**
 * 🚫 STORE NOT FOUND - Tela de erro quando a loja não é encontrada
 */

import React from "react";

const StoreNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <span className="text-8xl">🏪</span>
        </div>

        <h1 className="text-3xl font-bold text-stone-800 mb-4">
          Loja não encontrada
        </h1>

        <p className="text-stone-600 mb-6">
          Não foi possível encontrar a loja que você está tentando acessar.
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-stone-700 mb-2">
            <strong>URL atual:</strong>
          </p>
          <p className="text-xs text-stone-500 break-all font-mono bg-white px-2 py-1 rounded">
            {window.location.href}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-stone-600">Por favor, verifique:</p>
          <ul className="text-sm text-stone-600 text-left list-disc list-inside space-y-1">
            <li>Se o endereço está correto</li>
            <li>Se a loja está ativa</li>
            <li>Se você possui acesso a esta loja</li>
          </ul>
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
};

export default StoreNotFound;
