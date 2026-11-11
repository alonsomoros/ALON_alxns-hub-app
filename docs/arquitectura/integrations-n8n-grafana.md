# Integraciones n8n y Grafana

## Métricas Pi 5

Las métricas **no pasan por n8n** (`REQ-011`). La API personal (`server/metrics.js`) las agrega desde Prometheus (node-exporter) y, para contenedores, desde un docker-socket-proxy de solo lectura, y las sirve en `GET /api/pi/metrics`. La PWA sondea cada 60 s con timeout de 1.5 s.

```json
{ "schemaVersion": 1, "deviceId": "raspberry-pi-5", "observedAt": "ISO-8601",
  "metrics": { "cpuBusyPercent": 1.2, "ramUsedPercent": 29.6, "storageUsedPercent": 36.3,
               "temperatureCelsius": 49.6, "uptimeSeconds": 8962388, "load1": 0.1 },
  "containers": { "running": 11, "total": 13, "unhealthy": 0,
                  "items": [{ "name": "grafana", "state": "running", "health": "none" }] },
  "sources": { "prometheus": "ok", "docker": "ok" } }
```

- Cada fuente falla por separado: HTTP 200 con valores `null` y `sources.<fuente>` en `unreachable` (o `disabled` sin `DOCKER_PROXY_URL`).
- Caché de 15 s en el servidor (igual que el scrape de Prometheus); consultas con timeout de 1 s.
- Estados en la PWA: `loading`, `online`, `degraded`, `stale` (último dato válido y su edad), `offline` y `prototype` (sin API configurada).
- Consultas PromQL y variables (`PROMETHEUS_URL`, `PROMETHEUS_JOB`, `DOCKER_PROXY_URL`, `DEVICE_ID`) en `server/metrics.js` y `.agents/context/environment-vars.md`.
- n8n queda para automatizaciones futuras (alertas desde Alertmanager).

## Healthchecks

Los endpoints configurados serán `hipoglifo.es`, `el-negredo.vercel.app` y `alonsomoros.github.io`. La respuesta normalizada incluye `name`, `url`, `state`, `latencyMs` y `checkedAt`.

## Grafana

El dashboard enlaza a Grafana para detalle histórico; las credenciales y URLs viven en variables de entorno, nunca en el bundle.

## Citas

La primera frase (`REQ-021`) sale de `GET /api/quote` de la API personal, que pide la frase del día en español a un origen externo sin CORS (`QUOTE_URL`, por defecto `frasedeldia.azurewebsites.net`), la valida y la guarda en caché; el contrato es `{ content, author }` y la PWA lo inyecta en el `blockquote` de Inicio con timeout de 1.5 s y frase de reserva local. Los modos `default` y `random` están implementados; `fav` queda en el backlog. La cita no debe impedir el render inicial.
