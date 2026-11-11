# Refactor de arquitectura del archivo principal

## Problema

`src/App.tsx` agrupa demasiadas responsabilidades: datos de ejemplo, fetch de citas, navegación, lógica de enlaces, retos, formularios y render de vistas. El archivo crece demasiado y dificulta mantenimiento, pruebas y evolución.

## Solución propuesta

Separar por dominio para mantener cada capa con una responsabilidad clara:

- `components/` para vistas y widgets,
- `data/` para mock data y config,
- `types/` para modelos,
- `utils/` para resolvers y helpers,
- `App.tsx` solo como orquestador de la UI.

## Criterios de aceptación

- `App.tsx` queda reducido a composición y estado de alto nivel.
- La lógica de cada vista vive en su módulo.
- La resolución de datos y la UI quedan separadas.
- Será más sencillo añadir pruebas y refactors futuros.

## Estado

Implementado (2026-11-11). Requisito: `REQ-016`. Issue de GitHub: [BLOQUEADO] `gh` no está instalado en el entorno; trazabilidad local en esta nota.

## Decisión adoptada

Refactor sin cambio de comportamiento. Estructura resultante:

| Ruta | Responsabilidad |
|---|---|
| `src/App.tsx` | Alterna splash y dashboard. |
| `src/components/Dashboard.tsx` | Orquesta navegación, estado de alto nivel y handlers. |
| `src/components/{home,goals,links}/` | Vistas y widgets por feature. |
| `src/components/layout/`, `src/components/ui/` | Splash, cabecera, pie y piezas reutilizables (`BrandLogo`, `CardTitle`, `Metric`, `ProgressBar`, `BackButton`). |
| `src/types/dashboard.ts` | Modelos de datos. |
| `src/data/dashboardData.ts` | Datos de prototipo y configuración (enlaza con Issue 014). |
| `src/domain/goals.ts`, `src/domain/links.ts` | Lógica pura: progreso, validación, upsert con snapshot, reordenación y alta de enlaces. |
| `src/hooks/useQuote.ts`, `src/hooks/usePersistedDashboard.ts` | Efectos de red y persistencia (`REQ-018`) fuera de las vistas. |
| `src/utils/brandLogo.ts` | Resolución de logo (Issue 015). |

## Validación

- `npm run lint`: OK, 0 avisos.
- `npm run build`: [BLOQUEADO] `tsc.exe` falta en `node_modules/.pnpm/@typescript+typescript-win32-x64@7.0.2` (dependencia opcional no instalada). Sustituto: `npx -p typescript@5.9.3 tsc -p tsconfig.app.json --noEmit` OK y `npx vite build` OK.
- Visual (Chrome, dev server): Inicio, Retos, Enlaces y modal de reto idénticos antes/después en escritorio; a 390 px sin overflow horizontal y tarjetas apiladas; sin errores de consola.
- Tests de caja negra: Omitido: no existe runner.

## Impacto documental

- Actualizado: `docs/codebase/{STRUCTURE,ARCHITECTURE,CONVENTIONS,CONCERNS,INTEGRATIONS}.md`, `docs/requisitos/backlog-features.md`, `Issues/README.md`.
- Sin cambio: requisitos funcionales y diagramas, porque el comportamiento y el flujo de pantallas/datos no cambian.

## Pendiente

- Observaciones de la revisión visual, fuera del alcance del refactor: la tarjeta Accesos y la vista Enlaces no muestran estado vacío cuando no hay enlaces; la tarjeta Raspberry se estira en escritorio dejando ~225 px en blanco; la fecha sigue fija (Issue 017).
- Añadir runner de tests para cubrir `src/domain/` con nombres `REQ-016`.
