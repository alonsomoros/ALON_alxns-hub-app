# CI/CD, GitHub y trazabilidad

- **Estado:** Hecho (proceso actualizado en `REQ-019`)
- **REQ:** REQ-005
- **Tipo:** ci
- **Área:** `.github/`, `.agents/skills/cicd-github-delivery.md`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

No había un flujo explícito desde la petición hasta commit, CI, push y cierre verificable.

## Decisión

Workflow `.github/workflows/ci.yml` (`npm ci`, `npm run lint`, `npm run build` en Node 22 para push y PR a `main`), plantilla `.github/ISSUE_TEMPLATE/feature.yml` y skill de entrega. El proceso completo vive en `WORKFLOW.md`; la skill es solo una checklist.

## Criterios de aceptación

- [x] CI ejecuta install, lint y build.
- [x] Plantilla de issue con problema, decisión, requisitos, tests y trazabilidad.
- [x] Commits Conventional con `REQ-XXX`.
- [ ] Issues reales en GitHub: [BLOQUEADO] `gh` está instalado pero sin autenticar (`gh auth login`).

## Verificación

CI definido y activo en `main`. El estado de la última ejecución se consulta en la pestaña Actions del repositorio; sin `gh` el agente no puede leerlo desde el terminal.

## Impacto documental

`WORKFLOW.md`, `docs/ci-cd/`.

## Pendientes

- [ ] [BLOQUEADO] Ejecutar `gh auth login` para crear issues y leer el estado de CI.
