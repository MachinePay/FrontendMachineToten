// Serviço para interação com a Point Smart 2 do Mercado Pago

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Configura a Point Smart 2 em modo PDV (Ponto de Venda)
 * Isso bloqueia o menu da maquininha e mantém ela vinculada ao sistema
 */
export const configurePoint = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/point/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Point Smart 2 configurada em modo PDV');
      console.log('🔒 Menu bloqueado - apenas comandos via API');
      return { success: true };
    } else {
      console.warn('⚠️ Point não configurada:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.warn('⚠️ Erro ao configurar Point (pode não estar conectada):', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Verifica o status da conexão com a Point Smart 2
 * Retorna informações sobre modelo, modo operacional e conexão
 */
export const checkPointStatus = async (): Promise<{
  connected: boolean;
  id?: string;
  operating_mode?: string;
  status?: string;
  model?: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/point/status`);
    const data = await response.json();
    
    if (data.connected) {
      console.log('✅ Point conectada:', data.model || 'Point Smart 2');
      console.log('📱 Modo:', data.operating_mode || 'N/A');
      console.log('🔗 Status:', data.status || 'N/A');
      return data;
    } else {
      console.warn('⚠️ Point não conectada:', data.error);
      return { connected: false, error: data.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao verificar status da Point:', errorMessage);
    return { connected: false, error: errorMessage };
  }
};

/**
 * Limpa toda a fila de pagamentos da Point Smart 2
 * Usado após pagamento aprovado para evitar que o botão verde retorne ao pagamento anterior
 */
export const clearPaymentQueue = async (): Promise<{ success: boolean; cleared: number; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/payment/clear-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Fila limpa: ${data.cleared} pagamento(s) removido(s)`);
      return { success: true, cleared: data.cleared };
    } else {
      console.warn('⚠️ Erro ao limpar fila:', data.error);
      return { success: false, cleared: 0, error: data.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao limpar fila de pagamentos:', errorMessage);
    return { success: false, cleared: 0, error: errorMessage };
  }
};
