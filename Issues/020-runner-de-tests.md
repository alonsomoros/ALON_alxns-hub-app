# Runner de tests para dominio y API

- **Estado:** Propuesta
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

Añadir una dependencia requiere aprobación (`CODE_STANDARD.md`): esta nota queda en `Propuesta` hasta que el desarrollador elija.

## Criterios de aceptación

- [ ] `npm test` existe y pasa en local y en CI. Avance (`REQ-003`): `npm test` ya existe con `node:test` y `--experimental-strip-types` y cubre los módulos puros de preferencias y temas; faltan los tests de `REQ-008`, `REQ-015` a `REQ-018` y el CI.
- [ ] Tests con `REQ-008`, `REQ-015`, `REQ-016`, `REQ-017` y `REQ-018` en el nombre.
- [ ] `docs/codebase/TESTING.md` y `CODE_STANDARD.md` actualizados; el checklist de `WORKFLOW.md` §4 incluye `npm test`.
- [ ] Validación XML de los SVG automatizada (`REQ-006`).

## Verificación

No aplica: sin implementación.

## Impacto documental (al implementar)

`docs/codebase/TESTING.md`, `CODE_STANDARD.md`, `WORKFLOW.md` §4, `.github/workflows/ci.yml`.

## Pendientes

- [ ] Aprobación del runner por el desarrollador.
