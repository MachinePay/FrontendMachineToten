/**
 * 🏪 TENANT RESOLVER - Identificação da Loja (Multi-tenant)
 *
 * Identifica qual loja está sendo acessada baseada no subdomínio da URL.
 * Exemplo: pastelaria-joao.kioskpro.com.br -> storeId: "pastelaria-joao"
 *
 * PRIORIDADE:
 * 1. Variável de ambiente (VITE_DEFAULT_STORE_ID) - MÁXIMA PRIORIDADE
 * 2. Subdomínio (exceto 'www')
 * 3. Fallback padrão (pastelaria_01)
 */

const DEFAULT_STORE_ID = "pastelaria_01"; // Loja principal padrão

/**
 * Extrai o storeId do subdomínio da URL atual
 * @returns storeId ou null se estiver em localhost/ambiente de desenvolvimento
 */
export function getStoreIdFromDomain(): string | null {
  // ✅ PRIORIDADE 1: Variável de ambiente (sempre tem precedência)
  const envStoreId = import.meta.env.VITE_DEFAULT_STORE_ID;
  if (envStoreId) {
    console.log(`🏪 Store ID da variável de ambiente: ${envStoreId}`);
    return envStoreId;
  }

  const hostname = window.location.hostname;

  // ✅ Desenvolvimento: localhost, 127.0.0.1, etc
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.")
  ) {
    console.log(`🏪 Ambiente local - usando loja padrão: ${DEFAULT_STORE_ID}`);
    return DEFAULT_STORE_ID;
  }

  // ✅ Produção: extrai subdomínio
  const parts = hostname.split(".");

  // Se for apenas domínio.com (sem subdomínio) ou domínio.com.br
  if (parts.length < 3) {
    console.log(
      `🏪 Domínio principal (${hostname}) - usando loja padrão: ${DEFAULT_STORE_ID}`
    );
    return DEFAULT_STORE_ID;
  }

  // Pega o primeiro segmento
  const subdomain = parts[0];

  // ✅ IGNORA 'www' - considera como domínio principal
  if (subdomain === "www") {
    console.log(
      `🏪 Domínio www detectado (${hostname}) - usando loja padrão: ${DEFAULT_STORE_ID}`
    );
    return DEFAULT_STORE_ID;
  }

  // ✅ Subdomínio válido encontrado
  console.log(`🏪 Loja identificada: ${subdomain} (${hostname})`);
  return subdomain;
}

/**
 * Obtém o storeId atual (com fallback para loja padrão)
 * @returns storeId (nunca retorna null)
 */
export function getCurrentStoreId(): string {
  const storeId = getStoreIdFromDomain();

  if (!storeId) {
    console.warn(
      `⚠️ Não foi possível identificar a loja, usando padrão: ${DEFAULT_STORE_ID}`
    );
    return DEFAULT_STORE_ID;
  }

  console.log(`✅ Store ID configurado: ${storeId}`);
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
