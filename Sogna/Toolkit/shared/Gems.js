/**
 * Sogna Hidden Gems
 * Ported and institutionalized from 21st-sdk.
 */

/**
 * Calcula la luminancia relativa (WCAG) de un color hex.
 */
export function getLuminance(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const toLinear = (v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Devuelve un color de texto contrastante (blanco/negro) basado en el fondo.
 */
export function getContrastText(bgHex) {
  if (!bgHex) return "inherit";
  return getLuminance(bgHex) > 0.179 ? "#1a1a1a" : "#ffffff";
}

/**
 * Corrige los saltos de línea en listas numeradas durante el streaming.
 * Joya oculta de streaming-markdown.tsx
 */
export function fixStreamingLists(text) {
  return text.replace(/^(\d+)\.\s*\n+\s*\n*/gm, "$1. ");
}

/**
 * Adaptador de estado de herramientas (AgentIQI).
 */
export const ToolStatus = {
  THINKING: 'thinking',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  ERROR: 'error'
};
/**
 * Carga dinámicamente una fuente de Google Fonts si no es una fuente del sistema.
 */
export function loadGoogleFont(fontFamily) {
  if (typeof document === 'undefined' || !fontFamily) return;
  const SYSTEM_FONTS = new Set([
    "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont",
    "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans",
    "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times",
    "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas",
    "Liberation Mono", "Courier New", "serif", "sans-serif", "monospace",
  ]);

  const name = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
  if (!name || SYSTEM_FONTS.has(name)) return;

  const encoded = encodeURIComponent(name);
  if (document.querySelector(`link[href*="${encoded}"]`)) return;

  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);
}
