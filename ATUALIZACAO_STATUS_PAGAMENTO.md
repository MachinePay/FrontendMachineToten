# ✅ Frontend Atualizado: Novos Status de Pagamento

## 📋 Resumo das Mudanças

O frontend foi atualizado para suportar os novos status e campos retornados pelo backend na API de verificação de pagamentos.

---

## 🆕 Novos Status Suportados

### Status Anteriores:

- ✅ `approved` - Pagamento aprovado
- ⏳ `pending` - Aguardando confirmação

### Novos Status (adicionados):

- ❌ `canceled` - Pagamento cancelado (pelo usuário ou sistema)
- ❌ `rejected` - Pagamento rejeitado (pela maquininha ou sistema)

---

## 📦 Novos Campos da API

Quando o backend retorna `status: "canceled"` ou `status: "rejected"`, agora inclui:

| Campo           | Tipo             | Descrição                                                  |
| --------------- | ---------------- | ---------------------------------------------------------- |
| `reason`        | `string`         | Código do motivo (ex: `canceled_by_user`, `payment_error`) |
| `message`       | `string`         | Mensagem pronta para exibir ao usuário                     |
| `orderId`       | `string \| null` | ID do pedido associado (para rastreamento)                 |
| `paymentStatus` | `string`         | Status original do Mercado Pago                            |

---

## 🔧 Alterações no Frontend

### 1. **Polling React Query** (`pages/PaymentPage.tsx`)

**Antes:**

```typescript
refetchInterval: (query) => {
  const data = query.state.data;
  if (data?.status === "approved" || data?.status === "FINISHED") return false;
  return 3000;
};
```

**Depois:**

```typescript
refetchInterval: (query) => {
  const data = query.state.data;
  // Para o polling em qualquer status final
  if (
    data?.status === "approved" ||
    data?.status === "FINISHED" ||
    data?.status === "canceled" ||
    data?.status === "rejected"
  )
    return false;
  return 3000;
};
```

✅ **Benefício:** Não faz mais polling infinito quando pagamento é cancelado/rejeitado

---

### 2. **Detecção de Falha de Pagamento**

**Novo código:**

```typescript
useEffect(() => {
  // ... código existente para approved ...

  // Detecta pagamento cancelado ou rejeitado
  if (
    (paymentStatusData?.status === "canceled" ||
      paymentStatusData?.status === "rejected") &&
    activePayment
  ) {
    console.log("❌ Pagamento cancelado/rejeitado:", paymentStatusData);
    handlePaymentFailure(paymentStatusData);
  }
}, [paymentStatusData, activePayment]);
```

✅ **Benefício:** Responde imediatamente a cancelamentos/rejeições

---

### 3. **Nova Função: `handlePaymentFailure`**

Trata erros com mensagens específicas baseadas no `reason`:

```typescript
const handlePaymentFailure = (data: any) => {
  setActivePayment(null); // Para o polling
  setStatus("error");

  // Mensagens específicas baseadas no reason
  const reasonMessages: Record<string, string> = {
    canceled_by_user: "Pagamento cancelado na maquininha pelo usuário",
    payment_error: "Erro ao processar pagamento na maquininha",
    canceled_by_system: "Pagamento cancelado pelo sistema",
    rejected_by_terminal: "Pagamento rejeitado pela maquininha",
  };

  // Prioridade: message do backend > reasonMessages > genérica
  const errorMsg =
    data.message ||
    (data.reason ? reasonMessages[data.reason] : null) ||
    "Pagamento não aprovado. Tente novamente.";

  setErrorMessage(errorMsg);
  setQrCodeBase64(null);

  console.log(`❌ Falha: ${errorMsg}`);
  if (data.reason) console.log(`  Motivo: ${data.reason}`);
  if (data.orderId) console.log(`  Pedido: ${data.orderId}`);
  if (data.paymentStatus) console.log(`  Status MP: ${data.paymentStatus}`);
};
```

✅ **Benefícios:**

- Mensagens claras para o usuário
- Logs detalhados para debug
- Usa campo `message` do backend quando disponível
- Fallback para mensagens padrão por `reason`

---

## 🎯 Mapeamento de Mensagens

