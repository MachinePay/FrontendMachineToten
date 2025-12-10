// Serviço de Pagamento Multi-tenant (PIX + Point Smart 2)
// Baseado nas rotas do backend em server.js
import api from "./api";

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeCopyPaste?: string;
  status?: string;
  error?: string;
  message?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  id?: string;
  status?: string;
  statusDetail?: string;
  amount?: number;
  orderId?: string;
  reason?: string;
  error?: string;
}

/**
 * Criar pagamento PIX (QR Code na tela)
 * Endpoint: POST /api/payment/create-pix
 */
export async function createPixPayment(paymentData: {
  amount: number;
  description?: string;
  orderId: string;
  email?: string;
  payerName?: string;
}): Promise<PaymentResponse> {
  try {
    const response = await api.post("/api/payment/create-pix", {
      amount: paymentData.amount,
      description: paymentData.description || `Pedido ${paymentData.orderId}`,
      orderId: paymentData.orderId,
      email: paymentData.email || "cliente@totem.com.br",
      payerName: paymentData.payerName || "Cliente",
    });

    return {
      success: true,
      paymentId: response.data.id || response.data.paymentId, // Backend retorna "id"
      qrCode: response.data.qr_code_base64 || response.data.qrCodeBase64, // Backend retorna snake_case
      qrCodeCopyPaste: response.data.qr_code || response.data.qrCodeCopyPaste, // Backend retorna snake_case
      status: response.data.status,
    };
  } catch (error: any) {
    console.error("❌ Erro ao criar pagamento PIX:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao criar pagamento PIX",
    };
  }
}

/**
 * Criar pagamento com Cartão (Point Smart 2)
 * Endpoint: POST /api/payment/create
 */
export async function createCardPayment(paymentData: {
  amount: number;
  description?: string;
  orderId: string;
  paymentMethod?: "credit" | "debit";
}): Promise<PaymentResponse> {
  try {
    const response = await api.post("/api/payment/create", {
      amount: paymentData.amount,
      description: paymentData.description || `Pedido ${paymentData.orderId}`,
      orderId: paymentData.orderId,
      paymentMethod: paymentData.paymentMethod,
    });

    return {
      success: true,
      paymentId: response.data.id,
      status: response.data.status,
    };
  } catch (error: any) {
    console.error("❌ Erro ao criar pagamento com cartão:", error);
    return {
      success: false,
      error:
        error.response?.data?.error || "Erro ao criar pagamento com cartão",
    };
  }
}

/**
 * Verificar status de pagamento (PIX ou Point)
 * Endpoint: GET /api/payment/status/:paymentId
 *
 * O backend detecta automaticamente se é PIX (Payments API) ou Point (Payment Intent API)
 */
export async function checkPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  try {
    const response = await api.get(`/api/payment/status/${paymentId}`);

    // Mapeia campos do backend para o formato esperado pelo frontend
    return {
      success: true,
      id: response.data.paymentId || response.data.id || paymentId,
      status: response.data.status, // "approved", "pending", "canceled", "rejected", "FINISHED"
      statusDetail: response.data.paymentStatus || response.data.statusDetail,
      orderId: response.data.orderId,
      reason: response.data.reason,
      amount: response.data.amount,
    };
  } catch (error: any) {
    console.error("❌ Erro ao verificar status:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao verificar status",
    };
  }
}

/**
 * Cancelar pagamento (PIX ou Point)
 * Endpoint: DELETE /api/payment/cancel/:paymentId
 */
export async function cancelPayment(
  paymentId: string
): Promise<PaymentResponse> {
  try {
    const response = await api.delete(`/api/payment/cancel/${paymentId}`);

    return {
      success: true,
      paymentId: response.data.id,
      status: response.data.status,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("❌ Erro ao cancelar pagamento:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao cancelar pagamento",
    };
  }
}

/**
 * Configurar Point Smart 2 em modo PDV
 * Endpoint: POST /api/payment/point/configure
 */
export async function configurePoint(): Promise<PaymentResponse> {
  try {
    const response = await api.post("/api/payment/point/configure");

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("❌ Erro ao configurar Point:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao configurar Point",
    };
  }
}

/**
 * Obter status da Point Smart 2
 * Endpoint: GET /api/payment/point/status
 */
export async function getPointStatus(): Promise<PaymentResponse> {
  try {
    const response = await api.get("/api/payment/point/status");

    return {
      success: true,
      status: response.data.status,
      message: response.data.operating_mode,
    };
  } catch (error: any) {
    console.error("❌ Erro ao consultar Point:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao consultar Point",
    };
  }
}

/**
 * Limpar fila de pagamentos da Point
 * Endpoint: POST /api/payment/clear-queue
 */
export async function clearPaymentQueue(): Promise<PaymentResponse> {
  try {
    const response = await api.post("/api/payment/clear-queue");

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("❌ Erro ao limpar fila:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Erro ao limpar fila",
    };
  }
}

/**
 * Helper para polling de status de pagamento
 * Verifica status a cada X segundos até aprovação, rejeição ou timeout
 *
 * @param paymentId - ID do pagamento
 * @param onStatusChange - Callback chamado a cada mudança de status
 * @param intervalMs - Intervalo entre verificações (padrão: 3000ms)
 * @param timeoutMs - Tempo máximo de polling (padrão: 300000ms = 5min)
 * @returns Promise que resolve com status final
 */
export async function startPaymentPolling(
  paymentId: string,
  onStatusChange: (status: PaymentStatusResponse) => void,
  intervalMs: number = 3000,
  timeoutMs: number = 300000
): Promise<PaymentStatusResponse> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = Math.floor(timeoutMs / intervalMs);

    console.log(
      `🔄 Iniciando polling de pagamento ${paymentId} (máx ${maxAttempts} tentativas)`
    );

    const interval = setInterval(async () => {
      attempts++;

      try {
        const result = await checkPaymentStatus(paymentId);

        // Chama callback com status atual
        onStatusChange(result);

        if (result.success) {
          console.log(
            `🔍 Polling ${paymentId} [${attempts}/${maxAttempts}]: ${result.status}`
          );

          // Status finais que param o polling
          if (
            result.status === "approved" ||
            result.status === "rejected" ||
            result.status === "canceled" ||
            result.status === "refunded"
          ) {
            console.log(`✅ Polling finalizado: ${result.status}`);
            clearInterval(interval);
            resolve(result);
          }
        }

        // Timeout
        if (attempts >= maxAttempts) {
          console.warn(
            `⏱️ Timeout no polling de ${paymentId} após ${attempts} tentativas`
          );
          clearInterval(interval);
          resolve({
            success: false,
            error: "Timeout ao verificar status do pagamento",
          });
        }
      } catch (error) {
        console.error(`❌ Erro no polling ${paymentId}:`, error);
        clearInterval(interval);
        reject(error);
      }
    }, intervalMs);
  });
}

export default {
  createPixPayment,
  createCardPayment,
  checkPaymentStatus,
  cancelPayment,
  configurePoint,
  getPointStatus,
  clearPaymentQueue,
  startPaymentPolling,
};
