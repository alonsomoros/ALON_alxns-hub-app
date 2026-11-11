export type ThemeId = 'soft' | 'ocean' | 'sunset' | 'lavender' | 'graphite' | 'dark'
export type ThemeTokenKey = 'bg' | 'surface' | 'text' | 'textMuted' | 'border' | 'accent' | 'accent2' | 'accentStrong' | 'onAccentStrong' | 'warn' | 'danger' | 'info'

/** `swatch`: los dos colores del cuadrado del selector (por defecto acento y acento secundario). */
export interface ThemeDefinition { id: ThemeId; label: string; tokens: Record<ThemeTokenKey, string>; swatch: [string, string] }

const define = (id: ThemeId, label: string, values: string, swatch?: [string, string]): ThemeDefinition => {
  const [bg, surface, text, textMuted, border, accent, accent2, accentStrong, onAccentStrong, warn, danger, info] = values.split(' ')
  return { id, label, swatch: swatch ?? [accent, accent2], tokens: { bg, surface, text, textMuted, border, accent, accent2, accentStrong, onAccentStrong, warn, danger, info } }
}

// Orden de valores: bg surface text textMuted border accent accent2 accentStrong onAccentStrong warn danger info.
// Los tonos secundarios (sombras, fondos suaves) se derivan en index.css con color-mix().
export const themes: Record<ThemeId, ThemeDefinition> = {
  soft: define('soft', 'Soft verde', '#f5f7f4 #ffffff #344b42 #5f6f65 #e3ebe3 #7ca34b #a4c85b #526c5a #ffffff #d18f4d #d78a78 #6cabb9'),
  ocean: define('ocean', 'Océano', '#f3f8fa #ffffff #1f3a4a #4f6b7a #dde9ee #3b82a0 #7fd1c7 #2b6580 #ffffff #d18f4d #d9776b #6aa7d6'),
  sunset: define('sunset', 'Atardecer', '#fbf5f1 #ffffff #4a2f26 #7a5545 #f0e1d8 #d9783f #e8a0a0 #b4552a #ffffff #c98a1f #c4524a #6cabb9'),
  lavender: define('lavender', 'Lavanda', '#f6f4fb #ffffff #35305a #625c86 #e6e1f3 #7c6bb0 #c7b8ea #5d4d94 #ffffff #d18f4d #d0707e #6c9ed0'),
  graphite: define('graphite', 'Grafito', '#f1f2f3 #ffffff #26303a #55616d #e0e3e6 #44505c #e8bc5c #2f3a45 #ffffff #d18f4d #c9695b #6c9ebf'),
  dark: define('dark', 'Oscuro', '#0b0c0e #16181b #f2f3f5 #a3a9b1 #2a2d32 #e6e8eb #8b93a0 #f2f3f5 #0b0c0e #e0a45a #e58a7c #7fb6c6', ['#0b0c0e', '#f2f3f5']),
}

export const themeIds = Object.keys(themes) as ThemeId[]

/** Tema anterior o siguiente en el orden de `themeIds`, con vuelta al principio o al final. */
export const stepTheme = (id: ThemeId, direction: -1 | 1): ThemeId => themeIds[(themeIds.indexOf(id) + direction + themeIds.length) % themeIds.length]

/** `onAccentStrong` -> `--on-accent-strong`, `accent2` -> `--accent-2`. */
export const tokenVarName = (key: ThemeTokenKey): string => `--${key.replace(/([A-Z])/g, '-$1').replace(/(\d+)$/, '-$1').toLowerCase()}`

/** Escribe los tokens del tema como variables CSS (en `<html>` por defecto) y actualiza `theme-color`. */
export function applyTheme(id: ThemeId, root: { style: { setProperty(name: string, value: string): void } } = document.documentElement): void {
  const { tokens } = themes[id]
  for (const key of Object.keys(tokens) as ThemeTokenKey[]) root.style.setProperty(tokenVarName(key), tokens[key])
  if (typeof document !== 'undefined') document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
}
