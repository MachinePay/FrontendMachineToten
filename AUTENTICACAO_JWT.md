# 🔐 Sistema de Autenticação JWT - Frontend

## ✅ Implementação Completa

O frontend agora está totalmente integrado com o sistema de autenticação JWT seguro do backend.

## 📁 Arquivos Criados/Modificados

### 1. **`services/apiService.ts`** (NOVO)

Serviço centralizado de autenticação e chamadas de API.

**Funções principais:**

- `login(role, password)` - Faz login e salva o token JWT
- `logout()` - Remove o token e desloga o usuário
- `getToken()` - Retorna o token JWT atual
- `isAuthenticated()` - Verifica se há token válido
- `authenticatedFetch(url, options)` - Wrapper do fetch que adiciona o token automaticamente

**Funções auxiliares de API:**

- `getProducts()` - Lista produtos (pública)
- `createProduct()` - Cria produto (requer admin)
- `updateProduct()` - Atualiza produto (requer admin)
- `deleteProduct()` - Deleta produto (requer admin)
- `getOrders()` - Lista pedidos (requer kitchen/admin)
- `deleteOrder()` - Finaliza pedido (requer kitchen/admin)
- `getUsers()` - Lista usuários (requer admin)

### 2. **`pages/AdminLoginPage.tsx`** (MODIFICADO)

- ✅ Usa `apiService.login('admin', password)` para autenticar
- ✅ Salva token JWT no localStorage automaticamente
- ✅ Valida se já está autenticado ao carregar a página

### 3. **`pages/KitchenLoginPage.tsx`** (MODIFICADO)

- ✅ Usa `apiService.login('kitchen', password)` para autenticar
- ✅ Salva token JWT no localStorage automaticamente
- ✅ Valida se já está autenticado ao carregar a página

### 4. **`contexts/AuthContext.tsx`** (MODIFICADO)

- ✅ Importa `logout` do `apiService`
- ✅ Remove token JWT ao fazer logout
- ✅ Limpa pagamentos pendentes antes de deslogar

### 5. **`pages/AdminPage.tsx`** (MODIFICADO)

- ✅ Importa `authenticatedFetch` do `apiService`
- ✅ Todas as chamadas de API protegidas usam `authenticatedFetch`
- ✅ Botão "🚪 Sair" adicionado no cabeçalho
- ✅ Redirecionamento automático em caso de token inválido

### 6. **`pages/KitchenPage.tsx`** (MODIFICADO)

- ✅ Importa `authenticatedFetch` do `apiService`
- ✅ Chamadas de finalização de pedido usam `authenticatedFetch`
- ✅ Botão "🚪 Sair" adicionado no cabeçalho
- ✅ Redirecionamento automático em caso de token inválido

## 🔒 Como Funciona

### 1. **Login**

```typescript
// Usuário faz login na tela de administração
const success = await apiLogin("admin", "senha123");

if (success) {
  // Token JWT salvo automaticamente no localStorage
  // Usuário redirecionado para /admin
}
```

### 2. **Chamadas Autenticadas**

```typescript
// Antes (sem autenticação)
const response = await fetch(`${API_URL}/api/products`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(product),
});

// Depois (com JWT automático)
const response = await authenticatedFetch(`${API_URL}/api/products`, {
  method: "POST",
  body: JSON.stringify(product),
});
// Token adicionado automaticamente no header: Authorization: Bearer <token>
```

### 3. **Tratamento de Erros**

```typescript
// Se o token for inválido ou expirado (401/403)
// authenticatedFetch automaticamente:
// 1. Remove o token do localStorage
// 2. Redireciona para a tela de login apropriada
// 3. Exibe erro no console
```

### 4. **Logout**

```typescript
// Botão de logout
const handleLogout = async () => {
  await logout(); // Remove token JWT + limpa pagamentos
  navigate("/admin/login"); // Redireciona para login
};
```

## 🎯 Rotas Protegidas

### Backend

Todas as rotas que requerem autenticação JWT:

**Admin (role: 'admin')**

- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Editar produto
- `DELETE /api/products/:id` - Deletar produto
- `GET /api/users` - Listar usuários

