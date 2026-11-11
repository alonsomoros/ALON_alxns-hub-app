# Telemetría de Raspberry Pi

- **Estado:** En curso (implementado y probado en local; despliegue en la Raspberry pendiente)
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
- [x] La tarjeta muestra CPU, memoria, disco y temperatura reales, y el resumen de contenedores con incidencias.
- [x] Compose con `docker-proxy` de solo lectura y sin puertos publicados.
- [ ] Desplegado en la Raspberry y contrastado con `vcgencmd`, `free`, `df` y `docker ps`.
- [ ] Estado de contenedores real visible en la PWA (requiere el despliegue).
- [ ] Tests `REQ-011 ...` de contrato, timeout y degradación → `REQ-020`.

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
| Tests automáticos (`REQ-011 ...`) | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Actualizados: `docs/arquitectura/{integrations-n8n-grafana,system-architecture,deploy-persistencia-raspberry}.md`, `docs/codebase/{INTEGRATIONS,STRUCTURE}.md`, `docs/requisitos/{functional-requirements,backlog-features}.md` (FR-03), `.agents/skills/n8n-api-connectors.md`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`, `docs/diagramas/{data-flow,architecture}.svg` y el Mermaid, `AGENTS.md`.

## Pendientes

- [ ] Desplegar en la Raspberry (`git pull` y `docker compose up -d --build`) y verificar; la nota pasa a `Hecho` y se cierra #11 tras ello.
- [ ] Healthchecks de los sitios con `blackbox-exporter` en Prometheus → backlog.
- [ ] cAdvisor para CPU/RAM por contenedor → backlog.
- [ ] Alertas Alertmanager → n8n → notificación → backlog.
- [ ] Prometheus, node-exporter, Grafana y Portainer escuchan en toda la LAN; limitarlos a Tailscale/localhost → backlog.
- [ ] `watchtower` aparece en `Restarting (1)` en la Pi → backlog.
