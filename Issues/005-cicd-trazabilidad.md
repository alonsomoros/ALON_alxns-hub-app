# CI/CD, GitHub y trazabilidad

- **Estado:** Hecho (proceso actualizado en `REQ-019`)
- **REQ:** REQ-005
- **Tipo:** ci
- **Área:** `.github/`, `.agents/skills/cicd-github-delivery.md`
- **GitHub:** [#5](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/5)
- **Actualizada:** 2026-11-11

## Problema

No había un flujo explícito desde la petición hasta commit, CI, push y cierre verificable.

## Decisión

Workflow `.github/workflows/ci.yml` (`npm ci`, `npm run lint`, `npm run build` en Node 22 para push y PR a `main`), plantilla `.github/ISSUE_TEMPLATE/feature.yml` y skill de entrega. El proceso completo vive en `WORKFLOW.md`; la skill es solo una checklist.

## Criterios de aceptación

- [x] CI ejecuta install, lint y build.
- [x] Plantilla de issue con problema, decisión, requisitos, tests y trazabilidad.
- [x] Commits Conventional con `REQ-XXX`.
- [ ] CI en verde: [BLOQUEADO] los jobs no arrancan por un problema de facturación de la cuenta de GitHub; el desarrollador decidió no configurarla, así que la verificación es local.

## Verificación

CI definido en `main`. Última ejecución correcta: `feat(persistence)` (2026-11-01). Las cuatro siguientes terminan en 2-4 s con la anotación "account is locked due to a billing issue". Se consulta con `gh run list` y `gh run view <id>`.

## Impacto documental

`WORKFLOW.md`, `docs/ci-cd/`.

## Pendientes

- [ ] [BLOQUEADO] CI: no se intenta mientras la facturación esté sin configurar (decisión del desarrollador).
