# Parámetros y preferencias

- **Estado:** Hecho
- **REQ:** REQ-003
- **Tipo:** feat
- **Área:** `src/themes.ts`, `src/index.css`, `src/types/dashboard.ts`, `src/hooks/usePreferences.ts`, `src/components/settings/`, `src/components/home/`, `docs/arquitectura/ui-preferences.md`
- **GitHub:** [#3](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/3)
- **Actualizada:** 2026-11-11

## Problema

Los colores están fijos en `src/index.css` (unos 30 valores hexadecimales sueltos) y `DashboardConfig` solo admite `theme: 'soft'`. Hay decisiones de presentación que el usuario quiere elegir (tema, forma de ver las stats, tarjetas de Inicio, refresco), y las preferencias se envían a la API pero la app no las lee de vuelta. Una pantalla de ajustes no debe cargar la primera impresión.

## Decisión

**Alcance (elegido por el desarrollador):** seis temas, tres vistas de stats, orden y visibilidad de las tarjetas de Inicio e intervalo de refresco de las métricas. Fuera de alcance: modo claro/oscuro como ajuste independiente (el oscuro es un tema más) y saludo y cita editables.

**Modelo** (sustituye a `DashboardConfig`; la API lo guarda tal cual en `preferences`):

```ts
type ThemeId = 'soft' | 'ocean' | 'sunset' | 'lavender' | 'graphite' | 'dark'
type StatsView = 'bars' | 'rings' | 'gauges'
interface UiPreferences {
  schemaVersion: 1
  theme: ThemeId                    // por defecto 'soft'
  statsView: StatsView              // por defecto 'bars'
  piRefreshSeconds: 30 | 60 | 120   // por defecto 60
  updatedAt: string                 // ISO del último cambio del usuario ('' si se desconoce); decide qué copia gana al sincronizar
  homeCards: { id: 'pi' | 'goals' | 'services' | 'links'; visible: boolean }[]  // el orden del array es el orden en pantalla
}
```

`quote` se mantiene aparte (`useQuote`). `mode`, `orderServices` y `raspberryPiStatsShowcase` desaparecen: `statsView` y `homeCards` los sustituyen. `parsePreferences` valida cada campo y recurre al valor por defecto si es desconocido o falta (mismo patrón que `parsePiMetrics`); añade al final las tarjetas que falten.

**Temas como datos** (`src/themes.ts`): cada tema define un conjunto fijo de variables (`--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-2`, `--accent-soft`, `--ok`, `--warn`, `--danger`, `--shadow`). `applyTheme` las escribe en `document.documentElement` y actualiza `meta theme-color`. Los ~30 colores de `index.css` pasan a `var(--…)`. El selector dibuja cada cuadrado con dos triángulos (`--accent` y `--accent-2`) leyendo esos mismos datos, así que nunca se desincroniza con el tema real.

| Tema | Colores principales |
|---|---|
| `soft` (actual) | verde `#7ca34b` + `#a4c85b` |
| `ocean` | azul `#3b82a0` + turquesa `#7fd1c7` |
| `sunset` | naranja `#d9783f` + rosa `#e8a0a0` |
| `lavender` | violeta `#7c6bb0` + lila `#c7b8ea` |
| `graphite` | pizarra `#44505c` + ámbar `#e8bc5c` |
| `dark` | modo oscuro clásico: fondo negro (`#0b0c0e`), texto blanco, acento blanco/gris |

**Pantalla de Ajustes:** vista nueva (`DashboardView = 'home' | 'goals' | 'links' | 'settings'`) a la que se entra con un icono de engranaje en la cabecera, sin añadir pestaña a la navegación. Secciones: **Apariencia** (cuadrícula `radiogroup` de temas navegable con teclado y desplegable nativo de vista de stats), **Inicio** (lista de tarjetas con interruptor mostrar/ocultar y botones subir/bajar, sin arrastrar) y **Datos** (desplegable de refresco). Los cambios se aplican al instante; botón «Restablecer».

**Stats** (`PiStats`): tres renderizadores SVG sin librerías (`bars`, `rings`, `gauges`) sobre los mismos datos (CPU, memoria, disco, temperatura), con `aria-label` con el valor y los mismos estados de carga y sin dato que ahora.

**Persistencia (local + sincronizada):** `usePreferences` lee `localStorage` de forma síncrona antes de pintar (sin parpadeo de tema: `applyTheme` se ejecuta en `main.tsx` antes de React), después hidrata desde `GET /api/state` y guarda con debounce dentro del mismo `PUT /api/state`, que ya lleva `version`. Los guardados son de un solo vuelo (siempre envían el estado más reciente) y solo se guarda lo que el usuario cambió tras hidratar. Ante `409` se recarga el estado: ganan los retos, enlaces y versión del servidor y solo se fusionan las preferencias, con la copia de `updatedAt` más reciente (en empate, la local). Una base vacía o sin `preferences` no debe vaciar retos ni enlaces (corrige el fallo de primera ejecución de `REQ-018`). Nunca bloquea el render; sin API se usa solo el almacenamiento local.

**Refresco:** `usePiMetrics` recibe el intervalo de `piRefreshSeconds`; se mantienen la pausa con la pestaña oculta y el último dato válido.

**Desviaciones de implementación (fase 1):** 12 variables base (`bg, surface, text, textMuted, border, accent, accent2, accentStrong, onAccentStrong, warn, danger, info`) y el resto derivado en CSS con `color-mix()`; `soft` oscurece `textMuted` a `#5f6f65` para cumplir AA; cada tema define el par de colores de su cuadrado (`swatch`), y el del tema `dark` es negro y blanco porque sus acentos son claros; `npm test` usa `node:test` con `--experimental-strip-types` (Node 22.6 o superior).

**Corrección posterior (`REQ-020`):** el servidor sustituía `preferences.updatedAt` por su hora de guardado al leer el estado; ahora conserva el `updatedAt` fijado por el cliente y expone la hora de guardado como `savedAt` (prueba en `tests/api.test.ts`).

**Cambios tras la revisión final:** `updatedAt` en las preferencias; cola de guardado de un solo vuelo (`src/domain/saveQueue.ts`); fusión tras un `409` en una función pura (`mergeAfterConflict`); el grid de Inicio no fija columnas (`pi` ocupa 3 filas y `grid-auto-flow: dense`) para que reordenar no deje huecos.

**Fases (un commit por fase):** (1) tokens CSS, `themes.ts`, Ajustes con temas y vista de stats; (2) tarjetas de Inicio, refresco y sincronización.

## Criterios de aceptación

- [x] `index.css` no contiene colores fijos: todo pasa por variables de tema (`tests/css-tokens.test.ts`).
- [x] Seis temas seleccionables con cuadrados de dos triángulos, navegables con teclado y aplicados sin parpadeo al recargar.
- [x] Cada tema cumple contraste WCAG AA (texto normal ≥ 4.5:1) para texto sobre fondo, texto sobre superficie y texto sobre acento (`tests/themes.test.ts`).
- [x] Desplegable de vista de stats con barras, anillos y medidores, accesibles y sin librerías nuevas.
- [x] Orden y visibilidad de las tarjetas de Inicio configurables; no se puede ocultar todo (siempre queda al menos una).
- [x] Refresco de 30, 60 o 120 s aplicado a `usePiMetrics`.
- [x] Las preferencias se leen de la API y se sincronizan entre dispositivos; sin API funcionan en local.
- [x] Una base vacía o sin `preferences` no vacía retos ni enlaces.
- [x] Valores desconocidos en `preferences` recurren a los valores por defecto sin romper la app (`tests/preferences.test.ts`).

## Verificación

| Check | Resultado |
|---|---|
| `npm test` (`node:test`) | OK: 36 pruebas (temas y contraste AA de los seis temas, preferencias y `newerPreferences`, estadísticas, CSS sin colores fijos, cola de guardado, fusión tras conflicto) |
| `npm run lint` / `npm run build` / `tsc -b` | OK |
| Chrome, fase 1 (datos de ejemplo) | OK: engranaje abre Ajustes; los seis temas cambian al instante y se guardan; flechas del teclado recorren los temas con vuelta al principio; barras, anillos y medidores se ven en `ocean` y `dark`; la vista elegida sobrevive a la recarga; «Restablecer» vuelve a los valores por defecto; sin errores de consola |
| Ancho de móvil | No verificado visualmente (el redimensionado de ventana no cambió el viewport) |

| Chrome, fase 2 (API local con base nueva y proxy de Docker simulado) | OK: ocultar y reordenar tarjetas persiste tras recargar y la última visible no se puede ocultar; con 30 s las peticiones a `/api/pi/metrics` salen a los ~30 y ~60 s y con 120 s no sale ninguna en 40 s; base vacía (`version: 0`) conserva los retos y enlaces de ejemplo y los guarda (3 y 3); el tema se recupera de la API tras borrar `localStorage`; con dos pestañas desfasadas ambos `PUT` devuelven `409` y luego `200` (gana el último cambio) y el pie sigue en «Sincronizado»; con la API parada el tema se aplica y se guarda en local y el pie muestra `OFFLINE` |
| Revisión final (revisor independiente) | 1 crítico y 3 importantes, corregidos con TDD: el reintento tras `409` podía pisar retos y enlaces reales con datos de ejemplo o de caché; un guardado antiguo en vuelo podía sobrescribir uno nuevo; las preferencias remotas pisaban las locales más recientes; reordenar tarjetas dejaba huecos en el grid. Comprobado en Chrome: cargar no modifica el servidor (versión 1 antes y después); con una pestaña desfasada y otro dispositivo que añade un reto, el cambio de tema da `409` y luego `200`, el servidor conserva ambos retos y el tema nuevo, y la pestaña adopta el reto ajeno; con la Raspberry ocultada o movida el grid no deja huecos. Ocho menores aplazados (ver abajo) |
| Producción (Vercel) | Ver el comentario de cierre de la issue #3 |

## Impacto documental

Actualizados: `docs/arquitectura/ui-preferences.md`, `docs/requisitos/functional-requirements.md` (FR de preferencias), `docs/codebase/STRUCTURE.md`, `.agents/context/system-status.md`, `context/STYLE_GUIDE.md` (uso de variables de tema) y `docs/diagramas/screens-flow.svg` (vista de Ajustes).

## Pendientes

- [x] Implementadas las dos fases (ver Decisión).
- [ ] Modo claro/oscuro automático según el sistema → backlog.
- [ ] Saludo y cita editables → backlog.
- [x] Tests de preferencias (`tests/preferences.test.ts`, `themes`, `css-tokens`, `saveQueue`, `persistedState`).
- [ ] Menores aplazados tras la revisión: guardado pendiente al cerrar la pestaña (flush en `pagehide`); cancelación de la hidratación en StrictMode; validar la forma de `goals` y `links` en `shouldAdoptRemote`; `aria-labelledby` y teclas Inicio/Fin en el selector de temas; foco del teclado al llegar al extremo en el editor de tarjetas; el anillo y el medidor dibujan un punto con valor 0; contraste no textual del interruptor oscuro y del trazo `accent-2`; cabecera de `ui-preferences.md` obsoleta.
