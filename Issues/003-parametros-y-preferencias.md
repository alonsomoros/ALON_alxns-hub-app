# Parámetros y preferencias

- **Estado:** En curso (especificación aprobada; implementación pendiente)
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

**Persistencia (local + sincronizada):** `usePreferences` lee `localStorage` de forma síncrona antes de pintar (sin parpadeo de tema: `applyTheme` se ejecuta en `main.tsx` antes de React), después hidrata desde `GET /api/state` y guarda con debounce dentro del mismo `PUT /api/state`, que ya lleva `version`. Ante `409` se recarga el estado y se reaplican las preferencias locales (gana el último cambio). Una base vacía o sin `preferences` no debe vaciar retos ni enlaces (corrige el fallo de primera ejecución de `REQ-018`). Nunca bloquea el render; sin API se usa solo el almacenamiento local.

**Refresco:** `usePiMetrics` recibe el intervalo de `piRefreshSeconds`; se mantienen la pausa con la pestaña oculta y el último dato válido.

**Fases (un commit por fase):** (1) tokens CSS, `themes.ts`, Ajustes con temas y vista de stats; (2) tarjetas de Inicio, refresco y sincronización.

## Criterios de aceptación

- [ ] `index.css` no contiene colores fijos: todo pasa por variables de tema.
- [ ] Seis temas seleccionables con cuadrados de dos triángulos, navegables con teclado y aplicados sin parpadeo al recargar.
- [ ] Cada tema cumple contraste WCAG AA (texto normal ≥ 4.5:1) para texto sobre fondo, texto sobre superficie y texto sobre acento.
- [ ] Desplegable de vista de stats con barras, anillos y medidores, accesibles y sin librerías nuevas.
- [ ] Orden y visibilidad de las tarjetas de Inicio configurables; no se puede ocultar todo (siempre queda al menos una).
- [ ] Refresco de 30, 60 o 120 s aplicado a `usePiMetrics`.
- [ ] Las preferencias se leen de la API y se sincronizan entre dispositivos; sin API funcionan en local.
- [ ] Una base vacía o sin `preferences` no vacía retos ni enlaces.
- [ ] Valores desconocidos en `preferences` recurren a los valores por defecto sin romper la app.

## Verificación

Plan: `npm run lint` y `npm run build`; script de contraste WCAG por tema; Chrome (PC y móvil) con cada tema y cada vista de stats, recarga sin parpadeo y sincronización entre dos dispositivos. Tests automáticos de `parsePreferences` y `applyTheme`: Omitido mientras no exista runner (`REQ-020`).

## Impacto documental

A actualizar al implementar: `docs/arquitectura/ui-preferences.md`, `docs/requisitos/functional-requirements.md` (FR de preferencias), `docs/codebase/STRUCTURE.md`, `.agents/context/system-status.md`, `context/STYLE_GUIDE.md` (uso de variables de tema) y `docs/diagramas/screens-flow.svg` (vista de Ajustes).

## Pendientes

- [ ] Implementar la fase 1 y la fase 2 (ver Decisión).
- [ ] Modo claro/oscuro automático según el sistema → backlog.
- [ ] Saludo y cita editables → backlog.
- [ ] Tests de preferencias → `REQ-020`.
