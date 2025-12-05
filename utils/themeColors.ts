/**
 * 🎨 SISTEMA DE CORES DINÂMICAS MULTI-TENANT
 *
 * Aplica as cores da loja como CSS Custom Properties (variáveis CSS)
 * para permitir temas personalizados por tenant.
 */

export interface StoreColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

/**
 * Aplica as cores da loja como variáveis CSS no :root
 * Isso permite usar var(--color-primary) em todo o app
 */
export function applyStoreTheme(colors: StoreColors): void {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", colors.primaryColor);
  root.style.setProperty("--color-secondary", colors.secondaryColor);
  root.style.setProperty("--color-accent", colors.accentColor);

  // Calcula versões mais claras/escuras para hover/active states
  root.style.setProperty(
    "--color-primary-hover",
    adjustColorBrightness(colors.primaryColor, -10)
  );
  root.style.setProperty(
    "--color-primary-active",
    adjustColorBrightness(colors.primaryColor, -20)
  );
  root.style.setProperty(
    "--color-primary-light",
    adjustColorBrightness(colors.primaryColor, 40)
  );
  root.style.setProperty(
    "--color-primary-lighter",
    adjustColorBrightness(colors.primaryColor, 60)
  );
}

/**
 * Ajusta o brilho de uma cor hex
 * @param hex - Cor no formato #RRGGBB
 * @param percent - Percentual de ajuste (-100 a 100)
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # se existir
  const color = hex.replace("#", "");

  // Converte para RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Ajusta cada componente
  const adjust = (val: number) => {
    const adjusted = val + (val * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // Converte de volta para hex
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Remove as variáveis CSS do tema (útil para cleanup)
 */
export function removeStoreTheme(): void {
  const root = document.documentElement;
  root.style.removeProperty("--color-primary");
  root.style.removeProperty("--color-secondary");
  root.style.removeProperty("--color-accent");
  root.style.removeProperty("--color-primary-hover");
  root.style.removeProperty("--color-primary-active");
  root.style.removeProperty("--color-primary-light");
  root.style.removeProperty("--color-primary-lighter");
}
