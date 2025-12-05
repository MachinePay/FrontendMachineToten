# 🚀 Como Iniciar o Kiosk Pro (Multi-Tenant)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Backend rodando em `http://localhost:3001`
- Banco de dados configurado com store_id

---

## ⚡ Início Rápido

### 1. **Instalar Dependências**

```bash
npm install
```

### 2. **Verificar Configuração**

O arquivo `.env.local` já está configurado com:

- `VITE_API_URL=http://localhost:3001`
- `VITE_DEFAULT_STORE_ID=minha-loja`

⚠️ **Importante:** O `VITE_DEFAULT_STORE_ID` deve corresponder a um `store_id` válido no banco de dados do backend.

### 3. **Iniciar Frontend**

```bash
npm run dev
```

O app abrirá em: `http://localhost:5173`

---

## ✅ Checklist de Verificação

### Frontend está funcionando se:

- [ ] Console mostra: `🏪 Carregando configuração da loja: minha-loja`
- [ ] Console mostra: `✅ Configuração da loja carregada`
- [ ] Header exibe "Kiosk Pro" (ou nome da loja configurada)
- [ ] Não há erros TypeScript no terminal
- [ ] Página inicial (screensaver) carrega

### Backend está configurado corretamente se:

- [ ] Servidor rodando em `http://localhost:3001`
- [ ] Endpoint `/health` responde com 200
- [ ] Endpoint `/api/menu` retorna produtos filtrados por `store_id`
- [ ] Todas as requisições recebem header `x-store-id`

### Banco de dados está correto se:

- [ ] Tabela `stores` existe (se implementada)
- [ ] Tabela `products` tem coluna `store_id`
- [ ] Tabela `orders` tem coluna `store_id`
- [ ] Existe pelo menos uma loja com `id = "minha-loja"`

---

## 🔍 Troubleshooting

### Erro: "Loja não encontrada"

**Causa:** `VITE_DEFAULT_STORE_ID` não corresponde a nenhum store_id no banco.

**Solução:**

1. Verificar quais stores existem no banco:

   ```sql
   SELECT id FROM stores;
   -- ou
   SELECT DISTINCT store_id FROM products;
   ```

2. Atualizar `.env.local` com um `store_id` válido:

   ```bash
   VITE_DEFAULT_STORE_ID=pastelaria-joao
   ```

3. Reiniciar o servidor dev:
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

---

### Erro: "Failed to fetch" / Network Error

**Causa:** Backend não está rodando ou URL incorreta.

**Solução:**

1. Verificar se backend está rodando:

   ```bash
   curl http://localhost:3001/health
   # Deve retornar: {"status":"ok"}
   ```

2. Se backend estiver em outra porta, atualizar `.env.local`:
   ```bash
   VITE_API_URL=http://localhost:3002
   ```

---

### Produtos não aparecem

**Causa 1:** Nenhum produto cadastrado para este `store_id`.

**Solução:** Inserir produtos no banco:

```sql
INSERT INTO products (id, name, price, category, store_id, stock)
VALUES ('prod-1', 'Pastel de Carne', 8.00, 'Salgados', 'minha-loja', null);
```

**Causa 2:** Backend não está filtrando por `store_id`.

**Solução:** Verificar se backend usa middleware `extractStoreId` e filtra queries:

```javascript
app.get("/api/menu", extractStoreId, async (req, res) => {
  const products = await db("products").where({ store_id: req.storeId }); // ← Importante
  res.json(products);
});
```

---

### Header `x-store-id` não está sendo enviado

**Causa:** Usando `fetch()` direto ao invés de `apiService`.

**Solução:** Sempre usar funções do `apiService.ts`:

```typescript
// ❌ Errado
const response = await fetch("/api/products");

// ✅ Correto
import { getProducts } from "../services/apiService";
const products = await getProducts();
```

---

### Cores não mudam (sempre amber)

**Causa:** Backend não retorna configuração customizada (endpoint não implementado).

**Status:** Normal! Até o backend implementar `/api/store-config`, o frontend usa cores padrão (amber).

**Implementar futuramente:** Ver `MIGRACAO_MULTI_TENANT.md` → seção "API Esperada do Backend"

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Verificar erros TypeScript
npx tsc --noEmit

# Verificar lint
npm run lint
```

---

## 🏗️ Build para Produção

### 1. Build

```bash
npm run build
```

Isso gera arquivos otimizados em `dist/`.

### 2. Configurar Variáveis de Ambiente

Criar `.env.production`:

```bash
VITE_API_URL=https://api.meukiosk.com
# Não precisa de VITE_DEFAULT_STORE_ID em produção
# O storeId é extraído do subdomínio automaticamente
```

### 3. Deploy

Subir a pasta `dist/` para:

- Vercel
- Netlify
- Servidor próprio (nginx, Apache)

### 4. DNS (Subdomínios)

Configurar wildcard DNS:

```
*.meukiosk.com → IP do servidor
```

Exemplos de URLs:

- `https://pastelaria-joao.meukiosk.com` → storeId: "pastelaria-joao"
- `https://lanchonete-maria.meukiosk.com` → storeId: "lanchonete-maria"

---

## 📖 Documentação Adicional

- **Multi-Tenant:** `MIGRACAO_MULTI_TENANT.md`
- **Cores Dinâmicas:** `SISTEMA_CORES_DINAMICAS.md`
- **Backend:** `CONFIGURACAO_BACKEND.md`
- **Pagamento PIX:** `SISTEMA_PAGAMENTO_PIX.md`
- **Estoque:** `SISTEMA_ESTOQUE.md`

---

## 🆘 Suporte

Se ainda tiver problemas:

1. Verificar logs do console (F12 → Console)
2. Verificar Network tab (F12 → Network)
3. Verificar se todas as variáveis de ambiente estão corretas
4. Verificar documentação específica na pasta do projeto

---

**Status do Sistema:** ✅ Multi-Tenant Implementado  
**Última Atualização:** Dezembro 2024
