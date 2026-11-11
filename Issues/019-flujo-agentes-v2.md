# Rediseño del flujo agéntico

- **Estado:** Hecho
- **REQ:** REQ-019
- **Tipo:** docs
- **Área:** `AGENTS.md`, `WORKFLOW.md`, `Issues/`, `docs/`, `.agents/`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

El flujo no permitía entregar una tarea de principio a fin sin fricción:

- La lista de lectura obligatoria estaba duplicada en `AGENTS.md`, `WORKFLOW.md`, `cicd-github-delivery.md` y `diagrams.md`, y obligaba a leer 9 archivos aunque la tarea fuese pequeña.
- `WORKFLOW.md` citaba una "sección 4.4 de AGENTS.md" que no existe.
- No había relación entre `REQ-XXX` (notas, backlog) y `FR-xx` (requisitos funcionales), ni un registro único de REQ.
- Las 18 notas tenían formatos distintos, sin estado ni criterios comprobables; varias seguían en "propuesta" o "en implementación" estando hechas.
- `docs/codebase/`, `system-architecture.md` y los diagramas decían que no había persistencia ni backend, y `.gitignore` ignoraba `src/data/`.
- Un agente sin `gh` no podía cumplir "crear issue de GitHub" y el cierre dependía siempre de una confirmación manual.
- No existía una plantilla de informe de verificación para entregar en el chat.

## Decisión

- **Lectura escalonada** con dueño único (`WORKFLOW.md` §1): núcleo corto siempre; el resto según el área.
- **`REQ-NNN` = `Issues/NNN-slug.md`**; el índice de `Issues/README.md` es el registro único. Los `FR-xx` enlazan a su `REQ`.
- **Nota local como fuente de verdad** mientras `gh` no esté disponible; plantilla `Issues/_TEMPLATE.md`, estados cerrados y pendientes con destino.
- **Entrega autónoma:** con validación verde el agente hace commit y push a `main` sin force y entrega un informe de verificación en el chat (`WORKFLOW.md` §4). Pregunta antes solo si hay ambigüedad, decisión de arquitectura o acción destructiva.
- Skills de entrega, diagramas y revisión pasan a ser checklists que enlazan a `WORKFLOW.md`.
- Documentación `docs/codebase/`, arquitectura y diagramas sincronizada con el código.

## Criterios de aceptación

- [x] Una sola lista de lectura y un solo dueño del proceso.
- [x] Todas las notas con cabecera, estado y pendientes con destino; el índice coincide con los estados.
- [x] Plantilla de nota y plantilla de informe de verificación.
- [x] Regla explícita de commit y push autónomos tras validación verde.
- [x] `docs/codebase/`, `system-architecture.md`, `system-status.md` y diagramas reflejan la persistencia.
- [x] Backlog y requisitos enlazan REQ ↔ FR.

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run build` | OK |
| SVG como XML válido | OK |
| Enlaces relativos de `Issues/`, `docs/` y `.agents/` existentes | OK |
| Tests de caja negra | Omitido: cambio solo documental |

## Impacto documental

Actualizados: `AGENTS.md`, `WORKFLOW.md`, `CODE_STANDARD.md`, `context/INDEX.md`, `Issues/` (todas las notas, `README.md`, `_TEMPLATE.md`), `docs/requisitos/`, `docs/arquitectura/system-architecture.md`, `docs/codebase/`, `docs/diagramas/`, `.agents/context/system-status.md`, `.agents/skills/{cicd-github-delivery,code-review,diagrams}.md`. Sin cambio: `ui-preferences.md`, `deploy-persistencia-raspberry.md`, `persistencia-personal.md`, porque ya eran correctos.

## Pendientes

- [ ] [BLOQUEADO] Resolver la facturación de GitHub para que la CI arranque → `REQ-005`.
- [ ] [BLOQUEADO] Cambiar el remoto `origin` a `https://github.com/alonsomoros/ALON_alxns-hub-app.git` (el repositorio se renombró; el nombre antiguo redirige).
- [ ] Runner de tests → `REQ-020`.
- [ ] Decidir si se elimina `pnpm-lock.yaml`: CI usa `npm ci` y `package-lock.json`.
