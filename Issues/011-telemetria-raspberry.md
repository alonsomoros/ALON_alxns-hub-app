# Telemetría de Raspberry Pi

- **Estado:** Hecho
- **REQ:** REQ-011
- **Tipo:** feat
- **Área:** `server/metrics.js`, `server/index.js`, `src/infrastructure/piMetrics.ts`, `src/hooks/usePiMetrics.ts`, `src/components/home/HomeView.tsx`, `docs/ci-cd/docker-compose.yml`
- **GitHub:** [#11](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/11)
- **Actualizada:** 2026-11-11

## Problema

La tarjeta Raspberry mostraba métricas fijas, pero se quiere información real y actualizada cada 60 s, con base para ver el estado de los contenedores. Un navegador no puede observar la Raspberry directamente: necesita un canal intermedio, una política de actualización y degradación segura.

## Decisión

La API personal que ya corre en la Raspberry (`server/index.js`) agrega dos fuentes y la PWA la sondea cada 60 s. Sin n8n en la ruta de métricas.

```text
PWA --(poll 60 s, timeout 1.5 s)--> GET /api/pi/metrics
                                      |-- Prometheus HTTP API (PromQL, timeout 1 s)
                                      '-- docker-socket-proxy GET /containers/json (timeout 1 s)
```

- **Prometheus** ya existe en la Pi y recoge `node-exporter` cada 15 s: es la fuente de CPU, memoria, disco, temperatura, uptime y carga. La API lo consulta con PromQL y la PWA nunca conoce PromQL.
- **Contenedores:** `tecnativa/docker-socket-proxy` de solo lectura (`CONTAINERS=1`, `POST=0`, sin puertos publicados) en el mismo Compose. La API no monta `docker.sock`.
- **Contrato** `schemaVersion: 1` con `observedAt`, `metrics`, `containers` y `sources`. Cada fuente falla por separado: HTTP 200 con `null` y `sources.<fuente> = "unreachable"` (o `"disabled"` sin `DOCKER_PROXY_URL`).
- **Caché de 15 s** en el servidor (igual que el scrape), con una única consulta compartida entre clientes simultáneos. Rangos validados: porcentajes acotados a 0-100, temperatura -40..150, `NaN` → `null`.
- **Cliente:** `usePiMetrics` sondea cada 60 s solo con Inicio abierto y pestaña visible; conserva el último dato válido. Estados: `loading`, `online`, `degraded`, `stale` (dato previo + edad), `offline` y `prototype` (sin `VITE_PERSISTENCE_API_URL`, datos de ejemplo).
- **Alternativas descartadas:** push de la Pi a n8n (un salto más y n8n está en otra red), consultar Prometheus desde el navegador (expone PromQL, CORS y acopla la UI), SSE/WebSocket (con scrape de 15 s no aporta), cAdvisor (más consumo en la Pi; opcional más adelante).

## Criterios de aceptación

- [x] `GET /api/pi/metrics` devuelve el contrato versionado con fuentes independientes y caché de 15 s.
- [x] Adaptador con timeout de 1.5 s y validación estricta del contrato (`src/infrastructure/piMetrics.ts`).
- [x] Polling de 60 s con pausa si la pestaña está oculta y `stale` con la edad del último dato.
- [x] La tarjeta muestra CPU, memoria, disco y temperatura reales, y el resumen de contenedores; solo cuentan como incidencia los `restarting`, `dead` y `unhealthy` (un contenedor parado a propósito no es una incidencia).
- [x] Compose con `docker-proxy` de solo lectura y sin puertos publicados.
- [x] El botón «Ver detalle» despliega la lista de contenedores con su estado y salud (`aria-expanded`); no se muestra si no hay lista (modo ejemplo o Docker no disponible). Antes era un botón sin acción.
- [x] Desplegado en la Raspberry y contrastado con `vcgencmd`, `free`, `df` y `docker ps`.
- [x] Resumen de contenedores correcto con la lista real de la Pi (leída por SSH en solo lectura y servida por un proxy simulado).
- [x] Estado de contenedores real a través del `docker-proxy` desplegado (13 activos de 17; `watchtower` reiniciándose).
- [x] Tests `REQ-011` de contrato, normalización y degradación del endpoint (`tests/api.test.ts`); el timeout de 1 s por fuente no tiene prueba.

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` / `npm run build` | OK |
| `node --check server/index.js` y `server/metrics.js` | OK |
| `docker compose -f docs/ci-cd/docker-compose.yml config` | OK |
| `metrics.js` contra el Prometheus real de la Pi (solo lectura) con Docker simulado | OK: CPU 1.3 %, RAM 29.6 %, disco 36.3 %, 50.2 °C; 49 ms; segunda llamada servida desde caché |
| Prometheus inalcanzable y Docker desactivado | OK: métricas `null`, `sources` = `unreachable`/`disabled`, sin excepción |
| PWA en Chrome contra la API local | OK: valores reales y estado `Activo`; sin errores de consola |
| API parada y refresco forzado | OK: conserva valores, "No disponible" y "Último dato hace 1 min"; se recupera al volver la API |
| Lista real de la Pi (16 contenedores) con proxy simulado, PWA en Chrome | OK: "12/16 contenedores activos · 1 con incidencias" (`watchtower` en `restarting`; `inazuma-*` y `waha-run` parados no cuentan); datos de host reales; sin errores de consola |
| Imagen `tecnativa/docker-socket-proxy:0.3.0` | OK: publica `arm64` (Docker Hub) |
| «Ver detalle» en Chrome (API local + lista real de 16 contenedores) | OK: despliega 16 filas (`watchtower` «Reiniciando», `inazuma-*` y `waha-run` «Parado»), cambia a «Ocultar detalle» y vuelve a plegarse; sin errores de consola. Ancho de móvil: no verificable visualmente aquí (el redimensionado no cambió el viewport) |
| Despliegue en la Pi (`docker compose up`) | OK: `ci-cd-alxns-persistence-1` healthy y `ci-cd-docker-proxy-1` arriba |
| `GET /api/pi/metrics` en la Pi frente al host | OK: RAM 30.4 % (`free` 30.7 %), disco 36.6 % (`df` 34 %, reserva ext4), temp 49.6 °C (`vcgencmd` 52.1 °C un instante después), contenedores 13/17 = `docker ps -a` (4 no activos: 3 `exited`, `watchtower` `restarting`) |
| Seguridad del proxy | OK: `docker-proxy` sin puertos publicados, `docker.sock` en `:ro`, `POST /containers/create` → 403 |
| Degradación en la Pi (Prometheus inexistente, aislado) | OK: `sources.prometheus = unreachable`, métricas `null`, contenedores 13/17 |
| Tests automáticos (`REQ-011 ...`) | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Actualizados: `docs/arquitectura/{integrations-n8n-grafana,system-architecture,deploy-persistencia-raspberry}.md`, `docs/codebase/{INTEGRATIONS,STRUCTURE}.md`, `docs/requisitos/{functional-requirements,backlog-features}.md` (FR-03), `.agents/skills/n8n-api-connectors.md`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`, `docs/diagramas/{data-flow,architecture}.svg` y el Mermaid, `AGENTS.md`.

## Pendientes

- [x] Desplegado y verificado en la Raspberry (2026-11-11). El contenedor actual se creó con `docker compose --env-file .env -f docs/ci-cd/docker-compose.yml` (proyecto `ci-cd`, `ALLOWED_ORIGINS` en el `.env` de la raíz del repo): recrearlo con ese mismo `--env-file`, tras copiar `/app/data` como respaldo.
- [ ] El `.env` de la Pi conserva `ALLOWED_ORIGINS` antiguo mientras el contenedor ya acepta `https://alxns-hub.vercel.app`: igualarlo para que un `docker compose up` futuro no rompa el CORS en producción → backlog.
- [x] Healthchecks de los sitios resueltos sin `blackbox-exporter`, en la API (`REQ-022`); el histórico con `blackbox-exporter` sigue en el backlog.
- [ ] cAdvisor para CPU/RAM por contenedor → backlog.
- [ ] Alertas Alertmanager → n8n → notificación → backlog.
- [ ] Prometheus, node-exporter, Grafana y Portainer escuchan en toda la LAN; limitarlos a Tailscale/localhost → backlog.
- [ ] `watchtower` aparece en `Restarting (1)` en la Pi → backlog.
