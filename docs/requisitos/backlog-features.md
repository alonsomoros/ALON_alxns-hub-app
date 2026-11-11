# Backlog

Dueño de lo **pendiente**. Lo hecho vive en `Issues/README.md` (índice de notas `REQ-NNN`); los requisitos en [`functional-requirements.md`](functional-requirements.md). Proceso de entrega: [`../../WORKFLOW.md`](../../WORKFLOW.md).

Reglas: al empezar un ítem se crea su nota `Issues/NNN-slug.md` (siguiente número libre de `Issues/README.md`) y el ítem pasa a la tabla "En curso"; al terminar se elimina de aquí. Los ítems sin REQ aún no tienen nota.

## En curso

| REQ | Qué falta | Bloqueo |
|---|---|---|
| [`REQ-018`](../../Issues/018-persistencia-personal-multidispositivo.md) | ACL de Tailscale, backup con retención y restauración, E2E de persistencia desde dos dispositivos | [BLOQUEADO] ACL y backup requieren decisión y acceso a la Raspberry |
| [`REQ-004`](../../Issues/004-arquitectura-e-integraciones.md) | Adaptadores tipados de cita, métricas, healthchecks y Grafana | Cada uno abre su propia nota |

## Propuestas pendientes de decisión

| REQ | Propuesta | Falta |
|---|---|---|

## Pendiente priorizado

Prioridad alta (habilitan la entrega autónoma o cierran huecos de la persistencia):

- [ ] Tests de componentes React (hooks y vistas) y E2E de la PWA en móvil; hoy se comprueban a mano en Chrome.
- [ ] [BLOQUEADO] CI de GitHub: no arranca por la facturación de la cuenta y el desarrollador decidió no configurarla; reabrir solo si cambia esa decisión.

Prioridad media (producto):

- [ ] Modo `fav` de la cita (los modos `default` y `random` y el timeout de 1.5 s ya existen, `REQ-021`).
- [ ] Healthchecks reales con timeout y fallback `OFFLINE`/`UNREACHABLE` (propuesta: `blackbox-exporter` en Prometheus).
- [ ] cAdvisor en Prometheus para CPU/RAM por contenedor.
- [ ] Alertas: Alertmanager → webhook de n8n → notificación.
- [ ] Enlace configurable a Grafana.
- [ ] Preferencias pendientes: modo claro/oscuro automático según el sistema, cita editable y orden de los servicios (`REQ-003`).
- [ ] Racha derivada de registros diarios consecutivos.

Prioridad baja:

- [ ] Override manual de `logoUrl` desde la UI y decisión de privacidad sobre el proveedor de favicons.
- [ ] Tarjeta Raspberry sin espacio en blanco en escritorio.
- [ ] Notificaciones de degradación de servicios.
- [ ] Limitar Prometheus, node-exporter, Grafana y Portainer a Tailscale/localhost (hoy escuchan en toda la LAN).
- [ ] Revisar `watchtower` en la Pi: aparece en `Restarting (1)`.
- [ ] Pruebas de accesibilidad y flujos PWA en móvil.
- [ ] Migraciones futuras del esquema SQLite.
- [ ] Decidir si se elimina `pnpm-lock.yaml` (CI usa `npm ci`).
- [ ] Perfil y ajustes de usuario (fuera de la primera iteración).
