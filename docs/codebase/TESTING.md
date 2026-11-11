# Testing

## Test stack and commands

- Runner: `node:test` de Node (sin dependencias), con `--experimental-strip-types` para importar TypeScript (`REQ-020`). Requiere Node 22.6 o superior.
- Tests: `npm test` (`node --experimental-strip-types --test "tests/**/*.test.ts"`).
- Lint: Oxlint con `npm run lint`.
- Validación de tipos y build: `npm run build` (`tsc -b && vite build`).
- CI: GitHub Actions ejecuta `npm ci`, lint, tests y build (hoy no arranca por la facturación de la cuenta; la verificación es local).

```bash
npm run lint
npm test
npm run build
```

Checks adicionales según el cambio: `node --check server/index.js` y `docker compose -f docs/ci-cd/docker-compose.yml config` para la API.

## Test layout

Los tests viven en `tests/` (fuera de `src/` y del `tsconfig`) y el nombre de cada test lleva su `REQ-NNN`.

| Archivo | Cubre |
|---|---|
| `tests/goals.test.ts`, `tests/links.test.ts` | Dominio de retos y enlaces y resolución de logos (`REQ-008`, `REQ-009`, `REQ-015`) |
| `tests/api.test.ts` | Contrato de la API real (arranca `server/index.js` en un puerto libre con una base temporal): estado, versión y `409`, validación, CORS, métricas con un Prometheus simulado y cita (`REQ-018`, `REQ-011`, `REQ-021`) |
| `tests/preferences.test.ts`, `themes.test.ts`, `persistedState.test.ts`, `saveQueue.test.ts`, `piStats.test.ts`, `css-tokens.test.ts` | Preferencias, temas y contraste AA, fusión tras conflicto, cola de guardado, estadísticas y CSS sin colores fijos (`REQ-003`) |
| `tests/quote.test.ts`, `tests/quote-server.test.ts` | Cita del día: validación, caché y respaldo (`REQ-021`) |
| `tests/date.test.ts` | Fecha de Inicio y cambio de día (`REQ-017`) |
| `tests/svg.test.ts` | Los SVG de `docs/diagramas/` son XML bien formado (`REQ-006`) |

Reglas para que un módulo sea probable con este runner: importa sus dependencias con extensión `.ts`, no usa `import.meta.env` ni el DOM en el nivel superior y recibe por parámetro lo que toque la red o el reloj.

## Scope matrix

| Scope | Covered? | Target | Notes |
|---|---|---|---|
| Unit | Sí | `src/domain/`, `src/utils/date.ts`, `src/themes.ts`, `server/quote.js` | `node:test` |
| Integration | Sí | `server/index.js` con dobles de Prometheus y del origen de la cita | procesos reales, base temporal |
| Componentes React y hooks | No | vistas y hooks | se comprueban a mano en Chrome; candidato a Vitest con jsdom |
| E2E | No | Inicio, Retos, Enlaces y PWA en móvil | backlog |

## Mocking and isolation

Sin librerías de mocks: las funciones reciben `fetch`, el reloj y el almacenamiento por parámetro, y la API se prueba como proceso real contra servidores HTTP de mentira. La cita y las métricas nunca dependen de la red real en los tests.

## Coverage and quality

No hay herramienta ni umbral de coverage. Señal actual: lint, `npm test` y build, y comprobación en Chrome de lo visual.

## Evidence

- `package.json`
- `tests/`
- `.github/workflows/ci.yml`
