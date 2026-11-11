# Workflow de trabajo

Dueño del proceso, la trazabilidad, la validación y las reglas de Git. Se lee completo junto con `AGENTS.md` al inicio de cada tarea. Objetivo: que una tarea se pueda entregar de principio a fin (código, documentación, verificación, commit y push) sin intervención, y que el resultado sea comprobable desde el chat.

## 1. Preflight (lectura escalonada)

Única lista de lectura del repositorio.

**Siempre** (núcleo, en este orden):

1. `AGENTS.md` y este archivo.
2. `.agents/context/system-status.md`: estado técnico actual.
3. `Issues/README.md`: índice, reglas y siguiente número libre.

**Según el área afectada** (leer solo lo que aplique):

| Si la tarea toca… | Leer además |
|---|---|
| Código o tests | `CODE_STANDARD.md`, `docs/codebase/{STRUCTURE,CONVENTIONS,TESTING}.md` |
| UI, estilos o navegación | `context/VISION.md`, `.agents/skills/futuristic-ui-tailwind.md`, `docs/requisitos/functional-requirements.md` |
| Retos | `.agents/skills/habit-tracker-logic.md` |
| Persistencia o API | `docs/arquitectura/persistencia-personal.md`, `deploy-persistencia-raspberry.md` |
| Integraciones (n8n, Grafana, citas) | `docs/arquitectura/integrations-n8n-grafana.md`, `.agents/skills/n8n-api-connectors.md`, `.agents/context/environment-vars.md` |
| PWA | `.agents/skills/pwa-optimization.md` |
| Diagramas | `.agents/skills/diagrams.md`, `docs/diagramas/README.md` |
| CI, despliegue o tooling | `.agents/skills/cicd-github-delivery.md`, `docs/ci-cd/` |
| Documentación o convenciones de texto | `context/STYLE_GUIDE.md`, `context/INDEX.md` |
| Una nota existente | La nota `Issues/NNN-*.md` y las que enlaza |

Después:

- Comprobar `git status --short --branch`. Nunca ocultar, revertir ni mezclar cambios ajenos.
- Clasificar la petición: `feat`, `fix`, `docs`, `architecture`, `ci`, `chore` o `refactor`.

## 2. Trazabilidad

- **`REQ-NNN` = `Issues/NNN-slug.md`.** El número es el siguiente libre de `Issues/README.md`. Una tarea que continúa trabajo existente reutiliza su nota (si está `Hecho` y cambia el comportamiento, nota nueva que referencia la anterior).
- **Nota local como fuente de verdad, issue de GitHub como reflejo.** `gh` está instalado y autenticado (cuenta `alonsomoros`, ámbitos `repo` y `workflow`), pero puede no estar en el `PATH` de la sesión del agente: usar `C:\Program Files\GitHub CLI\gh.exe` si `gh` no se reconoce. Al crear la nota se crea su issue (`gh issue create --title "REQ-NNN: <título>" --body-file <archivo>`, con enlace a la nota en el cuerpo) y se anota su número en el campo `GitHub`. Si existiera una issue real, su número va en el campo `GitHub` de la nota y los commits usan `Refs #N`.
- Crear la nota con `Issues/_TEMPLATE.md` en estado `En curso` **antes de editar código**, con problema, decisión y criterios de aceptación verificables, y añadirla al índice.
- Antes de editar, el agente debe poder responder: qué problema se cambia, qué no, qué criterio lo da por bueno y qué check puede falsar la hipótesis.
- Cambios triviales (typo, enlace roto, comentario) no necesitan nota nueva: se anotan en la nota dueña del área o se entregan como `docs`/`chore` con `Sin cambio: sin trazabilidad funcional`.
- Los requisitos funcionales (`FR-xx`) viven en `docs/requisitos/functional-requirements.md` y referencian su `REQ`; el backlog (`docs/requisitos/backlog-features.md`) lista lo pendiente.

## 3. Matriz de impacto documental

| Cambio | DEBE actualizar | Puede requerir |
|---|---|---|
| UI, navegación o comportamiento | nota `Issues/`, `functional-requirements.md`, tests | `docs/diagramas/screens-flow.svg`, `docs/codebase/STRUCTURE.md` |
| Estado, datos o persistencia | nota, requisito, tests, `.agents/context/system-status.md` | `docs/arquitectura/persistencia-personal.md`, `data-flow.svg` |
| Endpoint, integración o configuración | arquitectura, `docs/codebase/INTEGRATIONS.md`, skill afectada, `.env.example`/`environment-vars.md`, tests | `architecture.svg`, `data-flow.svg` |
| Estructura o decisión transversal | `AGENTS.md` (mapa), `docs/codebase/`, nota | ADR solo si lo aprueba el desarrollador |
| CI/CD, GitHub o tooling | este archivo, skill/CI, nota | `delivery-flow.svg`, `docs/ci-cd/` |
| Solo texto o corrección documental | documento dueño | no crear requisito ficticio |

