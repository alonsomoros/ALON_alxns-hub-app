# Integrations

## Integration inventory

| System | Type | Purpose | Auth | Criticality | Evidence |
|---|---|---|---|---|---|
| frasedeldia (vía la API personal) | HTTPS API sin CORS | Cita del día en español | Sin clave; opcional `QUOTE_URL` en el servidor | Baja; origen no oficial, con caché y frase de reserva | `server/quote.js`, `src/infrastructure/quote.ts`, `src/hooks/useQuote.ts` |
| n8n | HTTPS webhook | Metricas Pi y healthchecks futuros | `[TODO]` | Media; no implementado | `docs/arquitectura/integrations-n8n-grafana.md` |
| Grafana | Dashboard externo | Detalle historico futuro | URL/config futura | Baja para shell actual | `docs/arquitectura/integrations-n8n-grafana.md` |
| Prometheus + docker-socket-proxy | HTTP privado (red de la Pi) | Métricas del host y estado de contenedores | Red privada, solo lectura | Media; la tarjeta degrada a `stale`/`OFFLINE` | `server/metrics.js`, `src/infrastructure/piMetrics.ts` |
| API de persistencia | HTTP privado (Tailscale) | Retos, enlaces y preferencias | Perimetro de red, sin login | Media; la app funciona sin ella | `src/infrastructure/persistence.ts`, `server/index.js` |
| Servicios publicados | HTTPS links | Sitios clicables y healthchecks futuros | No configurada | Baja para shell actual | `src/data/dashboardData.ts` |

## Data stores

SQLite en la Raspberry mediante `server/index.js` (`REQ-018`), con cache del ultimo estado en `localStorage` (`alxns:persistence-state`). Sin `VITE_PERSISTENCE_API_URL` el estado de enlaces y retos vive en memoria React y no se persiste. IndexedDB no se usa.

## Secrets

Las variables previstas son `N8N_METRICS_URL`, `N8N_HEALTHCHECK_URL` y `GRAFANA_URL`; el documento de entorno indica que no deben entrar en el bundle. No hay lectura de esas variables en `src/` actualmente.

## Reliability

La cita (`REQ-021`) se pide a `GET /api/quote` de la API personal con timeout de 1.5 s, `AbortController` para cancelar al desmontar y frase de reserva local ante cualquier fallo; el servidor la obtiene del origen en español, la valida y la guarda en caché (6 h, renovación en segundo plano). La persistencia si aplica timeout de 1.5 s y muestra `Sincronizado`/`Conectando`/`Solo local`/`OFFLINE` en el pie. Las métricas de la Raspberry (`REQ-011`) aplican timeout de 1.5 s en el cliente, 1 s por fuente en el servidor, caché de 15 s y estados `loading`/`online`/`degraded`/`stale`/`offline`. Los healthchecks siguen sin implementar.

## Observability

No hay logging, metricas ni tracing de integraciones. `[TODO]` definir visibilidad cuando se incorporen adaptadores.

## Evidence

- `src/hooks/useQuote.ts`
- `src/infrastructure/persistence.ts`
- `src/infrastructure/piMetrics.ts`
- `server/index.js`
- `server/metrics.js`
- `src/data/dashboardData.ts`
- `.agents/context/environment-vars.md`
- `docs/arquitectura/integrations-n8n-grafana.md`
