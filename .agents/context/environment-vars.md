# Variables de entorno

- `N8N_METRICS_URL`: webhook HTTPS para métricas de la Raspberry Pi.
- `N8N_HEALTHCHECK_URL`: webhook opcional para healthchecks.
- `GRAFANA_URL`: URL pública o privada del dashboard Grafana.

Backend de persistencia (`server/`, REQ-011), leídas solo por el servidor, nunca por el bundle:

- `PROMETHEUS_URL`: API HTTP de Prometheus (por defecto `http://host.docker.internal:9090`).
- `PROMETHEUS_JOB`: `job` del node-exporter en Prometheus (por defecto `raspberrypi_host`).
- `DOCKER_PROXY_URL`: docker-socket-proxy de solo lectura; si falta, la API informa `containers: null` y `sources.docker: "disabled"`.
- `DEVICE_ID`: identificador del dispositivo en el contrato de métricas (por defecto `raspberry-pi-5`).
- `HEALTHCHECK_URLS`: sitios que la API comprueba en `GET /api/sites/health` (`REQ-022`), separados por comas; por defecto `https://hipoglifo.es,https://el-negredo.vercel.app,https://alonsomoros.github.io`. Máximo 10, solo `http`/`https`.
- `QUOTE_URL`: origen de la cita del día para `GET /api/quote` (`REQ-021`; por defecto `https://frasedeldia.azurewebsites.net/api/phrase`).

No incluir tokens, contraseñas ni URLs con credenciales en este archivo ni en el bundle frontend.
