# 🌐 Configuração do Domínio kioskpro.com.br na Vercel

## 📋 Checklist de Configuração

### 1️⃣ **Configurar DNS no seu Provedor** (Registro.br, GoDaddy, etc.)

Adicione os seguintes registros DNS:

```dns
# Domínio principal
@ A 76.76.21.21

# Wildcard para subdomínios (Multi-tenant)
* CNAME cname.vercel-dns.com.

# Ou se não aceitar CNAME no root:
@ A 76.76.21.21
www CNAME cname.vercel-dns.com.
* CNAME cname.vercel-dns.com.
```

**⏰ Tempo de propagação:** 1-48 horas (geralmente 2-4h)

---

### 2️⃣ **Adicionar Domínios na Vercel**

No **Dashboard da Vercel** → Seu Projeto → **Settings** → **Domains**:

#### Adicionar domínios:

1. `kioskpro.com.br` (domínio principal)
2. `www.kioskpro.com.br` (opcional)
3. `*.kioskpro.com.br` (wildcard para multi-tenant)

**Exemplo de subdomínios que funcionarão:**

- `pastelaria-joao.kioskpro.com.br`
- `lanchonete-maria.kioskpro.com.br`
- `restaurante-silva.kioskpro.com.br`

---

### 3️⃣ **Variáveis de Ambiente na Vercel**

**Settings** → **Environment Variables**:

```bash
# Production
VITE_API_URL=https://seu-backend.onrender.com

# Preview (opcional - para testes)
VITE_API_URL=https://seu-backend-preview.onrender.com

# Development (não necessário - usa .env.local)
```

**⚠️ IMPORTANTE:** NÃO adicionar `VITE_DEFAULT_STORE_ID` em produção!

---

### 4️⃣ **CORS no Backend (Render)**

Atualizar `server.js` para aceitar o novo domínio:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://kioskpro.com.br",
      "https://www.kioskpro.com.br",
      /\.kioskpro\.com\.br$/, // Aceita todos os subdomínios
      /\.vercel\.app$/, // Aceita deploys de preview
    ],
    credentials: true,
  })
);
```

---

### 5️⃣ **Deploy na Vercel**

#### Opção A: GitHub (Recomendado)

1. Conecte o repositório no dashboard da Vercel
2. Cada push na branch `main` faz deploy automático
3. Pull requests criam preview deploys

#### Opção B: CLI

```bash
npm i -g vercel
vercel --prod
```

---

## 🧪 Como Testar

### 1. **Testar domínio principal:**

```
https://kioskpro.com.br
```

- Deve mostrar screensaver
- Console: `🏪 Carregando configuração da loja: minha-loja`

### 2. **Testar subdomínio (multi-tenant):**

```
https://pastelaria-joao.kioskpro.com.br
```

- Console: `🏪 Carregando configuração da loja: pastelaria-joao`
- Network tab: Header `x-store-id: pastelaria-joao`

### 3. **Testar outro subdomínio:**

```
https://lanchonete-maria.kioskpro.com.br
```

- Console: `🏪 Carregando configuração da loja: lanchonete-maria`
- Network tab: Header `x-store-id: lanchonete-maria`

---

## 🔍 Verificar Configuração DNS

Use ferramentas online para verificar se DNS está propagado:

```bash
# No terminal (Linux/Mac)
nslookup kioskpro.com.br
nslookup pastelaria-joao.kioskpro.com.br

# Ou use:
# https://dnschecker.org
# Digite: kioskpro.com.br
```

**Resposta esperada:**

```
Name: kioskpro.com.br
Address: 76.76.21.21 (ou IP da Vercel)
```

---

## 🎯 Estrutura Multi-Tenant

### Como funciona:

1. **Cliente acessa:** `pastelaria-joao.kioskpro.com.br`
2. **Frontend extrai:** storeId = `"pastelaria-joao"` (via `tenantResolver.ts`)
3. **Todas as API calls incluem:** Header `x-store-id: pastelaria-joao`
4. **Backend filtra dados:** `WHERE store_id = 'pastelaria-joao'`

### Cada loja tem:

- ✅ URL única (subdomínio)
- ✅ Produtos próprios
- ✅ Pedidos separados
- ✅ Branding customizado (logo, cores)
- ✅ Dados isolados

---

## ⚠️ Troubleshooting

### DNS não propaga

- **Tempo:** Aguardar até 48h
- **Verificar:** Registros DNS no provedor
- **Ferramenta:** https://dnschecker.org

### "Loja não encontrada"

- **Causa:** `store_id` não existe no banco
- **Solução:** Cadastrar loja no banco de dados

```sql
INSERT INTO stores (id, name, logo, primary_color, secondary_color, accent_color)
VALUES ('pastelaria-joao', 'Pastelaria João', null, '#dc2626', '#7f1d1d', '#f87171');
```

### CORS Error

- **Causa:** Backend não aceita domínio
- **Solução:** Adicionar `kioskpro.com.br` no CORS (ver passo 4)

### Subdomínio não funciona

- **Causa 1:** DNS wildcard não configurado
  - Adicionar: `* CNAME cname.vercel-dns.com.`
- **Causa 2:** Vercel não aceita wildcard
  - Adicionar domínio `*.kioskpro.com.br` manualmente no dashboard

---

## 📊 Exemplo de Lojas

```
# Loja 1
URL: https://pastelaria-joao.kioskpro.com.br
Store ID: pastelaria-joao
Nome: Pastelaria do João
Cores: Vermelho (#dc2626)

# Loja 2
URL: https://lanchonete-maria.kioskpro.com.br
Store ID: lanchonete-maria
Nome: Lanchonete da Maria
Cores: Azul (#3b82f6)

# Loja 3
URL: https://restaurante-silva.kioskpro.com.br
Store ID: restaurante-silva
Nome: Restaurante Silva
Cores: Verde (#10b981)
```

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] DNS configurado no provedor
- [ ] Domínio adicionado na Vercel
- [ ] Wildcard `*.kioskpro.com.br` configurado
- [ ] Variável `VITE_API_URL` configurada na Vercel
- [ ] CORS do backend atualizado com novo domínio
- [ ] Backend rodando na Render
- [ ] Banco de dados com lojas cadastradas
- [ ] Deploy bem-sucedido na Vercel
- [ ] Teste: https://kioskpro.com.br funciona
- [ ] Teste: subdomínios funcionam
- [ ] SSL/HTTPS funcionando (automático na Vercel)

---

**Domínio:** kioskpro.com.br  
**Frontend:** Vercel  
**Backend:** Render  
**Arquitetura:** Multi-Tenant (SaaS)
