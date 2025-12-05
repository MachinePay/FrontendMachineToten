# 🏪 Migração Multi-Tenant (SaaS) - Frontend

## 📋 Resumo da Implementação

Este documento detalha a implementação completa da arquitetura multi-tenant no frontend do **Kiosk Pro**, transformando o sistema de loja única em uma plataforma SaaS que suporta múltiplas lojas com identidade visual personalizada.

---

## ✅ O Que Foi Implementado

### 1. **Identificação de Tenant via Subdomínio** 🌐

#### Arquivo: `utils/tenantResolver.ts`

**Funções principais:**

- `getStoreIdFromDomain()`: Extrai o storeId do subdomínio
  - Produção: `pastelaria-joao.meukiosk.com` → `"pastelaria-joao"`
  - Localhost: retorna `null` (usa variável de ambiente)
- `getCurrentStoreId()`: Obtém o storeId atual com fallback
  - Prioridade: Subdomínio > `VITE_DEFAULT_STORE_ID` env var
- `isLocalEnvironment()`: Detecta se está rodando localmente

**Exemplo de uso:**

```typescript
import { getCurrentStoreId } from "../utils/tenantResolver";

const storeId = getCurrentStoreId(); // "pastelaria-joao" ou env var
```

---

### 2. **Cliente API Centralizado com x-store-id** 🔌

#### Arquivo: `services/apiService.ts`

**Mudanças principais:**

- ✅ Todas as requisições autenticadas incluem header `x-store-id` automaticamente
- ✅ Nova função `publicFetch()` para rotas públicas (também envia storeId)
- ✅ Função `getStoreId()` com tratamento de erro

**Antes:**

```typescript
const response = await fetch(`${BACKEND_URL}/api/products`);
```

**Depois:**

```typescript
// Usa publicFetch que adiciona x-store-id automaticamente
export async function getProducts(): Promise<Product[]> {
  const response = await publicFetch("/api/menu", { method: "GET" });
  return response.json();
}
```

**Header enviado automaticamente:**

```http
GET /api/menu HTTP/1.1
x-store-id: pastelaria-joao
Authorization: Bearer eyJhbGc...
```

---

### 3. **Contexto Global da Loja** 🏪

#### Arquivo: `contexts/StoreContext.tsx`

**Interface:**

```typescript
interface StoreConfig {
  id: string;
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}
```

**Provider:**

- Carrega configuração da loja ao iniciar
- Aplica cores dinâmicas via `applyStoreTheme()`
- Estados: `loading`, `error`, `store`, `refetchStore()`

**Hook de uso:**

```typescript
import { useStore } from "../contexts/StoreContext";

const { store, loading, error } = useStore();

if (loading) return <div>Carregando loja...</div>;
if (error) return <StoreNotFound />;

return <h1>{store.name}</h1>; // "Pastelaria João"
```

**Configuração padrão (fallback):**

```typescript
const DEFAULT_STORE_CONFIG = {
  name: "Kiosk Pro",
  logo: null,
  primaryColor: "#f59e0b", // amber-500
  secondaryColor: "#78350f", // amber-900
  accentColor: "#fbbf24", // amber-400
};
```

---

### 4. **Sistema de Cores Dinâmicas** 🎨

#### Arquivo: `utils/themeColors.ts`

**Como funciona:**

1. StoreContext carrega cores da API (ou usa default)
2. `applyStoreTheme()` aplica cores como CSS Custom Properties no `:root`
3. Componentes usam `var(--color-primary)` ao invés de classes hardcoded

**Variáveis CSS disponíveis:**

```css
--color-primary         /* Cor principal (ex: #dc2626) */
--color-primary-hover   /* 10% mais escura */
--color-primary-active  /* 20% mais escura */
--color-primary-light   /* 40% mais clara */
--color-primary-lighter /* 60% mais clara */
--color-secondary       /* Cor secundária */
--color-accent          /* Cor de destaque */
```

**Exemplo de uso em componentes:**

```tsx
// Botão com cor primária da loja
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
  Adicionar ao Carrinho
</button>

// Badge com cor clara
<span className="bg-[var(--color-primary-light)] text-[var(--color-secondary)]">
  Novo
</span>
```

---

### 5. **Header com Branding Dinâmico** 🖼️

#### Arquivo: `components/Header.tsx`

**Mudanças:**

- ✅ Logo customizável (imagem ou emoji fallback)
- ✅ Nome da loja dinâmico ao invés de "KioskPro" hardcoded
- ✅ Usa `useStore()` hook para acessar configurações

**Antes:**

```tsx
<span className="text-xl font-bold">
  Kiosk<span className="text-amber-600">Pro</span>
</span>
```

**Depois:**

```tsx
const { store } = useStore();

{
  store.logo ? (
    <img src={store.logo} alt={`${store.name} logo`} />
  ) : (
    <div className="bg-amber-500">🥟</div>
  );
}
<span className="text-xl font-bold">{store.name}</span>;
```

---

### 6. **Página de Erro - Loja Não Encontrada** ❌

