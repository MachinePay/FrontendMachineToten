/**
 * 🏪 TENANT RESOLVER - Identificação da Loja (Multi-tenant)
 *
 * Identifica qual loja está sendo acessada baseada no subdomínio da URL.
 * Exemplo: pastelaria-joao.meukiosk.com -> storeId: "pastelaria-joao"
 */

/**
 * Extrai o storeId do subdomínio da URL atual
 * @returns storeId ou null se estiver em localhost/ambiente de desenvolvimento
 */
export function getStoreIdFromDomain(): string | null {
  const hostname = window.location.hostname;

  // Desenvolvimento: localhost, 127.0.0.1, etc
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.")
  ) {
    // Usa variável de ambiente se configurada
    const defaultStoreId = import.meta.env.VITE_DEFAULT_STORE_ID;

    if (!defaultStoreId) {
      console.warn("⚠️ Ambiente local sem VITE_DEFAULT_STORE_ID configurado");
      console.warn(
        "💡 Configure no arquivo .env: VITE_DEFAULT_STORE_ID=minha-loja"
      );
      return null;
    }

    console.log(`🏪 Ambiente local - usando loja: ${defaultStoreId}`);
    return defaultStoreId;
  }

  // Produção: extrai subdomínio
  const parts = hostname.split(".");

  // Se for apenas domínio.com (sem subdomínio), retorna null
  if (parts.length < 3) {
    console.warn(`⚠️ URL sem subdomínio: ${hostname}`);
    return null;
  }

  // Pega o primeiro segmento como storeId
  const storeId = parts[0];
  console.log(`🏪 Loja identificada: ${storeId} (${hostname})`);

  return storeId;
}

/**
 * Obtém o storeId atual (com fallback para variável de ambiente)
 * @throws Error se não conseguir identificar a loja
 */
export function getCurrentStoreId(): string {
  const storeId = getStoreIdFromDomain();

  if (!storeId) {
    throw new Error(
      "Não foi possível identificar a loja. Configure VITE_DEFAULT_STORE_ID ou acesse via subdomínio."
    );
  }

  return storeId;
}

/**
 * Verifica se está rodando em ambiente de desenvolvimento
 */
export function isLocalEnvironment(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.")
  );
}
