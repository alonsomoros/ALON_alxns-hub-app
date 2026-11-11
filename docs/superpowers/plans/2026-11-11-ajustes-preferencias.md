# Ajustes y preferencias (REQ-003) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pantalla de Ajustes con seis temas, tres vistas de stats, orden y visibilidad de tarjetas de Inicio, intervalo de refresco y preferencias sincronizadas con la API.

**Architecture:** Los temas son datos en `src/themes.ts` que se escriben como variables CSS en `<html>`; `index.css` solo consume `var(--…)` y deriva los tonos secundarios con `color-mix()`. Las preferencias se validan con `parsePreferences`, se leen de `localStorage` antes de pintar y viajan dentro del `PUT /api/state` existente. Los módulos puros (`themes`, `contrast`, `preferences`, `piStats`) se prueban con `node:test` sin dependencias nuevas.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, CSS (`color-mix`), SVG, `node:test` con `--experimental-strip-types` (Node 22.17).

**Spec:** [`Issues/003-parametros-y-preferencias.md`](../../../Issues/003-parametros-y-preferencias.md) y [`docs/arquitectura/ui-preferences.md`](../../arquitectura/ui-preferences.md).

## Global Constraints

- Idioma de textos de UI, docs y commits de documentación: español; commits con prefijo en inglés y el formato del repo (`Refs #3`, `Issue local`, `Requirements`, `Tests`, `Docs`, `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`), mensaje desde archivo con `git commit -F`.
- Sin dependencias nuevas de producción ni de desarrollo. Los módulos probados importan con extensión `.ts` (`allowImportingTsExtensions` ya está activo) y no usan `import.meta.env` ni el DOM en el nivel superior.
- Valores por defecto: `theme: 'soft'`, `statsView: 'bars'`, `piRefreshSeconds: 60`, tarjetas `pi, goals, services, links` visibles en ese orden. Refresco permitido: 30, 60 o 120.
- `index.css` no contiene colores fuera de los bloques `:root` de tokens. Los colores de categoría `green`, `yellow`, `blue` pasan a `--accent`, `--warn`, `--info`.
- Contraste WCAG AA (≥ 4.5:1) para `text` y `textMuted` sobre `bg` y `surface`, y `onAccentStrong` sobre `accentStrong`, en los seis temas.
- Siempre queda al menos una tarjeta de Inicio visible. Nada bloquea el render: sin API, `localStorage` basta.
- Cada fase termina con `npm test`, `npm run lint`, `npm run build`, el validador de docs y una comprobación en Chrome, y se cierra con un commit y push a `main` (sin force). `gh` está en `C:\Program Files\GitHub CLI\gh.exe`.
- Desviaciones respecto a la especificación (registrarlas en `Issues/003` al cerrar): el conjunto de variables base es de 12 (`bg, surface, text, textMuted, border, accent, accent2, accentStrong, onAccentStrong, warn, danger, info`) y el resto se deriva en CSS; `soft` oscurece `textMuted` a `#5f6f65` para cumplir AA; se añade `npm test` (`node:test`), que adelanta parte de `REQ-020`.

## Review Focus