#### Arquivo: `pages/StoreNotFound.tsx`

**Funcionalidades:**

- Mostra URL acessada
- Lista de troubleshooting
- Botão "Voltar ao Início"

**Quando é exibida:**

- Backend retorna 404 em `/api/store-config`
- StoreContext encontra erro ao carregar loja
- storeId inválido ou não cadastrado

---

### 7. **Integração no App Principal** 🔄

#### Arquivo: `App.tsx`

**Hierarquia de Providers:**

```tsx
<QueryClientProvider>
  <StoreProvider>
    {" "}
    {/* 🆕 Novo - Carrega store config */}
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <RouterBody />
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  </StoreProvider>
</QueryClientProvider>
```

**RouterBody com loading da loja:**

```tsx
const { store, loading, error } = useStore();

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-4"></div>
      <p>Carregando loja...</p>
    </div>
  );
}

if (error || !store) {
  return <StoreNotFound />;
}

return <Routes>...</Routes>;
```

---

## 🔧 Configuração

### Variáveis de Ambiente

#### `.env.local` (desenvolvimento):

```bash
# URL da API
VITE_API_URL=http://localhost:3001

# ID da loja para desenvolvimento local
# (Em produção, é extraído do subdomínio)
VITE_DEFAULT_STORE_ID=pastelaria-joao
```

#### `.env.production` (produção):

```bash
# URL da API
VITE_API_URL=https://api.meukiosk.com

# Não precisa de VITE_DEFAULT_STORE_ID em produção
# O storeId é extraído automaticamente do subdomínio
```

---

## 📡 API Esperada do Backend

### Endpoint: `GET /api/store-config`

**Headers:**

```http
x-store-id: pastelaria-joao
```

**Response (200 OK):**

```json
{
  "id": "pastelaria-joao",
  "name": "Pastelaria João",
  "logo": "https://cdn.example.com/logo.png",
  "primaryColor": "#dc2626",
  "secondaryColor": "#7f1d1d",
  "accentColor": "#f87171"
}
```

**Response (404 Not Found):**

```json
{
  "error": "Loja não encontrada"
}
```

**⚠️ IMPORTANTE:** Até o backend implementar este endpoint, o frontend usa a configuração padrão (`DEFAULT_STORE_CONFIG`).

---

## 🎯 Fluxo de Funcionamento

### 1. **Usuário acessa a URL**

```
https://pastelaria-joao.meukiosk.com
```

### 2. **Frontend inicializa (App.tsx)**

- Carrega `StoreProvider`
- `StoreProvider` chama `getCurrentStoreId()`
- `tenantResolver` extrai `"pastelaria-joao"` do subdomínio

### 3. **StoreContext carrega configuração**

- (TODO) Faz `GET /api/store-config` com header `x-store-id: pastelaria-joao`
- Atualmente: Usa `DEFAULT_STORE_CONFIG` como fallback
- Aplica cores via `applyStoreTheme()`

### 4. **App renderiza com loading**

```tsx
if (loading) return <LoadingScreen />;
if (error) return <StoreNotFound />;
return <Routes>...</Routes>; // App principal
```

### 5. **Header exibe branding da loja**

- Logo: `store.logo` ou 🥟 fallback
- Nome: `"Pastelaria João"`

### 6. **Cores aplicadas globalmente**

```css
:root {
  --color-primary: #dc2626; /* red-600 da Pastelaria João */
}
```

### 7. **API requests incluem storeId**

```http
GET /api/menu HTTP/1.1
x-store-id: pastelaria-joao
Authorization: Bearer eyJ...
```

### 8. **Backend filtra dados por loja**

```sql
SELECT * FROM products WHERE store_id = 'pastelaria-joao'
```

---

## 🚀 Como Testar

### Desenvolvimento Local

1. **Configurar `.env.local`:**

```bash
VITE_API_URL=http://localhost:3001
VITE_DEFAULT_STORE_ID=loja-teste
```

2. **Iniciar frontend:**

```bash
npm run dev
```

3. **Acessar:**

```
http://localhost:5173
```

4. **Verificar console:**

```
🏪 Carregando configuração da loja: loja-teste
✅ Configuração da loja carregada: { id: "loja-teste", name: "Kiosk Pro", ... }
```

5. **Inspecionar CSS variables:**

- DevTools → Elements → `<html>` → Computed
- Procurar por `--color-primary`

### Produção (Subdomínios)

1. **Configurar DNS:**

```
pastelaria-joao.meukiosk.com → IP do servidor
lanchonete-maria.meukiosk.com → IP do servidor
```

2. **Acessar:**

```
https://pastelaria-joao.meukiosk.com
```

3. **Verificar network:**

- Header `x-store-id: pastelaria-joao` em todas as requests
- Logo e nome da "Pastelaria João" no header

---

## 📊 Checklist de Migração

### ✅ Concluído

