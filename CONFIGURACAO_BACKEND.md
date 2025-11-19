# 🚀 Configuração do Backend no Vercel

## ✅ Alterações Realizadas

Todas as URLs hardcoded (`localhost:3001`) foram substituídas pela variável de ambiente `VITE_API_URL`.

### Arquivos Modificados:
- ✅ `services/authService.ts`
- ✅ `services/geminiService.ts` (já estava correto)
- ✅ `pages/AdminPage.tsx`
- ✅ `pages/AdminReportsPage.tsx`
- ✅ `pages/KitchenPage.tsx`
- ✅ `pages/LoginPage.tsx`
- ✅ `pages/MenuPage.tsx` (já estava correto)

---

## 📝 Como Configurar a Variável de Ambiente no Vercel

### Passo 1: Acesse o Dashboard do Vercel
1. Faça login em [vercel.com](https://vercel.com)
2. Selecione seu projeto (kiosk-pro-frontend)

### Passo 2: Configure a Variável de Ambiente
1. Clique em **Settings** (Configurações)
2. No menu lateral, clique em **Environment Variables**
3. Adicione a seguinte variável:

```
Name:  VITE_API_URL
Value: https://backendkioskpro.onrender.com
```

### Passo 3: Selecione os Ambientes
Marque as opções:
- ✅ **Production** (Produção)
- ✅ **Preview** (Pré-visualização)
- ✅ **Development** (Desenvolvimento - opcional)

### Passo 4: Salvar e Fazer Redeploy
1. Clique em **Save**
2. Vá até a aba **Deployments**
3. Clique nos três pontinhos `...` do último deploy
4. Selecione **Redeploy**
5. Marque a opção **Use existing Build Cache** (opcional, para deploy mais rápido)
6. Clique em **Redeploy**

---

## 🧪 Testando Localmente

### Desenvolvimento Local com Backend do Render:
```bash
# O arquivo .env.local já está configurado com:
VITE_API_URL=https://backendkioskpro.onrender.com

# Execute o projeto:
npm run dev
```

### Desenvolvimento Local com Backend Local:
```bash
# Altere o .env.local para:
VITE_API_URL=http://localhost:3001

# Execute o backend local primeiro
# Depois execute o frontend:
npm run dev
```

---

## 🔍 Como Funciona

### No Código:
```typescript
// Exemplo do padrão usado em todos os arquivos:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Comportamento:
- **No Vercel (produção)**: Usa `https://backendkioskpro.onrender.com`
- **Localmente sem .env**: Usa `http://localhost:3001` (fallback)
- **Localmente com .env.local**: Usa o valor definido no arquivo

---

## 📱 URLs de Configuração Rápida

### Vercel Dashboard:
```
https://vercel.com/dashboard
```

### Configuração de Variáveis (substitua YOUR_PROJECT):
```
https://vercel.com/YOUR_USERNAME/YOUR_PROJECT/settings/environment-variables
```

---

## ⚠️ Importante

1. **Não commitar .env.local**: Este arquivo já está no `.gitignore`
2. **Backend deve aceitar CORS**: Verifique se o backend no Render está configurado para aceitar requisições do domínio do Vercel
3. **HTTPS obrigatório**: O Vercel usa HTTPS, certifique-se que o backend também usa

---

## 🛠️ Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 🐛 Troubleshooting

### Erro de CORS:
Se aparecer erro de CORS no console do navegador:
```javascript
// No backend (server.js), adicione:
const cors = require('cors');
app.use(cors({
  origin: ['https://seu-dominio.vercel.app', 'http://localhost:3000']
}));
```

### Variável não carrega:
- Certifique-se de que fez **Redeploy** após adicionar a variável
- Verifique se o nome está correto: `VITE_API_URL` (com prefixo `VITE_`)
- Limpe o cache do navegador
- No Vercel, vá em Deployments → Redeploy (sem cache)

### Backend não responde:
- Verifique se o backend no Render está ativo
- Teste a URL diretamente: `https://backendkioskpro.onrender.com/api/users`
- Verifique os logs no Render

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel Dashboard → Deployments → Logs
2. Verifique o console do navegador (F12)
3. Teste o backend diretamente no navegador

---

**✨ Configuração concluída! Seu frontend agora está pronto para se conectar ao backend no Render.**
