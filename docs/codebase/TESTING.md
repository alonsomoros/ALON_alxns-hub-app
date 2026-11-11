# Testing

## Test stack and commands

- Framework de tests: no configurado. Propuesta de runner en `Issues/020-runner-de-tests.md` (`REQ-020`).
- Lint: Oxlint con `npm run lint`.
- Validacion de tipos/build: `npm run build` (`tsc -b && vite build`).
- CI: GitHub Actions ejecuta `npm ci`, lint y build.

```bash
npm run lint
npm run build
```

Checks adicionales segun el cambio: `node --check server/index.js` y `docker compose -f docs/ci-cd/docker-compose.yml config` para la API; validar como XML los SVG de `docs/diagramas/`.

No existen comandos de unit, integration, e2e o coverage en `package.json`.

## Test layout

No hay archivos de test ni setup detectados. Primeros objetivos (`REQ-020`): `src/domain/{goals,links}.ts`, `src/utils/{brandLogo,date}.ts` y el contrato de `server/index.js`; despues navegacion, fallback de cita y PWA movil. Mientras no exista runner, cada nota registra `Omitido: no existe runner` y una comprobacion manual reproducible.

## Scope matrix

| Scope | Covered? | Target | Notes |
|---|---|---|---|
| Unit | No | modelos y handlers de UI | `[TODO]` |
| Integration | No | integraciones HTTPS futuras | `[TODO]` |
| E2E | No | Inicio, Retos, Enlaces y PWA | backlog pendiente |

## Mocking and isolation

No hay estrategia de mocks porque no hay runner configurado. La cita depende de red real en runtime y usa fallback local.

## Coverage and quality

No hay herramienta ni umbral de coverage. La señal actual es lint/build local y CI.

## Evidence

- `package.json`
- `.github/workflows/ci.yml`
- `docs/requisitos/backlog-features.md`
