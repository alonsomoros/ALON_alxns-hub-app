# Runner de tests para dominio y API

- **Estado:** Hecho
- **REQ:** REQ-020
- **Tipo:** chore
- **Área:** `package.json`, `.github/workflows/ci.yml`, `src/domain/`, `server/`
- **GitHub:** [#20](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/20)
- **Actualizada:** 2026-11-11

## Problema

Todas las notas cierran con `Omitido: no existe runner`. El gate "cada cambio de comportamiento declara su test" no se puede cumplir y la entrega autónoma solo se apoya en lint, typecheck y build, que no detectan regresiones de comportamiento.

## Propuesta

Añadir un runner con el menor coste de dependencias y ejecutarlo en `npm test` y en CI:

| Opción | Pros | Contras |
|---|---|---|
| **Vitest (recomendada)** | Integra con Vite, soporta TS y jsdom para hooks y componentes | Una devDependency nueva |
| `node:test` | Sin dependencias; encaja con el servidor `node:sqlite` | No cubre cómodamente componentes React |

Alcance inicial: lógica pura de `src/domain/{goals,links}.ts`, `src/utils/{brandLogo,date}.ts` y contrato de `server/index.js` (lectura, escritura, `409`). Los nombres de test incluyen `REQ-XXX`.

**Decisión (2026-11-11):** `node:test` con `--experimental-strip-types`, sin dependencias nuevas (el desarrollador aprobó la base de tests). Vitest con jsdom queda como candidato para probar componentes y hooks de React cuando haga falta.

## Criterios de aceptación

- [x] `npm test` existe y pasa en local; el paso `Test` está añadido a `.github/workflows/ci.yml` (el CI no arranca por la facturación, así que su ejecución sigue siendo local).
- [x] Tests con `REQ-NNN` en el nombre: `REQ-003`, `REQ-006`, `REQ-008`, `REQ-009`, `REQ-011`, `REQ-015`, `REQ-017`, `REQ-018` y `REQ-021` (`REQ-016` es una reorganización sin comportamiento propio; sus módulos los cubren los tests de dominio).
- [x] `docs/codebase/TESTING.md`, `CODE_STANDARD.md`, `WORKFLOW.md` y la plantilla de notas actualizados; el checklist incluye `npm test`.
- [x] Validación XML de los SVG automatizada (`tests/svg.test.ts`).

## Verificación

| Check | Resultado |
|---|---|
| `npm test` | OK: 89 pruebas (dominio, API real con dobles, preferencias, cita, fecha, SVG) |
| Mutación deliberada (quitar el límite 0-100 de `goalProgress` y la comprobación de igualdad de `reorderLinks`) | OK: 2 tests fallan y pasan al restaurar |
| `npm run lint` / `npm run build` | OK |

Hallazgo durante la implementación: `tests/api.test.ts` detectó que el servidor sustituía `preferences.updatedAt` (el instante del cambio fijado por el cliente) por su propia hora de guardado, lo que podía hacer ganar la copia equivocada al sincronizar entre dispositivos (`REQ-003`). Corregido: el servidor conserva el `updatedAt` del cliente y expone su hora de guardado como `savedAt`. Requiere redesplegar la API.

## Impacto documental

Actualizados: `docs/codebase/{TESTING,CONCERNS}.md`, `CODE_STANDARD.md`, `WORKFLOW.md`, `Issues/_TEMPLATE.md`, `.github/workflows/ci.yml`, `docs/requisitos/`, `.agents/context/system-status.md` y las notas que apuntaban a `REQ-020`.

## Pendientes

- [x] Runner aprobado y adoptado (`node:test`).
- [ ] Tests de componentes React y hooks (Vitest con jsdom) y E2E de la PWA en móvil → backlog.
- [ ] Probar el timeout de 1 s por fuente de `server/metrics.js` → backlog.
