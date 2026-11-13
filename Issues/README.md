# Issues

Dueño de la **trazabilidad local**: cada cambio de comportamiento, arquitectura, CI o proceso tiene una nota `NNN-slug.md` en esta carpeta. El proceso para crearla, validarla y cerrarla vive en [`../WORKFLOW.md`](../WORKFLOW.md); aquí solo está el índice y las reglas de las notas.

## Reglas

1. **`REQ-NNN` = `Issues/NNN-slug.md`.** El número de la nota es el identificador del requisito. Siguiente número libre: **021**.
2. **GitHub:** Cada nota tiene su issue de GitHub (`gh issue create`, título `REQ-NNN: <título>`, cuerpo que enlaza a la nota); el número va en el campo `GitHub` de la nota y los commits usan `Refs #N`. Hasta ahora `#N` coincide con `NNN`, pero no se da por supuesto: se anota el número que devuelve `gh`. La nota local es la fuente de verdad; la issue la refleja y se cierra (`gh issue close N --reason completed`) cuando la nota pasa a `Hecho`.
3. **Estados:** `Propuesta` (sin decisión) → `En curso` (decidida, en implementación) → `Hecho` (validada, commit y push hechos) · `Bloqueado` (depende de algo externo) · `Descartado`. El estado de la nota y la tabla de abajo deben coincidir.
4. **Plantilla:** copiar [`_TEMPLATE.md`](_TEMPLATE.md). Toda nota tiene cabecera, criterios de aceptación con casillas, tabla de verificación e impacto documental.
5. **Pendientes:** cada pendiente apunta a su destino (otra nota, backlog o `[BLOQUEADO] motivo`). No se dejan pendientes sueltos en texto histórico.
6. **No duplicar:** requisitos funcionales en `docs/requisitos/`, arquitectura en `docs/arquitectura/`. La nota enlaza, no copia.
7. Una nota `Hecho` no se reescribe: si el comportamiento vuelve a cambiar, se abre una nota nueva que referencia la anterior.

## Índice

| Nota | Estado | Área | Resumen |
|---|---|---|---|
| [001](001-enlaces-responsive.md) | Hecho | UI | Fila compacta de enlaces sin overflow, ordenación por arrastre. |
| [002](002-paginas-y-vistas.md) | Hecho | UI | Shell con Inicio, Retos y Enlaces. |
| [003](003-parametros-y-preferencias.md) | Hecho | Config | Pantalla de Ajustes: temas, vista de stats, tarjetas de Inicio y refresco; sincronizada con la API. |
| [004](004-arquitectura-e-integraciones.md) | En curso | Arquitectura | Marco: adaptadores tipados con timeout 1.5 s; integraciones n8n/Grafana pendientes. |
| [005](005-cicd-trazabilidad.md) | Hecho | CI | Workflow CI, plantilla de issue y skill de entrega. |
| [006](006-diagrams.md) | Hecho | Docs | Skill `/diagrams` y SVG de arquitectura, pantallas, datos y entrega. |
| [007](007-agent-governance.md) | Hecho | Proceso | Dueños documentales y gates (reemplazado en parte por 019). |
| [008](008-retos-y-progreso.md) | Hecho | UI/Dominio | Retos con progreso derivado, edición, archivo e historial. |
| [009](009-enlaces-drag-y-branding.md) | Hecho | UI | Reordenado estable por `id` y con teclado; logo con fallback. |
| [010](010-sitios-branding.md) | Hecho | UI | Logos de servicios con estado independiente. |
| [011](011-telemetria-raspberry.md) | Hecho | Integración | Métricas reales de la Raspberry: la API lee Prometheus y Docker, la PWA sondea cada 60 s. Desplegado en la Pi. |
| [012](012-code-review-global.md) | Hecho | Calidad | Revisión global; hallazgos resueltos en 013-017. |
| [013](013-branding-asset.md) | Hecho | UI/PWA | Logo oficial en splash, cabecera, favicon y manifest. |
| [014](014-mock-data.md) | Hecho | Datos | Datos de prototipo aislados en `src/data/`. |
| [015](015-link-logo-resolver.md) | Hecho | Dominio | Resolver único `logoUrl` → favicon → icono. |
| [016](016-app-architecture.md) | Hecho | Arquitectura | `App.tsx` dividido en vistas, dominio, hooks y datos. |
| [017](017-date-dynamic.md) | Hecho | UI | Fecha del sistema en Inicio. |
| [018](018-persistencia-personal-multidispositivo.md) | En curso | Persistencia | API SQLite + caché; despliegue, backups y E2E bloqueados. |
| [019](019-flujo-agentes-v2.md) | Hecho | Proceso | Rediseño del flujo agéntico para entrega autónoma verificable. |
| [024](024-chat-consultas.md) | Propuesta | Arquitectura | Chat de consultas con voz dentro del hub, servido desde la Pi, solo lectura y por fases. |
| [023](023-api-solo-loopback.md) | En curso | Seguridad | La API de persistencia se publica solo en `127.0.0.1` (antes escuchaba en toda la LAN). Despliegue pendiente. |
| [022](022-healthchecks-sitios.md) | Hecho | Integración | Estado real de «Tus sitios»: `GET /api/sites/health` en la API personal, con caché y estado «sin comprobar». Desplegado en la Pi. |
| [021](021-cita-via-api.md) | Hecho | Integración | Cita del día en español: `GET /api/quote` en la API personal, con caché y frase de reserva. Desplegada en la Pi. |
| [020](020-runner-de-tests.md) | Hecho | Tests | `npm test` con `node:test` (sin dependencias): dominio, API, preferencias, cita y SVG; nombres con `REQ-NNN`. |

## Entrega

Ver [`../WORKFLOW.md`](../WORKFLOW.md) (proceso, informe de verificación y Git) y [`../.agents/skills/cicd-github-delivery.md`](../.agents/skills/cicd-github-delivery.md) (checklist operativa).
