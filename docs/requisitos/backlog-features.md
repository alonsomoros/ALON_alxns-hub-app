# Backlog

Dueño de lo **pendiente**. Lo hecho vive en `Issues/README.md` (índice de notas `REQ-NNN`); los requisitos en [`functional-requirements.md`](functional-requirements.md). Proceso de entrega: [`../../WORKFLOW.md`](../../WORKFLOW.md).

Reglas: al empezar un ítem se crea su nota `Issues/NNN-slug.md` (siguiente número libre de `Issues/README.md`) y el ítem pasa a la tabla "En curso"; al terminar se elimina de aquí. Los ítems sin REQ aún no tienen nota.

## En curso

| REQ | Qué falta | Bloqueo |
|---|---|---|
| [`REQ-018`](../../Issues/018-persistencia-personal-multidispositivo.md) | Desplegar la API en la Raspberry, ACL de Tailscale, HTTPS, backup y restauración, E2E desde dos dispositivos | [BLOQUEADO] requiere acceso a la Raspberry |
| [`REQ-004`](../../Issues/004-arquitectura-e-integraciones.md) | Adaptadores tipados de cita, métricas, healthchecks y Grafana | Cada uno abre su propia nota |

## Propuestas pendientes de decisión

| REQ | Propuesta | Falta |
|---|---|---|
| [`REQ-011`](../../Issues/011-telemetria-raspberry.md) | Contrato y transporte de métricas Raspberry | Responder las preguntas abiertas y aprobar |
| [`REQ-020`](../../Issues/020-runner-de-tests.md) | Runner de tests para dominio y API | Aprobar la dependencia |

## Pendiente priorizado

Prioridad alta (habilitan la entrega autónoma o cierran huecos de la persistencia):

- [ ] Runner de tests y tests de `src/domain/`, `src/utils/` y la API (`REQ-020`).
- [ ] [BLOQUEADO] CI de GitHub: no arranca por la facturación de la cuenta y el desarrollador decidió no configurarla; reabrir solo si cambia esa decisión.
- [ ] Corregir `archived: false` fijo al enviar enlaces a la API y decidir si las preferencias se leen de vuelta (`REQ-018`).
- [ ] Estado vacío en la tarjeta Accesos y en la vista Enlaces.

Prioridad media (producto):

- [ ] Adaptador de cita con timeout de 1.5 s y modos `default`, `random` y `fav`.
- [ ] Adaptador n8n para métricas de Raspberry Pi 5 (`REQ-011`).
- [ ] Healthchecks reales con timeout y fallback `OFFLINE`/`UNREACHABLE`.
- [ ] Implementar `raspberryPiStatsShowcase: graph` con gráficas ligeras y accesibles.
- [ ] Enlace configurable a Grafana.
- [ ] Menú de preferencias: tema, modo, cita, orden de servicios y widgets.
- [ ] Racha derivada de registros diarios consecutivos.

Prioridad baja:

- [ ] Override manual de `logoUrl` desde la UI y decisión de privacidad sobre el proveedor de favicons.
- [ ] Refrescar la fecha de Inicio al cambiar de día con la app abierta.
- [ ] Tarjeta Raspberry sin espacio en blanco en escritorio.
- [ ] Notificaciones de degradación de servicios.
- [ ] Pruebas de accesibilidad y flujos PWA en móvil.
- [ ] Migraciones futuras del esquema SQLite.
- [ ] Decidir si se elimina `pnpm-lock.yaml` (CI usa `npm ci`).
- [ ] Perfil y ajustes de usuario (fuera de la primera iteración).
