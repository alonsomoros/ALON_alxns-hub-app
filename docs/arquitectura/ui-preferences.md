# Preferencias de interfaz

Este documento es la fuente de verdad para la iteración de configuración. No se implementa todavía como pantalla pública, pero los componentes deben aceptar estas opciones sin reescrituras.

```ts
type ThemeId = 'soft' | 'ocean' | 'sunset' | 'lavender' | 'graphite' | 'dark';
type StatsView = 'bars' | 'rings' | 'gauges';
type HomeCardId = 'pi' | 'goals' | 'services' | 'links';

interface UiPreferences {
  schemaVersion: 1;
  theme: ThemeId;                  // por defecto 'soft'
  statsView: StatsView;            // por defecto 'bars'
  piRefreshSeconds: 30 | 60 | 120; // por defecto 60
  homeCards: { id: HomeCardId; visible: boolean }[]; // el orden del array es el de pantalla
  displayName: string;             // nombre del saludo de Inicio (máx. 40; vacío = «Hola.»; por defecto «Alonso»)
  updatedAt: string;               // ISO del último cambio del usuario; gana la copia más reciente al sincronizar (la API lo conserva y añade `savedAt` con su hora de guardado)
}
```

> Contrato aprobado en [`REQ-003`](../../Issues/003-parametros-y-preferencias.md); implementado. Sustituye al modelo anterior (`mode`, `orderServices`, `raspberryPiStatsShowcase: 'graph' | 'pbar'`). `quote` se mantiene aparte.

## Decisiones iniciales

- Valores por defecto: `theme: 'soft'`, `statsView: 'bars'`, `piRefreshSeconds: 60` y las cuatro tarjetas visibles en el orden actual; la cita sigue siendo `random`.
- `orderServices` debe aceptar ids estables y permitir reordenación sin acoplarse al nombre visible.
- La cita usa `{ content, author }`, timeout y fallback local.
- Ajustes es una vista a la que se entra con un icono de engranaje en la cabecera; no es una pestaña de la navegación principal y no pesa en la primera impresión.
- Persistencia: `localStorage` síncrono antes de pintar, hidratación desde `GET /api/state` y guardado con debounce dentro de `PUT /api/state` (guardados de un solo vuelo y solo de lo que el usuario cambió tras hidratar; ante `409` ganan los retos, enlaces y versión del servidor y solo se fusionan las preferencias, con la copia de `updatedAt` más reciente). Nunca bloquea el render.
- Los temas son datos en `src/themes.ts` que se aplican como variables CSS en `<html>`; `index.css` no debe contener colores fijos.
- Las vistas de retos y enlaces deben usar componentes reutilizables, estados vacíos, navegación por teclado y layout responsive.

## Orden de servicios

La preferencia prevista puede representar secuencias como `pihole`, `servicios`, `health`, `links`, o cualquier combinación de módulos registrados. La vista no debe asumir que siempre existen tres servicios.