| `reason`               | Mensagem Exibida                                 |
| ---------------------- | ------------------------------------------------ |
| `canceled_by_user`     | "Pagamento cancelado na maquininha pelo usuário" |
| `payment_error`        | "Erro ao processar pagamento na maquininha"      |
| `canceled_by_system`   | "Pagamento cancelado pelo sistema"               |
| `rejected_by_terminal` | "Pagamento rejeitado pela maquininha"            |
| (sem reason)           | "Pagamento não aprovado. Tente novamente."       |

**Nota:** Se o backend enviar o campo `message`, ele tem prioridade sobre as mensagens padrão.

---

## 🔄 Fluxo Completo

### Pagamento Aprovado:

1. Polling detecta `status: "approved"`
2. Para o polling
3. Chama `finalizeOrder()`
4. Atualiza pedido no banco
5. Limpa fila da maquininha (se cartão)
6. Redireciona para tela inicial

### Pagamento Cancelado/Rejeitado:

1. Polling detecta `status: "canceled"` ou `"rejected"`
2. Para o polling
3. Chama `handlePaymentFailure(data)`
4. Extrai mensagem do backend (`message` ou `reason`)
5. Exibe erro específico na tela
6. Limpa QR Code (se PIX)
7. **Backend já liberou o estoque automaticamente**

---

## 🧪 Como Testar

### Testar Cancelamento na Maquininha:

1. Inicie pagamento com cartão
2. Cancele na maquininha (botão vermelho)
3. ✅ Deve aparecer: "Pagamento cancelado na maquininha pelo usuário"
4. ✅ Estoque deve ser liberado automaticamente

### Testar Rejeição de Cartão:

1. Inicie pagamento com cartão
2. Use cartão sem saldo/bloqueado
3. ✅ Deve aparecer: "Pagamento rejeitado pela maquininha"

### Testar PIX Expirado:

1. Gere QR Code PIX
2. Aguarde expiração (15 min)
3. ✅ Deve aparecer: "Pagamento cancelado pelo sistema"

---

## 🆚 Comparação Backend vs Frontend

### Backend (`server.js`):

```javascript
return res.json({
  status: "canceled",
  reason: "canceled_by_user",
  orderId: orderId || null,
  message: "Pagamento cancelado na maquininha pelo usuário",
});
```

### Frontend (`PaymentPage.tsx`):

```typescript
handlePaymentFailure({
  status: "canceled",
  reason: "canceled_by_user",
  orderId: "order_123",
  message: "Pagamento cancelado na maquininha pelo usuário",
});

// Exibe na tela:
// "Pagamento cancelado na maquininha pelo usuário"
```

✅ **Totalmente sincronizados!**

---

## 📋 Checklist de Compatibilidade

- [x] Polling para em `canceled` e `rejected`
- [x] Detecta novos status no `useEffect`
- [x] Usa campo `reason` para mensagens específicas
- [x] Usa campo `message` do backend quando disponível
- [x] Loga `orderId` e `paymentStatus` para debug
- [x] Limpa QR Code ao cancelar PIX
- [x] Para polling ao detectar status final
- [x] Não quebra com status anteriores (`approved`, `pending`)

---

## 🎉 Resultado Final

### Antes:

- ❌ Polling infinito em cancelamentos
- ❌ Mensagem genérica "Erro no pagamento"
- ❌ Estoque ficava reservado após cancelamento
- ❌ Sem feedback específico do motivo

### Depois:

- ✅ Polling para imediatamente em status final
- ✅ Mensagens específicas por tipo de erro
- ✅ Estoque liberado automaticamente pelo backend
- ✅ Logs detalhados para troubleshooting
- ✅ Campo `message` do backend tem prioridade
- ✅ Rastreamento por `orderId` nos logs

---

## 🔍 Debug

Para verificar os dados recebidos do backend:

```typescript
console.log("Status data:", paymentStatusData);
// Exemplo de saída:
// {
//   status: "canceled",
//   reason: "canceled_by_user",
//   orderId: "order_1733356800000",
//   message: "Pagamento cancelado na maquininha pelo usuário",
//   paymentStatus: "cancelled"
// }
```

---

## 🚀 Deploy

Não há breaking changes. As mudanças são **100% retrocompatíveis**:

- Status anteriores (`approved`, `pending`) continuam funcionando
- Campos novos são opcionais
- Se backend não enviar `reason`/`message`, usa mensagem genérica

**Pronto para produção!** ✅
