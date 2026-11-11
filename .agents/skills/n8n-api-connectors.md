# n8n API connectors

Las métricas de la Raspberry no pasan por n8n: las sirve `GET /api/pi/metrics` de la API de persistencia (`REQ-011`, adaptador `src/infrastructure/piMetrics.ts`). n8n queda para healthchecks y automatizaciones. Toda llamada HTTPS usa AbortController con 1500 ms, fallback `OFFLINE / UNREACHABLE` y no bloquea la UI. Los healthchecks comparten el mismo contrato de estado y alimentan un indicador discreto en los logos, no un listado técnico.

El adaptador de citas usa el contrato `{ content, author }`, ofrece `default`, `random` y `fav`, y siempre conserva una cita local si la API falla.
