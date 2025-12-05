# 🎨 Sistema de Cores Dinâmicas Multi-Tenant

## Visão Geral

Este sistema permite que cada loja tenha sua própria identidade visual (cores personalizadas) sem precisar alterar o código. As cores são carregadas da configuração da loja e aplicadas automaticamente via CSS Custom Properties.

## Como Funciona

1. **Configuração da Loja** (`StoreContext.tsx`):

   - Carrega `primaryColor`, `secondaryColor`, `accentColor` da API
   - Aplica as cores usando `applyStoreTheme()` do `themeColors.ts`

2. **Variáveis CSS** (disponíveis globalmente):

   ```css
   --color-primary         /* Cor principal da loja */
   --color-primary-hover   /* 10% mais escura para hover */
   --color-primary-active  /* 20% mais escura para active/pressed */
   --color-primary-light   /* 40% mais clara para backgrounds */
   --color-primary-lighter /* 60% mais clara para backgrounds sutis */
   --color-secondary       /* Cor secundária */
   --color-accent          /* Cor de destaque */
   ```

3. **Uso nos Componentes**:

### ✅ RECOMENDADO: Usar CSS Variables

```tsx
// Classes inline com Tailwind (via arbitrary values)
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
  Adicionar ao Carrinho
</button>

// CSS/styled-components
<div style={{ backgroundColor: 'var(--color-primary)' }}>
  ...
</div>
```

### ❌ EVITAR: Cores hardcoded

```tsx
// NÃO fazer isso ❌
<button className="bg-amber-500 hover:bg-amber-600">
  Botão
</button>

// ✅ Fazer isso ao invés
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
  Botão
</button>
```

## Exemplos Práticos

### Botões

```tsx
// Botão primário
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white px-4 py-2 rounded-lg">
  Confirmar
</button>

// Badge/Tag
<span className="bg-[var(--color-primary-light)] text-[var(--color-secondary)] px-3 py-1 rounded-full">
  Novo
</span>
```

### Bordas e Acentos

```tsx
// Border
<div className="border-2 border-[var(--color-primary)]">
  Card
</div>

// Border-left accent
<div className="border-l-4 border-[var(--color-accent)] bg-[var(--color-primary-lighter)]">
  Destaque
</div>
```

### Texto

```tsx
// Texto colorido
<h1 className="text-[var(--color-secondary)]">
  Título
</h1>

// Link
<a className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
  Ver mais
</a>
```

### Focus States (Inputs)

```tsx
<input
  className="border-2 border-stone-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
  type="text"
/>
```

## Cores de Fallback

Caso o backend não retorne cores personalizadas, o sistema usa:

- **Primary**: `#f59e0b` (amber-500)
- **Secondary**: `#78350f` (amber-900)
- **Accent**: `#fbbf24` (amber-400)

Essas cores estão definidas em:

- `contexts/StoreContext.tsx` → `DEFAULT_STORE_CONFIG`
- `index.html` → `:root` CSS variables (fallback inicial)

## Migração de Código Existente

Para migrar componentes que usam cores hardcoded:

1. **Encontrar todas as classes amber**:

   ```bash
   # Procurar por: amber-500, amber-600, amber-700, etc.
   grep -r "amber-" pages/ components/
   ```

2. **Substituir por CSS variables**:

   - `bg-amber-500` → `bg-[var(--color-primary)]`
   - `bg-amber-600` / `hover:bg-amber-600` → `bg-[var(--color-primary-hover)]`
   - `bg-amber-700` / `active:bg-amber-700` → `bg-[var(--color-primary-active)]`
   - `bg-amber-100` → `bg-[var(--color-primary-light)]`
   - `bg-amber-50` → `bg-[var(--color-primary-lighter)]`
   - `text-amber-600` → `text-[var(--color-primary)]`
   - `text-amber-800` → `text-[var(--color-secondary)]`
   - `border-amber-500` → `border-[var(--color-primary)]`

3. **Testar**:
   - Logar com diferentes lojas
   - Verificar se as cores mudam corretamente

## Backend API

O sistema espera um endpoint `/api/store-config`:

```http
GET /api/store-config
Headers: x-store-id: pastelaria-joao

Response:
{
  "id": "pastelaria-joao",
  "name": "Pastelaria João",
  "logo": "https://cdn.example.com/logo.png",
  "primaryColor": "#dc2626",    // red-600
  "secondaryColor": "#7f1d1d",  // red-900
  "accentColor": "#f87171"      // red-400
}
```

Até o backend implementar este endpoint, o frontend usa a configuração padrão (Kiosk Pro com cores amber).

## Arquivos Relacionados

- `utils/themeColors.ts` - Lógica de aplicação de cores
- `contexts/StoreContext.tsx` - Carregamento da configuração da loja
- `index.html` - Definição inicial das CSS variables
- `App.tsx` - Wrapper com StoreProvider

## Troubleshooting

**Cores não estão mudando:**

1. Verificar se `StoreProvider` está envolvendo a aplicação no `App.tsx`
2. Verificar se `applyStoreTheme()` está sendo chamado no `StoreContext.tsx`
3. Abrir DevTools → Elements → html → Computed → verificar se `--color-primary` está definido

**Cores aparecem erradas:**

1. Verificar formato hexadecimal: `#RRGGBB` (6 dígitos)
2. Verificar logs no console: `🏪 Carregando configuração da loja`
3. Verificar se backend está retornando cores válidas

## Referências

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind CSS Arbitrary Values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)
