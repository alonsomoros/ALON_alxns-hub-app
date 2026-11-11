# Despliegue de persistencia en Raspberry

## Datos de red del despliegue

- Raspberry por Tailscale: `100.x.x.x`
- Dispositivo cliente por Tailscale: `100.y.y.y`
- Puerto inicial de la API: `8787`

La IP del móvil sirve para verificar conectividad y para las ACL de Tailscale si se restringen. No se usa como secreto ni como origen CORS: CORS valida el origen HTTP de la PWA, mientras que Tailscale controla qué dispositivos pueden alcanzar la Raspberry.

## Requisitos de la Raspberry

- Docker Engine y Docker Compose v2 en arquitectura compatible con la Raspberry.
- La imagen usa Node.js 22 y `node:sqlite`; Node no necesita instalarse directamente en el host.
- Tailscale conectado y con la Raspberry y el móvil en la misma tailnet.
- Directorio persistente para `DB_PATH`, fuera del bundle de la PWA.
- Copias periódicas del archivo SQLite y de sus archivos WAL cuando proceda.

## Configuración

En la Raspberry, desde el directorio del proyecto:

```bash
export ALLOWED_ORIGINS=http://100.x.x.x:4173
docker compose -f docs/ci-cd/docker-compose.yml up -d --build
```

El compose monta el volumen Docker `alxns-persistence-data` en `/app/data`, publica la API en el puerto `8787` de la Raspberry y reinicia el contenedor automáticamente. No se usa `systemd`.

Para revisar el estado:

```bash
docker compose -f docs/ci-cd/docker-compose.yml ps
docker compose -f docs/ci-cd/docker-compose.yml logs --tail=100 alxns-persistence
```

Para servir la PWA desde la propia Raspberry, el origen debe ser la URL que realmente use el navegador. Si se sirve desde otro host, se añade ese origen a `ALLOWED_ORIGINS` separado por comas.

En la máquina donde se construye la PWA, configurar:

```bash
VITE_PERSISTENCE_API_URL=http://100.x.x.x:8787
npm run build
```

En producción se usa HTTPS dentro de Tailscale con `tailscale serve` (certificado de `ts.net`, solo accesible desde la tailnet, sin `funnel`):

```bash
# Una vez, en la Pi (con "HTTPS Certificates" activo en la consola de Tailscale):
sudo tailscale set --operator=$USER
tailscale serve --bg 8787        # https://raspberrypi.tail6f4cba.ts.net -> 127.0.0.1:8787
tailscale serve status
```

- Vercel: `VITE_PERSISTENCE_API_URL=https://raspberrypi.tail6f4cba.ts.net` (se incrusta en el build; tras cambiarla, redeploy).
- Pi: `ALLOWED_ORIGINS=https://alxns-hub.vercel.app,http://localhost:5173` en el `.env` de la raíz del repo y recrear el contenedor con `--env-file .env`.
- Cada dispositivo (PC, móvil) necesita Tailscale activo: el navegador es quien llama a la API, no Vercel.
- Desde la propia Pi no se puede probar ese dominio (`nginx-proxy-manager` ocupa el `:443` local); probarlo desde otro dispositivo de la tailnet.

No se deben incluir credenciales de base de datos en `VITE_*`.

## Verificación inicial

Desde un dispositivo conectado a Tailscale:

```bash
curl http://100.x.x.x:8787/health
```

La respuesta esperada es JSON con `status: "ok"`. Después se debe abrir la PWA, crear un reto y un enlace, recargar y comprobar que siguen disponibles desde el dispositivo cliente `100.y.y.y`.

## Métricas de la Raspberry (`REQ-011`)

La API sirve `GET /api/pi/metrics` leyendo Prometheus (ya desplegado en la Pi con `node-exporter`) y un `docker-proxy` de solo lectura incluido en el mismo Compose. No requiere cambios en el stack `monitorizacion`: la API llega a Prometheus por `host.docker.internal` (`extra_hosts: host-gateway`) porque `:9090` está publicado en el host.

```bash
# En la Raspberry, tras git pull (mismo --env-file con el que se creó el contenedor):
docker cp ci-cd-alxns-persistence-1:/app/data ~/backups/alxns-data-$(date +%Y%m%d-%H%M%S)
docker compose --env-file .env -f docs/ci-cd/docker-compose.yml up -d --build
docker compose --env-file .env -f docs/ci-cd/docker-compose.yml ps
curl http://100.x.x.x:8787/api/pi/metrics
```

Contrastar el resultado con `vcgencmd measure_temp`, `free -m`, `df -h /` y `docker ps`. Para probar la degradación, parar `prometheus` unos segundos: `sources.prometheus` pasa a `unreachable` y los contenedores siguen apareciendo.

Seguridad: el proxy solo permite `GET /containers` (`CONTAINERS=1`, `POST=0`), no publica puertos y monta `docker.sock` en solo lectura. Endurecimiento opcional posterior: unir la API a la red `monitorizacion_monitor-net` y dejar de publicar `:9090` en la LAN.

## Pendientes antes de producción

- [x] Ejecutar el backend como contenedor Docker con reinicio automático.
- [BLOQUEADO] Configurar ACL de Tailscale para permitir solo los dispositivos necesarios.
- [BLOQUEADO] Definir backup, retención y prueba de restauración de SQLite.
- [x] `ALLOWED_ORIGINS` del `.env` de la Pi igualado con el del contenedor (`https://alxns-hub.vercel.app,http://localhost:5173`), verificado el 2026-11-11.
- [BLOQUEADO] Añadir autenticación técnica adicional si la tailnet deja de ser el único perímetro.
