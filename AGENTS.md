# alXns Command Center PWA

## Autoridad y lectura obligatoria

Este archivo es el SOP de navegación del repositorio. **Antes de leer código, proponer trabajo o editar, el agente DEBE leer `AGENTS.md` y `WORKFLOW.md` completos** y seguir la lectura escalonada de `WORKFLOW.md` §1 (núcleo siempre; el resto según el área afectada). Esa sección es la única lista de lectura: no se repite en otros documentos.

Cada hecho tiene un único dueño; enlazar, no duplicar:

| Necesidad | Dueño |
|---|---|
| Proceso, trazabilidad, validación, Git y cierre | `WORKFLOW.md` |
| Convenciones de código y tests | `CODE_STANDARD.md` |
| Estilo, IDs y referencias | `context/STYLE_GUIDE.md` |
| Estado técnico actual | `.agents/context/system-status.md` |
| Tareas, propuestas y decisiones (REQ) | `Issues/` |
| Requisitos y backlog | `docs/requisitos/` |
| Arquitectura e integraciones | `docs/arquitectura/` |
| Mapa del código existente | `docs/codebase/` |
| Diagramas | `docs/diagramas/` |

Si falta un archivo requerido o hay conflicto entre reglas, detener la edición, nombrar el conflicto y pedir decisión.

## Visión

PWA rápida y privada para centralizar infraestructura self-hosted, estado de aplicaciones, accesos contextuales y objetivos personales. Detalle en `context/VISION.md`.

## Stack

- React + TypeScript + Vite; Tailwind CSS v4 y CSS plano para la UI.
- `vite-plugin-pwa` para manifest, precache y actualización automática.
- Lucide React para iconografía.
- API de persistencia en Node 22 + SQLite (`server/`, Docker) para retos, enlaces y preferencias (`REQ-018`).
- Integraciones futuras mediante endpoints HTTPS de n8n y APIs ligeras.

## Reglas de desarrollo

- Mantener TypeScript estricto y componentes desacoplados (`CODE_STANDARD.md`).
- Las peticiones externas no bloquean la UI: skeletons, timeout de 1.5 s y estados `OFFLINE`/`UNREACHABLE`.
- No guardar secretos en el repositorio, el bundle ni `localStorage`.
- Actualizar la skill de `.agents/skills/` cuando cambien endpoints, integraciones o widgets.
- Para diagramas usar `/diagrams` (`.agents/skills/diagrams.md`) y mantener SVG y Mermaid sincronizados.

## Ciclo de trabajo

El detalle está en `WORKFLOW.md`. Resumen:

1. **Preflight:** leer, comprobar `git status`, clasificar la petición.
2. **Nota:** localizar o crear `Issues/NNN-slug.md` (`REQ-NNN`) con criterios de aceptación.
3. **Implementar** el cambio mínimo.
4. **Validar:** `npm run lint` y `npm run build`, más el check específico del cambio.
5. **Documentar:** actualizar los dueños de la matriz de impacto y marcar la nota `Hecho`.
6. **Entregar:** commit trazable y push a `main` sin force, en el mismo cambio que la documentación.
7. **Informar** en el chat con el informe de verificación de `WORKFLOW.md` §5.

Con la validación en verde, el commit y el push se hacen directamente, sin pedir confirmación.

## Cuándo detenerse y preguntar

- La petición es ambigua o hay varias soluciones con impacto de producto distinto.
- Hay una decisión de arquitectura de alto impacto (se documenta como `Propuesta` en `Issues/` hasta su aprobación).
- Se necesita una dependencia nueva, un secreto, una acción destructiva o tocar cambios ajenos.
- La validación falla y la causa no es evidente tras diagnosticarla.

## Comandos

- `npm run dev`: servidor local.
- `npm run persistence`: API de persistencia SQLite.
- `npm run build`: typecheck (`tsc -b`) y build de producción.
- `npm run lint`: Oxlint.
- `npm run preview`: servir `dist`.

El gestor de paquetes es npm (CI usa `npm ci` con `package-lock.json`).

## Arquitectura

La UI vive en `src/` y se organiza por feature (`components/`), dominio puro (`domain/`), datos de prototipo (`data/`), hooks, adaptadores (`infrastructure/`) y utilidades. Los retos y enlaces se sincronizan con la API de persistencia cuando `VITE_PERSISTENCE_API_URL` está definida; las fuentes n8n/Grafana se conectarán detrás de adaptadores tipados. Ver `docs/codebase/ARCHITECTURE.md` y `docs/arquitectura/`.

## Mapa del repositorio

```text
/AGENTS.md              SOP, mapa y enrutamiento
/WORKFLOW.md            proceso, trazabilidad, validación y Git
/CODE_STANDARD.md       convenciones de código y tests
/context/               índice, visión y estilo de documentación
/src/                   aplicación React/Vite
/server/                API de persistencia SQLite (+ Dockerfile.persistence)
/docs/requisitos/       requisitos funcionales y backlog
/docs/arquitectura/     arquitectura, integraciones y despliegue
/docs/codebase/         mapa del código existente
/docs/ci-cd/            guía de despliegue y Docker Compose
/docs/diagramas/        SVG y Mermaid
/Issues/                notas REQ-NNN, índice y plantilla
/.agents/               contexto y skills operativas
/.github/               CI y plantilla de issue
```

No añadir carpetas de primer nivel sin justificarlo en la nota y actualizar este mapa.

## Contexto de producto

La primera iteración prioriza una experiencia personal sencilla y responsive con Inicio, Retos y Enlaces. Los enlaces admiten hasta 10 elementos y se reordenan por arrastre o teclado. La configuración de tema, citas, orden de servicios y métricas está preparada, pero la pantalla de preferencias queda pospuesta. Healthchecks y la configuración final de la persistencia (`REQ-018`) siguen pendientes (`.agents/context/system-status.md`).