**Kitchen (role: 'kitchen' ou 'admin')**

- `GET /api/orders` - Listar pedidos ativos
- `DELETE /api/orders/:id` - Finalizar pedido

### Frontend

Páginas que exigem autenticação:

- `/admin` - Painel administrativo
- `/admin/reports` - Relatórios
- `/cozinha` - Painel da cozinha

## 🔐 Armazenamento do Token

O token JWT é salvo no `localStorage` do navegador com a chave `jwt_token`:

```javascript
// Salvar token
localStorage.setItem("jwt_token", token);

// Recuperar token
const token = localStorage.getItem("jwt_token");

// Remover token (logout)
localStorage.removeItem("jwt_token");
```

## ⏰ Expiração do Token

- **Duração:** 8 horas (configurado no backend)
- **Renovação:** Não há renovação automática. Usuário precisa fazer login novamente após expiração.
- **Detecção:** Quando o token expira, qualquer chamada de API retorna 401/403 e o usuário é automaticamente deslogado.

## 🛡️ Segurança

### ✅ O que está protegido

- ✅ Todas as rotas administrativas requerem token válido
- ✅ Token é validado no servidor a cada requisição
- ✅ Token expira após 8 horas
- ✅ Token é removido ao fazer logout
- ✅ Redirecionamento automático se token inválido

### ⚠️ Considerações de Segurança

- Token é armazenado no localStorage (vulnerável a XSS)
- Use HTTPS em produção para proteger o token em trânsito
- Tokens não podem ser revogados antes da expiração
- Para melhor segurança, considere usar cookies HTTP-only no futuro

## 🧪 Testando

### 1. Testar Login

1. Acesse `/admin/login`
2. Digite a senha configurada em `ADMIN_PASSWORD`
3. Verifique o localStorage: deve conter `jwt_token`

### 2. Testar Rotas Protegidas

1. Faça login como admin
2. Tente criar/editar/deletar produtos
3. Todas as operações devem funcionar

### 3. Testar Expiração

1. Faça login
2. Abra as DevTools e edite o token no localStorage para um valor inválido
3. Tente fazer qualquer operação
4. Deve ser redirecionado automaticamente para a tela de login

### 4. Testar Logout

1. Faça login
2. Clique no botão "🚪 Sair"
3. Verifique que o token foi removido do localStorage
4. Tentativas de acessar páginas protegidas devem redirecionar para login

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Refresh Tokens** - Renovar token automaticamente antes de expirar
2. **Cookies HTTP-only** - Armazenar token em cookie ao invés de localStorage
3. **Revogação de Tokens** - Permitir invalidar tokens antes da expiração
4. **2FA** - Adicionar autenticação de dois fatores
5. **Rate Limiting** - Limitar tentativas de login por IP
6. **Logs de Auditoria** - Registrar todas as ações administrativas

## 📝 Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no backend:

```env
# Senhas de acesso
ADMIN_PASSWORD=sua_senha_admin_segura
KITCHEN_PASSWORD=sua_senha_cozinha_segura

# Chave secreta para assinar tokens JWT (mínimo 32 caracteres)
JWT_SECRET=sua_chave_super_secreta_de_pelo_menos_32_caracteres

# URL do frontend (para CORS)
FRONTEND_URL=https://seu-dominio.com
```

## ✅ Checklist de Implementação

- ✅ Criar `apiService.ts` com funções de autenticação
- ✅ Atualizar `AdminLoginPage.tsx` para usar JWT
- ✅ Atualizar `KitchenLoginPage.tsx` para usar JWT
- ✅ Atualizar `AuthContext.tsx` para limpar tokens
- ✅ Atualizar `AdminPage.tsx` com `authenticatedFetch`
- ✅ Atualizar `KitchenPage.tsx` com `authenticatedFetch`
- ✅ Adicionar botões de logout em ambas as páginas
- ✅ Testar login, operações protegidas e logout

---

## 🎉 Pronto!

Seu sistema agora está totalmente seguro com autenticação JWT! 🔒

Backend e frontend conversando de forma segura com tokens JWT válidos por 8 horas.

ATUALIZADO