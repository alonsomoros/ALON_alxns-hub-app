# Publicar la API de persistencia solo en loopback

- **Estado:** En curso (preparado y verificado en lectura; despliegue en la Raspberry pendiente)
- **REQ:** REQ-023
- **Tipo:** fix
- **Área:** `docs/ci-cd/docker-compose.yml`, `.env.example`, `docs/arquitectura/deploy-persistencia-raspberry.md`
- **GitHub:** [#23](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/23)
- **Actualizada:** 2026-11-13

## Problema

El compose publicaba la API como `8787:8787`, es decir, en `0.0.0.0` y `[::]`. Desde cualquier equipo de la red local, `GET http://raspberrypi.local:8787/api/state` devolvía `200` y la API no pide credenciales (`REQ-018`: el perímetro es la red privada). El perímetro real era «la LAN o la tailnet», no solo la tailnet.

No se cambia: la autenticación de la API (va con el chat, `REQ-024`), ni los puertos de otros servicios de la Pi (Grafana, Portainer, Prometheus, node-exporter, Pi-hole, Homepage, WAHA, wg-easy y nginx-proxy-manager), que no son de este repositorio.

## Decisión

Publicar solo en el loopback del host: `"127.0.0.1:8787:8787"`. `HOST: 0.0.0.0` se mantiene porque es la interfaz interna del contenedor y Docker necesita reenviar a ella.

Antes de decidirlo se revisó en la Pi, en solo lectura, quién usa el puerto:

| Posible usuario | Resultado |
|---|---|
| `tailscale serve` | Proxy a `http://127.0.0.1:8787`: no le afecta. |
| `nginx-proxy-manager` | Solo enruta `n8n:5678` y `192.168.1.64:8001`. |
| Prometheus | Solo scrapea `:9090` y `:9100`. |
| Otros contenedores y `docker-proxy` | Ninguno referencia el 8787; la API está sola en `ci-cd_default`. |
| Conexiones abiertas | Ninguna en el momento de la revisión. |
| Vercel | Usa `https://raspberrypi.tail6f4cba.ts.net` (pasa por `serve`). |
| `.env` local del desarrollador | Apuntaba a `http://<IP de Tailscale>:8787` (directo): es el único consumidor que se rompe; se cambia a la URL de `serve`. |

Hallazgo durante la revisión: el contenedor en marcha tiene `ALLOWED_ORIGINS=https://alxns-hub.vercel.app,http://localhost:5173#` (con una `#` final, de un comando escrito a mano), aunque el `.env` de la Pi está bien. Por eso `Origin: http://localhost:5173` no recibe `Access-Control-Allow-Origin` (Vercel sí). Recrear el contenedor con `--env-file .env` lo corrige, y es necesario para que el desarrollo local use la URL de `serve`.

Alternativas descartadas: firewall en la Pi (`ufw` no está instalado y filtraría también el tráfico de Docker de forma poco predecible) y publicar en la IP de Tailscale (obliga a codificar una IP y no aporta nada frente a `serve`).

## Criterios de aceptación

- [x] El compose publica la API solo en `127.0.0.1:8787`.
- [x] Ningún servicio activo de la Pi usa el puerto por la LAN o por IP (revisión en solo lectura).
- [x] La documentación y `.env.example` ya no recomiendan `http://100.x.x.x:8787`.
- [ ] Desplegado en la Pi: `http://raspberrypi.local:8787` rechaza la conexión.
- [ ] Tras el despliegue siguen funcionando `https://raspberrypi.tail6f4cba.ts.net/api/state` (200), la PWA de Vercel y el servidor de desarrollo local.
- [ ] El contenedor recreado ya no lleva la `#` final: `Origin: http://localhost:5173` recibe `Access-Control-Allow-Origin`.

## Verificación

| Check | Resultado |
|---|---|
| `docker compose -f docs/ci-cd/docker-compose.yml config` | OK: `host_ip: 127.0.0.1`, `target: 8787` |
| Revisión en la Pi (contenedores, puertos, proxies, Prometheus, conexiones) | OK, ver tabla de la Decisión |
| Antes del cambio: `curl http://raspberrypi.local:8787/api/state` desde el PC | `200` (el problema) |
| Despliegue en la Pi | Pendiente: lo ejecuta el desarrollador (ver Pendientes) |

Tests de caja negra: `Omitido: no cubierto por el runner` (es configuración de despliegue); la comprobación es manual, tras desplegar.

## Impacto documental

Actualizados: `docs/arquitectura/deploy-persistencia-raspberry.md`, `.env.example`, `.agents/context/system-status.md`, `Issues/README.md`. Sin cambio: `docs/diagramas/` (el flujo ya pasa por Tailscale), `.agents/skills/` (no cambian endpoints ni widgets).

## Pendientes

- [ ] Desplegar en la Pi, con el mismo `--env-file` con el que se creó el contenedor:

  ```bash
  cd ~/ALON_alxns-hub-app && git pull --ff-only
  docker compose --env-file .env -f docs/ci-cd/docker-compose.yml up -d --build
  docker ps --format '{{.Names}}\t{{.Ports}}' | grep alxns   # debe mostrar 127.0.0.1:8787->8787/tcp
  curl -s http://127.0.0.1:8787/health                          # desde la Pi: OK
  ```

  Desde el PC: `curl http://raspberrypi.local:8787/health` debe fallar, `curl https://raspberrypi.tail6f4cba.ts.net/health` debe responder y `curl -si -H "Origin: http://localhost:5173" https://raspberrypi.tail6f4cba.ts.net/health` debe incluir `Access-Control-Allow-Origin`. Hasta desplegar, el `.env` local ya apunta a la URL de `serve` y el desarrollo local fallará por CORS; para volver atrás en local basta restaurar la URL antigua. Marcha atrás: volver a `"8787:8787"` y repetir `up -d`.
- [ ] Puertos de otros servicios de la Pi abiertos a la LAN (3000, 3001, 3002, 8080, 8181, 9000, 9090, 9100, 51821): revisar uno a uno con el desarrollador, porque otros sistemas dependen de ellos → backlog.
- [ ] Autenticación de la API con token fuera del bundle → `REQ-024`.
