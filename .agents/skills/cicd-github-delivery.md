# Skill: entrega trazable

Checklist operativa. El proceso, el formato de commit, el informe de verificación y las reglas de Git son de [`WORKFLOW.md`](../../WORKFLOW.md); aquí no se duplican.

## Checklist

1. Preflight y lectura escalonada (`WORKFLOW.md` §1) y `git status --short --branch`.
2. Localizar o crear `Issues/NNN-slug.md` con `Issues/_TEMPLATE.md` en estado `En curso`, con criterios de aceptación verificables; crear su issue con `gh issue create`, anotar el número y añadirla al índice (`WORKFLOW.md` §2).
3. Implementar el cambio mínimo y declarar el test o el motivo de omisión (`WORKFLOW.md` §4).
4. Validar: `npm run lint`, `npm run build` y los checks específicos (`WORKFLOW.md` §5). Si falla, corregir y repetir; nunca commitear en rojo.
5. Actualizar los dueños de la matriz de impacto (`WORKFLOW.md` §3), marcar los criterios y el estado de la nota, y actualizar el índice y el backlog.
6. Revisar `git diff --stat`; añadir los archivos por nombre.
7. Commit con el formato de `WORKFLOW.md` §6 y push a `main` sin force.
8. Comprobar el push, cerrar la issue (`gh issue close N --reason completed`) y entregar el informe de verificación en el chat. La CI no se espera mientras la facturación siga bloqueada.

## Seguridad

- Nunca guardar tokens, credenciales ni secretos en el repositorio.
- Nunca hacer push forzado ni reescribir historial.
- Conservar los cambios ajenos ya presentes en la rama y mencionarlos en el informe.

## Definition of Done

La definida en `WORKFLOW.md` §7.