- [x] Criar `tenantResolver.ts` para identificação de store
- [x] Atualizar `apiService.ts` com header `x-store-id`
- [x] Criar `StoreContext.tsx` com configuração da loja
- [x] Criar `StoreNotFound.tsx` para erros
- [x] Atualizar `App.tsx` com `StoreProvider`
- [x] Atualizar `Header.tsx` com branding dinâmico
- [x] Criar `themeColors.ts` para cores dinâmicas
- [x] Adicionar CSS variables em `index.html`
- [x] Atualizar `.env.example` com `VITE_DEFAULT_STORE_ID`
- [x] Criar documentação de cores (`SISTEMA_CORES_DINAMICAS.md`)

### ⏳ Pendente (Próximos Passos)

#### Backend:

- [ ] Implementar endpoint `GET /api/store-config`
- [ ] Adicionar validação de `x-store-id` em todas as rotas
- [ ] Criar tabela `stores` com configurações
- [ ] Testar filtros por `store_id` em queries

#### Frontend:

- [ ] Migrar todas as classes `amber-*` para CSS variables (43+ ocorrências)
  - `MenuPage.tsx` (17 ocorrências)
  - `AdminPage.tsx` (10 ocorrências)
  - `PaymentPage.tsx` (7 ocorrências)
  - `Chatbot.tsx` (6 ocorrências)
  - `KitchenPage.tsx` (5 ocorrências)
- [ ] Descomentar fetch real em `StoreContext.tsx` quando API estiver pronta
- [ ] Adicionar cache de store config (React Query)
- [ ] Implementar refresh de config (botão admin)
- [ ] Adicionar testes E2E para multi-tenant

#### DevOps:

- [ ] Configurar wildcard SSL certificate (\*.meukiosk.com)
- [ ] Configurar DNS wildcard (\*.meukiosk.com)
- [ ] Atualizar Vercel/hosting para suportar subdomínios
- [ ] Adicionar monitoramento por loja

---

## 🐛 Troubleshooting

### Problema: Cores não mudam entre lojas

**Diagnóstico:**

```bash
# Verificar se CSS variables estão sendo aplicadas
DevTools → Elements → <html> → Computed → procurar "--color-primary"
```

**Soluções:**

1. Verificar se `applyStoreTheme()` está sendo chamado no `StoreContext.tsx`
2. Verificar se `StoreProvider` está envolvendo o app no `App.tsx`
3. Verificar formato das cores no backend (devem ser hex: `#RRGGBB`)

---

### Problema: Logo não aparece

**Diagnóstico:**

```typescript
console.log(store.logo); // null, undefined ou URL inválida?
```

**Soluções:**

1. Verificar se backend retorna `logo` na configuração
2. Verificar CORS se logo está em domínio diferente
3. Verificar formato da URL (deve ser absoluta)
4. Fallback emoji 🥟 deve aparecer se `logo` for null

---

### Problema: x-store-id não está sendo enviado

**Diagnóstico:**

```bash
# DevTools → Network → selecionar request → Headers
# Procurar por "x-store-id"
```

**Soluções:**

1. Verificar se está usando `authenticatedFetch()` ou `publicFetch()`
2. Verificar se `getCurrentStoreId()` retorna valor válido
3. Verificar se `.env.local` tem `VITE_DEFAULT_STORE_ID` (localhost)
4. Verificar se subdomínio está correto (produção)

---

### Problema: Erro 404 em /api/store-config

**Causa:** Endpoint ainda não foi implementado no backend.

**Solução temporária:** Frontend usa `DEFAULT_STORE_CONFIG` até backend estar pronto.

**Implementar no backend:**

```javascript
// server.js
app.get("/api/store-config", extractStoreId, async (req, res) => {
  const store = await db("stores").where({ id: req.storeId }).first();
  if (!store) return res.status(404).json({ error: "Loja não encontrada" });
  res.json(store);
});
```

---

## 📚 Arquivos Modificados/Criados

### Novos Arquivos:

- `utils/tenantResolver.ts` - Identificação de tenant
- `utils/themeColors.ts` - Sistema de cores dinâmicas
- `contexts/StoreContext.tsx` - Contexto global da loja
- `pages/StoreNotFound.tsx` - Página de erro
- `SISTEMA_CORES_DINAMICAS.md` - Documentação de cores
- `MIGRACAO_MULTI_TENANT.md` - Este documento

### Modificados:

- `services/apiService.ts` - Adicionado x-store-id header
- `components/Header.tsx` - Branding dinâmico
- `App.tsx` - Integração do StoreProvider
- `index.html` - CSS variables
- `.env.example` - Variável VITE_DEFAULT_STORE_ID

---

## 🎓 Referências

- [Multi-Tenancy Architecture (AWS)](https://aws.amazon.com/solutions/saas/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind Arbitrary Values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)
- [React Context Best Practices](https://react.dev/reference/react/useContext)

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar este documento de migração
2. Verificar `SISTEMA_CORES_DINAMICAS.md` para questões de UI
3. Verificar logs do console para erros de carregamento
4. Verificar Network tab para problemas de API

---

**Status:** ✅ Frontend Multi-Tenant Implementado (Backend pendente)  
**Data:** 2024  
**Versão:** 1.0