Siempre al cerrar: marcar el estado de la nota y del índice de `Issues/README.md`, y mover o tachar el pendiente del backlog. Si un artefacto no cambia, la nota dice `Sin cambio: motivo`.

## 4. Implementación

- Cambio mínimo, preservando APIs y patrones existentes (`CODE_STANDARD.md`).
- Cada comportamiento nuevo o corregido declara su test (`npm test`, `node:test`, nombre con `REQ-NNN`). Para lo que el runner no cubre (componentes React, navegador, PWA móvil) se registra `Omitido: no cubierto por el runner` y se compensa con una comprobación en Chrome descrita en la nota (paso reproducible).
- Documentación y código van en el mismo cambio.
- Una decisión de alto impacto se documenta como `Propuesta` en `Issues/` y se espera aprobación; no se crea ADR por iniciativa propia.

## 5. Validación e informe de verificación

Primero el check más estrecho; antes del commit, siempre:

```bash
npm run lint
npm test
npm run build
```

Además, según el cambio: `node --check server/index.js` y `docker compose -f docs/ci-cd/docker-compose.yml config` si toca la API o Docker; validar como XML cada SVG tocado; comprobar que los enlaces relativos de los documentos editados existen. Si algo falla, corregir la misma superficie y repetir.

Al terminar, el agente entrega este informe en el chat (y su contenido resumido en la sección `Verificación` de la nota):

```text
## Verificación — REQ-NNN
- Criterios de aceptación: ✅ <criterio> / ❌ <criterio> (con motivo)
- Checks: `npm run lint` ✅ · `npm test` ✅ · `npm run build` ✅ · <otros> ✅/❌/Omitido (motivo)
- Documentación: <archivos actualizados> · Sin cambio: <archivo> (<motivo>)
- Git: commit <hash> en main · push ✅/❌ · CI: ✅ / pendiente / no verificable (sin gh)
- Pendientes y bloqueos: <lista o "ninguno">
```

No se declara éxito sin haber ejecutado y leído la salida de cada check.

## 6. Git y entrega autónoma

El desarrollador es el único propietario del repositorio y autoriza de forma permanente el **commit y el push a `main` sin force** cuando la validación está en verde. No hace falta pedir confirmación en cada tarea.

- No usar `git reset --hard`, `git checkout --` ni `push --force`. No commitear secretos, `dist/`, `node_modules/` ni cambios ajenos; añadir archivos por nombre, no con `git add -A`.
- Un commit por tarea, con código, documentación y nota en el mismo cambio:

```text
<type>(<scope>): <summary> (REQ-NNN)

Refs #N
Issue local: Issues/NNN-slug.md
Requirements: REQ-NNN
Tests: <comandos ejecutados>
Docs: <archivos o Sin cambio: motivo>
```

  Tipos: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`. `Closes #N` solo en el commit que cierra la tarea (nota `Hecho`).
- Antes del push: `git diff --stat`, `git status` limpio de lo ajeno y, si el remoto avanzó, `git pull --rebase`.
- Después del push: comprobar con `git status --short --branch` y `git log origin/main -1`. Estado de CI: mientras la cuenta de GitHub siga bloqueada por facturación (decisión del desarrollador: no se configura), la CI no arranca; no se intenta relanzar ni se espera. La verificación válida es la local y el informe indica `CI: no disponible (facturación)`. Si la CI vuelve a funcionar, leerla con `gh run list --limit 3` y `gh run view <id>`.
- Los incrementos de versión usan un commit `release: vX.Y.Z` solo cuando la nota lo requiera; no inventar tags.
- Si falla autenticación, push o CI: no simular éxito, documentar el bloqueo en la nota y dejarla `En curso` o `Bloqueado`.

## 7. Cierre

Una tarea está lista cuando: la nota está `Hecho` con criterios marcados y verificación rellena; el índice y el backlog están al día; lint y build pasan; el diff está revisado; el commit y el push están hechos; la issue de GitHub está cerrada (`gh issue close N --reason completed`); y el informe de verificación se ha entregado. Una nota pasa a `Hecho` con la validación local en verde y el push hecho; si la CI falla después, se reabre y se corrige con un commit nuevo. Si el cierre depende de algo externo (despliegue, backup), la nota queda `En curso` y los pendientes `[BLOQUEADO]` quedan enumerados con su motivo.
