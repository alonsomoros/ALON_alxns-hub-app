# Refactor de arquitectura del archivo principal

- **Estado:** Hecho
- **REQ:** REQ-016
- **Tipo:** refactor
- **Área:** `src/`
- **GitHub:** [#16](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/16)
- **Actualizada:** 2026-11-11

## Problema

`src/App.tsx` agrupaba datos de ejemplo, fetch de citas, navegación, enlaces, retos, formularios y render de vistas, lo que dificultaba mantenimiento, pruebas y evolución.

## Decisión

Refactor sin cambio de comportamiento:

| Ruta | Responsabilidad |
|---|---|
| `src/App.tsx` | Alterna splash y dashboard. |
| `src/components/Dashboard.tsx` | Orquesta navegación, estado de alto nivel y handlers. |
| `src/components/{home,goals,links}/` | Vistas y widgets por feature. |
| `src/components/layout/`, `src/components/ui/` | Splash, cabecera, pie y piezas reutilizables. |
| `src/types/dashboard.ts` | Modelos de datos. |
| `src/data/dashboardData.ts` | Datos de prototipo y configuración (`REQ-014`). |
| `src/domain/{goals,links}.ts` | Lógica pura: progreso, validación, snapshots, reordenación y alta. |
| `src/hooks/{useQuote,usePersistedDashboard}.ts` | Efectos de red y persistencia. |
| `src/utils/brandLogo.ts` | Resolución de logo (`REQ-015`). |

## Criterios de aceptación

- [x] `App.tsx` solo compone y alterna splash/dashboard.
- [x] La lógica de cada vista vive en su módulo.
- [x] Datos y UI separados.

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` | OK, 0 avisos |
| Typecheck | OK con `tsc` 5.9.3; el build con `tsc` 7 estaba [BLOQUEADO] por una dependencia opcional de Windows. Resuelto al fijar `typescript ~5.9.3` |
| Visual (Chrome) | Inicio, Retos, Enlaces y modal idénticos; a 390 px sin overflow |
| Tests de caja negra | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Actualizado: `docs/codebase/{STRUCTURE,ARCHITECTURE,CONVENTIONS,CONCERNS,INTEGRATIONS}.md`, backlog e índice. Sin cambio: requisitos funcionales y diagramas, porque el comportamiento no cambia.

## Pendientes

- [x] Estado vacío en la tarjeta Accesos («Aún no tienes accesos», botón «Añadir accesos») y en la vista Enlaces («Añadir tu primer enlace»); comprobado en Chrome (2026-11-11).
- [ ] La tarjeta Raspberry se estira en escritorio dejando espacio en blanco → backlog.
- [ ] Tests de `src/domain/` con `REQ-016` → `REQ-020`.