1. `localStorage` bloqueado o con JSON corrupto: la app arranca con los valores por defecto y sin excepción (Task 2).
2. Preferencias antiguas o ajenas en la API (`{ theme: 'soft', mode: 'light', raspberryPiStatsShowcase: 'pbar' }`, un array, un número): se completan con valores por defecto (Task 2).
3. Base de datos vacía (`version: 0`): no sustituye retos ni enlaces por listas vacías (Task 8).
4. Ocultar la última tarjeta visible o mover más allá de los extremos: se rechaza sin romper el orden (Task 6).
5. Métricas `null`, `NaN`, negativas o mayores de 100 en anillos y medidores: se acotan a 0-100 y no generan atributos SVG inválidos (Task 4).

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/themes.ts` (nuevo) | Datos de los seis temas, `tokenVarName`, `applyTheme` |
| `src/domain/contrast.ts` (nuevo) | `contrastRatio` WCAG |
| `src/domain/preferences.ts` (nuevo) | Valores por defecto, `parsePreferences`, `moveCard`, `setCardVisible` |
| `src/domain/persistedState.ts` (nuevo) | `shouldAdoptRemote` |
| `src/domain/piStats.ts` (nuevo) | `formatMetric`, `metricPercent` |
| `src/infrastructure/preferencesStore.ts` (nuevo) | Lectura y escritura síncronas en `localStorage` |
| `src/hooks/usePreferences.ts` (nuevo) | Estado de preferencias, aplicación del tema |
| `src/components/ui/PiStats.tsx` (nuevo) | Renderizadores `bars`, `rings`, `gauges` |
| `src/components/settings/{SettingsView,ThemePicker,HomeCardsEditor}.tsx` (nuevos) | Pantalla de Ajustes |
| `tests/*.test.ts` (nuevos) | `node:test` de los módulos puros y del CSS |
| `src/index.css`, `src/main.tsx`, `src/types/dashboard.ts`, `src/data/dashboardData.ts`, `src/hooks/{useQuote,usePiMetrics,usePersistedDashboard}.ts`, `src/infrastructure/persistence.ts`, `src/components/{Dashboard,home/HomeView,layout/SiteHeader}.tsx`, `package.json` | Modificados |

## Fase 1 — temas, Ajustes y vistas de stats

### Task 1: Temas y contraste

**Files:**
- Create: `src/themes.ts`, `src/domain/contrast.ts`, `tests/themes.test.ts`
- Modify: `package.json` (script `"test": "node --experimental-strip-types --test tests/"`)

**Interfaces:**
- Produces: `type ThemeId = 'soft' | 'ocean' | 'sunset' | 'lavender' | 'graphite' | 'dark'`; `type ThemeTokenKey` (las 12 claves); `interface ThemeDefinition { id: ThemeId; label: string; tokens: Record<ThemeTokenKey, string> }`; `themeIds: ThemeId[]` (en el orden de la tabla); `themes: Record<ThemeId, ThemeDefinition>`; `tokenVarName(key: ThemeTokenKey): string`; `applyTheme(id: ThemeId, root?: { style: { setProperty(name: string, value: string): void } }): void`; `contrastRatio(foreground: string, background: string): number`.

- [ ] **Step 1: Escribir `tests/themes.test.ts` (fallará)** con estos casos: `contrastRatio('#000000','#ffffff')` ≈ 21 y `contrastRatio('#336699','#336699') === 1`; `themeIds` tiene 6 ids únicos; cada tema define las 12 claves como `#rrggbb`; para cada tema `contrastRatio(text,bg)`, `(text,surface)`, `(textMuted,bg)`, `(textMuted,surface)` y `(onAccentStrong,accentStrong)` son ≥ 4.5; `tokenVarName('onAccentStrong') === '--on-accent-strong'` y `tokenVarName('bg') === '--bg'`; `applyTheme('ocean', fakeRoot)` llama a `setProperty` 12 veces con `'--accent'` → `'#3b82a0'` entre ellas (sin `meta` cuando `document` no existe).
- [ ] **Step 2: Ejecutar** `npm test` → falla porque los módulos no existen.
- [ ] **Step 3: Implementar `src/domain/contrast.ts`** (luminancia relativa WCAG 2.x sobre `#rrggbb`) y **`src/themes.ts`** con estos valores exactos (`bg, surface, text, textMuted, border, accent, accent2, accentStrong, onAccentStrong, warn, danger, info`):

| Tema (`label`) | Valores |
|---|---|
| `soft` («Soft verde») | `#f5f7f4 #ffffff #344b42 #5f6f65 #e3ebe3 #7ca34b #a4c85b #526c5a #ffffff #d18f4d #d78a78 #6cabb9` |
| `ocean` («Océano») | `#f3f8fa #ffffff #1f3a4a #4f6b7a #dde9ee #3b82a0 #7fd1c7 #2b6580 #ffffff #d18f4d #d9776b #6aa7d6` |
| `sunset` («Atardecer») | `#fbf5f1 #ffffff #4a2f26 #7a5545 #f0e1d8 #d9783f #e8a0a0 #b4552a #ffffff #c98a1f #c4524a #6cabb9` |
| `lavender` («Lavanda») | `#f6f4fb #ffffff #35305a #625c86 #e6e1f3 #7c6bb0 #c7b8ea #5d4d94 #ffffff #d18f4d #d0707e #6c9ed0` |
| `graphite` («Grafito») | `#f1f2f3 #ffffff #26303a #55616d #e0e3e6 #44505c #e8bc5c #2f3a45 #ffffff #d18f4d #c9695b #6c9ebf` |
| `dark` («Oscuro») | `#0b0c0e #16181b #f2f3f5 #a3a9b1 #2a2d32 #e6e8eb #8b93a0 #f2f3f5 #0b0c0e #e0a45a #e58a7c #7fb6c6` |

  `applyTheme` escribe cada token con `setProperty(tokenVarName(key), value)` y, si existe `document`, actualiza `meta[name="theme-color"]` con `bg`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS. Ejecutar `npm run lint` → sin avisos.

### Task 2: Preferencias, almacenamiento local y estado remoto

**Files:**
- Modify: `src/types/dashboard.ts` (añadir `StatsView`, `HomeCardId`, `HomeCardPref`, `UiPreferences`; borrar `DashboardConfig`; `DashboardView` añade `'settings'`)
- Create: `src/domain/preferences.ts`, `src/domain/persistedState.ts`, `src/infrastructure/preferencesStore.ts`, `tests/preferences.test.ts`

**Interfaces:**
- Consumes: `ThemeId`, `themeIds` de Task 1.
- Produces: `defaultPreferences: UiPreferences`; `parsePreferences(raw: unknown): UiPreferences`; `moveCard(cards: HomeCardPref[], id: HomeCardId, direction: -1 | 1): HomeCardPref[]`; `setCardVisible(cards: HomeCardPref[], id: HomeCardId, visible: boolean): HomeCardPref[]`; `shouldAdoptRemote(state: { version: number } | null): boolean`; `readStoredPreferences(storage?: Pick<Storage, 'getItem'>): UiPreferences`; `storePreferences(preferences: UiPreferences, storage?: Pick<Storage, 'setItem'>): void` (clave `alxns:preferences`, nunca lanza).

- [ ] **Step 1: Escribir `tests/preferences.test.ts` (fallará)**: `parsePreferences(null)`, `(42)`, `('x')`, `([])` y `({})` devuelven `defaultPreferences`; `parsePreferences({ theme: 'neon', statsView: 'pie', piRefreshSeconds: 45 })` → `soft`, `bars`, `60`; el objeto antiguo `{ theme: 'soft', mode: 'light', quote: 'random', orderServices: [], raspberryPiStatsShowcase: 'pbar' }` → valores por defecto sin claves extra; `homeCards` con duplicados, ids desconocidos y una sola tarjeta (`goals`) → las cuatro ids una vez, `goals` primero y las que faltan al final en orden por defecto; todas `visible: false` → la primera queda `visible: true`; `moveCard(cards,'pi',-1)` en el primero y `moveCard(cards,'links',1)` en el último devuelven el mismo orden; `setCardVisible(cards,'pi',false)` con una sola visible devuelve las tarjetas sin cambios; `shouldAdoptRemote(null) === false`, `({version:0}) === false`, `({version:3}) === true`; `readStoredPreferences({ getItem() { throw new Error('blocked') } })` y con `getItem: () => '{nope'` devuelven los valores por defecto; `storePreferences(p, { setItem() { throw new Error('quota') } })` no lanza.
- [ ] **Step 2: Ejecutar** `npm test` → falla.
- [ ] **Step 3: Implementar los cuatro módulos** con las firmas indicadas (`parsePreferences` fuerza `schemaVersion: 1`; `readStoredPreferences` usa `window.localStorage` por defecto solo si existe). Eliminar `dashboardConfig` de `src/data/dashboardData.ts` y exportar en su lugar `quoteMode: 'default' | 'random' | 'fav' = 'random'`; en `src/hooks/useQuote.ts` sustituir `dashboardConfig.quote` por `quoteMode`. En `usePersistedDashboard.ts` retirar temporalmente `dashboardConfig` enviando `preferences: null` (se sustituye en Task 8).
- [ ] **Step 4: Ejecutar** `npm test` → PASS; `npm run build` → sin errores de tipos.

### Task 3: Variables CSS y aplicación del tema

**Files:**
- Modify: `src/index.css`, `src/main.tsx`
- Create: `src/hooks/usePreferences.ts`, `tests/css-tokens.test.ts`

**Interfaces:**
- Consumes: `applyTheme`, `themes`, `tokenVarName` (Task 1); `readStoredPreferences`, `storePreferences`, `defaultPreferences` (Task 2).
- Produces: `usePreferences(): { preferences: UiPreferences; setPreferences: (next: UiPreferences) => void; resetPreferences: () => void }` (cada cambio persiste en `localStorage` y llama a `applyTheme`).

- [ ] **Step 1: Escribir `tests/css-tokens.test.ts` (fallará)**: leer `src/index.css`; quitar los bloques `:root { … }` que declaran variables; comprobar que en el resto no hay coincidencias de `/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i`; comprobar que cada `var(--x)` usado está declarado en un `:root` o es una de las 12 variables base de `themes.soft.tokens` (vía `tokenVarName`).
- [ ] **Step 2: Ejecutar** `npm test` → falla (hay ~65 colores fijos).
- [ ] **Step 3: Refactorizar `src/index.css`.** Añadir un bloque `:root` con las 12 variables base con los valores de `soft` (respaldo antes de que cargue JS) y las derivadas: `--surface-sunken: color-mix(in srgb, var(--text) 7%, var(--surface))`, `--divider: color-mix(in srgb, var(--border) 60%, var(--surface))`, `--text-body: color-mix(in srgb, var(--text) 85%, var(--surface))`, `--text-faint: color-mix(in srgb, var(--text-muted) 65%, var(--surface))` (solo decorativo: fechas, pie, marcadores), `--accent-soft`/`--warn-soft`/`--info-soft: color-mix(in srgb, var(--accent|warn|info) 14%, var(--surface))`, `--warn-text: color-mix(in srgb, var(--warn) 60%, var(--text))`, `--card-bg: color-mix(in srgb, var(--surface) 82%, transparent)`, `--sheen: color-mix(in srgb, var(--surface) 75%, transparent)`, `--shadow: color-mix(in srgb, var(--text) 8%, transparent)`, `--shadow-strong: color-mix(in srgb, var(--text) 16%, transparent)`, `--backdrop: rgb(0 0 0 / .35)`. Sustituir cada color fijo según esta tabla:

| Colores actuales | Variable |
|---|---|
| `#29333d`, `#344b42` | `--text` |
| `#52645a`, `#53645a` | `--text-body` |
| `#748078 #758178 #69766d #68766d #68776e #718078 #7c8a80 #8d9991 #7e8d82` | `--text-muted` |
| `#91a097 #a0aca4 #9aa79f #a2ada5 #a0aaa2 #a5b0a7 #afbab1 #b6c0b9 #96a19a` | `--text-faint` |
| `#f5f7f4` (página, splash, `html`), `#fbfcfa`, `#f7faf6` | `--bg` |
| `#fff` (tarjetas, pestaña activa, tiles), `rgba(255,255,255,.82)` | `--surface`, `--card-bg` |
| `#fff` como texto sobre `.primary-button` | `--on-accent-strong` |
| `#526c5a` (`.primary-button`) | `--accent-strong` |
| `#eaf0e9 #edf2eb #dde4de` y el fondo `#f5f7f4` de `.container-state.off` | `--surface-sunken` |
| `#e3ebe3 #dfe9df #e1e9e1 #ecf1eb` | `--border` |
| `#edf1ed #e5ece5` | `--divider` |
| `#7ca34b #79a442 #7aa34d #6f8e4a #698b38 #82a74e #8eae51 #91bd5b` | `--accent` |
| `#a4c85b #b8d475 #9fbd70` | `--accent-2` |
| `#eef5df #f0f6e8` | `--accent-soft` |
| `#d18f4d #e8bc5c` / `#fff2dd` / `#9a5b1f` | `--warn` / `--warn-soft` / `--warn-text` |
| `#d78a78 #cf897a` | `--danger` |
| `#6cabb9 #82b8c5` / `#e3f2f4` | `--info` / `--info-soft` |
| `rgba(..., .04–.1)` sombras / `rgba(..., .16–.18)` sombras / `rgba(41,51,61,.28)` / `rgba(255,255,255,.75)` | `--shadow` / `--shadow-strong` / `--backdrop` / `--sheen` |

  En `src/main.tsx`, antes de `createRoot(...)`, ejecutar `applyTheme(readStoredPreferences().theme)`. Implementar `usePreferences` con la firma indicada.
- [ ] **Step 4: Ejecutar** `npm test` → PASS; `npm run build`. Comprobar en Chrome (`npm run dev`, puerto libre) que `soft` se ve igual que antes salvo el texto secundario algo más oscuro, y que ejecutar en consola `localStorage.setItem('alxns:preferences', JSON.stringify({theme:'dark'}))` y recargar muestra el tema oscuro sin parpadeo del tema claro.

### Task 4: Vistas de stats

**Files:**
- Create: `src/domain/piStats.ts`, `src/components/ui/PiStats.tsx`, `tests/piStats.test.ts`
- Modify: `src/components/home/HomeView.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `StatsView`, `PiMetricValues` (tipos).
- Produces: `formatMetric(value: number | null | undefined, loading: boolean): string` (`'…'` si carga, `'—'` si no hay dato, entero sin decimales o un decimal; mover la lógica de `metricValue` de `HomeView`); `metricPercent(value: number | null | undefined): number` (acota a 0-100, `NaN`, `null` y `undefined` → 0); `interface PiStatRow { label: string; value: number | null | undefined; unit: string }`; `PiStats({ view, rows, loading }: { view: StatsView; rows: PiStatRow[]; loading: boolean })`.

- [ ] **Step 1: Escribir `tests/piStats.test.ts` (fallará)**: `metricPercent(NaN) === 0`, `(null) === 0`, `(undefined) === 0`, `(-5) === 0`, `(140) === 100`, `(42.5) === 42.5`; `formatMetric(null,false) === '—'`, `(1.44,false) === '1.4'`, `(30,false) === '30'`, `(5,true) === '…'`.
- [ ] **Step 2: Ejecutar** `npm test` → falla.
- [ ] **Step 3: Implementar `src/domain/piStats.ts` y `PiStats`.** `bars` reutiliza `Metric`; `rings` dibuja una cuadrícula 2×2 con `<circle r="15.9155">` y `strokeDasharray="${p} ${100 - p}"` girado -90°, con el valor en el centro; `gauges` dibuja un `<path d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100">` con `strokeDasharray="${p} 100"` y el valor bajo el arco. Cada métrica lleva `role="img"` y `aria-label="CPU: 1.4 %"` (o «sin dato»). Colores solo con variables (`stroke: var(--accent)`, pista `var(--surface-sunken)`). En `HomeView`, `PiCard` usa `PiStats` con `view` recibido como prop (`statsView`, valor `'bars'` hasta Task 5) y elimina `metricValue` y `metricProgress` locales.
- [ ] **Step 4: Ejecutar** `npm test` → PASS; `npm run build`.

### Task 5: Pantalla de Ajustes (apariencia) y cierre de fase 1

**Files:**
- Create: `src/components/settings/SettingsView.tsx`, `src/components/settings/ThemePicker.tsx`
- Modify: `src/components/Dashboard.tsx`, `src/components/layout/SiteHeader.tsx`, `src/components/home/HomeView.tsx` (recibe `statsView`), `src/index.css`, `package.json` (ya con `test`)

**Interfaces:**
- Consumes: `usePreferences`, `themes`, `themeIds`, `UiPreferences`.
- Produces: `ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void })` (`role="radiogroup"`, un `role="radio"` por tema con `aria-checked` y `aria-label` con el nombre; flechas izquierda/derecha mueven la selección; cuadrado de 44 px con dos triángulos `linear-gradient(135deg, accent 50%, accent2 50%)` leyendo `themes[id].tokens`); `SettingsView({ preferences, onChange, onReset, onBack })`; `SiteHeader` recibe `onOpenSettings: () => void` y muestra un botón con icono `Settings` de `lucide-react` y `aria-label="Ajustes"`.

- [ ] **Step 1: Implementar `ThemePicker` y `SettingsView`** con la sección «Apariencia» (selector de tema y `<select>` nativo «Vista de estadísticas» con `Barras`, `Anillos`, `Medidores`) y botón «Restablecer» que llama a `onReset`; `BackButton` existente para volver. Añadir `activeView === 'settings'` en `Dashboard` y pasar `preferences.statsView` a `HomeView`.
- [ ] **Step 2: Verificar en Chrome** (`npm run dev`): el engranaje abre Ajustes; cada uno de los seis cuadrados cambia el tema al instante y sobrevive a una recarga; cada vista de stats se ve bien en los seis temas (captura de `dark` y de `sunset`); navegación con teclado por el `radiogroup`; sin errores de consola.
- [ ] **Step 3: Comprobar** `npm test`, `npm run lint`, `npm run build` y el validador `python <scratchpad>/validate.py` (índice, enlaces y REQ).
- [ ] **Step 4: Documentar y cerrar la fase:** en `Issues/003` marcar los criterios de contraste, temas, vistas de stats e `index.css` sin colores fijos, y registrar las desviaciones de Global Constraints; añadir a `Issues/020` (REQ-020) una línea indicando que `npm test` con `node:test` ya existe para módulos puros. Commit `feat(settings): add themes and stats views behind a settings screen (REQ-003)` con `Refs #3` y push a `main`.

## Fase 2 — tarjetas, refresco y sincronización

### Task 6: Tarjetas de Inicio

**Files:**
- Create: `src/components/settings/HomeCardsEditor.tsx`
- Modify: `src/components/settings/SettingsView.tsx`, `src/components/home/HomeView.tsx`, `src/components/Dashboard.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `moveCard`, `setCardVisible`, `HomeCardPref`.
- Produces: `HomeCardsEditor({ cards, onChange }: { cards: HomeCardPref[]; onChange: (cards: HomeCardPref[]) => void })` (fila por tarjeta con nombre en español, interruptor `role="switch"` y botones «Subir» y «Bajar» con `aria-label`; el interruptor de la única tarjeta visible queda `disabled`; los botones de los extremos quedan `disabled`); `HomeView` recibe `cards: HomeCardPref[]` y renderiza solo las visibles en ese orden.

- [ ] **Step 1: Implementar el editor** y la sección «Inicio» de Ajustes; `HomeView` mapea `cards` a `PiCard`, `GoalsSummaryCard`, `ServicesCard` y `LinksSummaryCard` según el id.
- [ ] **Step 2: Verificar en Chrome:** ocultar y reordenar cambia Inicio al volver; no se puede ocultar la última tarjeta visible; el orden y la visibilidad sobreviven a una recarga; sin errores de consola.

### Task 7: Intervalo de refresco

**Files:**
- Modify: `src/hooks/usePiMetrics.ts`, `src/components/Dashboard.tsx`, `src/components/settings/SettingsView.tsx`

**Interfaces:**
- Produces: `usePiMetrics(enabled: boolean, intervalSeconds: 30 | 60 | 120 = 60)` (el efecto depende de `intervalSeconds` y reinicia el temporizador al cambiarlo; se mantienen la pausa con pestaña oculta y el último dato válido).

- [ ] **Step 1: Cambiar `pollIntervalMs` por el parámetro** y añadir la sección «Datos» con un `<select>` «Actualizar métricas cada» (`30 s`, `60 s`, `120 s`) conectado a `piRefreshSeconds`.
- [ ] **Step 2: Verificar en Chrome** con la API local (`server/index.js` en un puerto libre, `PROMETHEUS_URL` apuntando a la Pi por LAN y el proxy de Docker simulado de la sesión anterior): con `30 s` aparecen peticiones a `/api/pi/metrics` cada ~30 s (pestaña Red o `read_network_requests`), y al cambiar a `120 s` el ritmo cambia sin recargar.

### Task 8: Sincronización con la API y base vacía

**Files:**
- Modify: `src/hooks/usePersistedDashboard.ts`, `src/infrastructure/persistence.ts`, `src/components/Dashboard.tsx`
- Test: `tests/preferences.test.ts` (los casos de `shouldAdoptRemote` ya existen desde Task 2)

**Interfaces:**
- Consumes: `shouldAdoptRemote`, `parsePreferences`, `usePreferences`.
- Produces: `usePersistedDashboard(preferences: UiPreferences, onRemotePreferences: (preferences: UiPreferences) => void)`; `class PersistenceConflictError extends Error` exportada por `persistence.ts` y lanzada por `savePersistedState` cuando la respuesta es `409`.

- [ ] **Step 1: Hidratación:** si `shouldAdoptRemote(state)`, aplicar `goals` y `links` y, si `state.preferences` no es `null`, llamar a `onRemotePreferences(parsePreferences(state.preferences))`; si no, conservar los datos de ejemplo (corrige el fallo de la base vacía).
- [ ] **Step 2: Guardado:** incluir `preferences` en el `PUT` con debounce de 400 ms (`goals`, `links` y `preferences` como dependencias); ante `PersistenceConflictError`, recargar con `loadPersistedState`, actualizar solo `version.current` (gana el último cambio local) y reintentar una vez.
- [ ] **Step 3: Verificar en Chrome con la API local y una base nueva** (`DB_PATH` en el scratchpad): (a) con la base vacía, retos y enlaces de ejemplo siguen visibles; (b) cambiar el tema en una pestaña y abrir otra (mismo origen, `localhost:<puerto>` permitido en `ALLOWED_ORIGINS`) muestra el mismo tema tras cargar; (c) con dos pestañas abiertas, cambiar el tema en ambas alternando provoca un `409` y la segunda consigue guardar tras reintentar (sin estado `OFFLINE` en el pie); (d) con la API parada, cambiar el tema sigue funcionando y se guarda en local.

### Task 9: Cierre de fase 2 y documentación

**Files:**
- Modify: `Issues/003-parametros-y-preferencias.md`, `Issues/README.md`, `docs/arquitectura/ui-preferences.md`, `docs/requisitos/functional-requirements.md`, `docs/codebase/STRUCTURE.md`, `.agents/context/system-status.md`, `context/STYLE_GUIDE.md`, `docs/diagramas/screens-flow.svg`, `docs/requisitos/backlog-features.md`

- [ ] **Step 1: Actualizar documentos:** `ui-preferences.md` pasa de «pendiente de implementar» a implementado; FR de preferencias en `functional-requirements.md`; `STRUCTURE.md` con `themes.ts`, `domain/preferences.ts`, `components/settings/`, `tests/`; `system-status.md` (ajustes y sincronización implementados, `npm test`); `STYLE_GUIDE.md` con la regla «sin colores fijos: usar variables de tema»; `screens-flow.svg` con la vista de Ajustes marcada `IMPLEMENTADO`; `backlog-features.md` con modo claro/oscuro automático y saludo/cita editables.
- [ ] **Step 2: Comprobar** `npm test`, `npm run lint`, `npm run build` y el validador; repetir la comprobación de Chrome de las tres verificaciones de la fase.
- [ ] **Step 3: Cerrar:** `Issues/003` pasa a `Hecho` con todos los criterios marcados y la tabla de verificación (incluye el script de contraste y los resultados de Chrome); `Issues/README.md` a `Hecho`; commit `feat(settings): home cards, refresh interval and synced preferences (REQ-003)` con `Refs #3`, push a `main` y `gh issue close 3 --reason completed` con un comentario que resuma lo verificado.
- [ ] **Step 4: Comprobar producción:** esperar al despliegue de Vercel y confirmar que el bundle contiene la pantalla (buscar `Restablecer` en el JS) y que `https://alxns-hub.vercel.app` carga con Tailscale activo.
