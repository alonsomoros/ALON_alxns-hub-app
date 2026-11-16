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

El compose monta el volumen Docker `alxns-persistence-data` en `/app/data`, publica la API solo en `127.0.0.1:8787` de la Raspberry (`REQ-023`; no es alcanzable desde la LAN, solo por `tailscale serve`) y reinicia el contenedor automáticamente. No se usa `systemd`.

Para revisar el estado:

```bash
docker compose -f docs/ci-cd/docker-compose.yml ps
docker compose -f docs/ci-cd/docker-compose.yml logs --tail=100 alxns-persistence
```

Para servir la PWA desde la propia Raspberry, el origen debe ser la URL que realmente use el navegador. Si se sirve desde otro host, se añade ese origen a `ALLOWED_ORIGINS` separado por comas.

En la máquina donde se construye la PWA, configurar:

```bash
VITE_PERSISTENCE_API_URL=https://raspberrypi.tail6f4cba.ts.net
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
curl https://raspberrypi.tail6f4cba.ts.net/health
```

Desde la propia Pi: `curl http://127.0.0.1:8787/health`. Desde otro equipo de la LAN, `http://raspberrypi.local:8787` debe rechazar la conexión.

La respuesta esperada es JSON con `status: "ok"`. Después se debe abrir la PWA, crear un reto y un enlace, recargar y comprobar que siguen disponibles desde el dispositivo cliente `100.y.y.y`.

## Métricas de la Raspberry (`REQ-011`)

La API sirve `GET /api/pi/metrics` leyendo Prometheus (ya desplegado en la Pi con `node-exporter`) y un `docker-proxy` de solo lectura incluido en el mismo Compose. No requiere cambios en el stack `monitorizacion`: la API llega a Prometheus por `host.docker.internal` (`extra_hosts: host-gateway`) porque `:9090` está publicado en el host.

```bash
# En la Raspberry, tras git pull (mismo --env-file con el que se creó el contenedor):
docker cp ci-cd-alxns-persistence-1:/app/data ~/backups/alxns-data-$(date +%Y%m%d-%H%M%S)
docker compose --env-file .env -f docs/ci-cd/docker-compose.yml up -d --build
docker compose --env-file .env -f docs/ci-cd/docker-compose.yml ps
curl https://raspberrypi.tail6f4cba.ts.net/api/pi/metrics
```

Contrastar el resultado con `vcgencmd measure_temp`, `free -m`, `df -h /` y `docker ps`. Para probar la degradación, parar `prometheus` unos segundos: `sources.prometheus` pasa a `unreachable` y los contenedores siguen apareciendo.

Seguridad: el proxy solo permite `GET /containers` (`CONTAINERS=1`, `POST=0`), no publica puertos y monta `docker.sock` en solo lectura. Endurecimiento opcional posterior: unir la API a la red `monitorizacion_monitor-net` y dejar de publicar `:9090` en la LAN.

## Chat de consultas (`REQ-024`)

El chat habla directo con `selfbank` (otro repositorio): este repositorio no despliega nada en la Pi para él. Lo que tiene que existir, y lo hace el dueño del servicio:

1. Servicio real de `selfbank` en `127.0.0.1:8789`, token en un fichero con permisos 600; la sincronización periódica de datos la despliega `selfbank` (su `docs/despliegue-sync.md`). Corre como servicio de `systemd` (reinicio automático): ver [`REQ-026`](../../Issues/026-selfbank-systemd.md) y la sección siguiente; `~/run-selfbank-real.sh` queda solo como marcha atrás.
2. Publicarlo en su propio puerto de `tailscale serve` (propuesta: `tailscale serve --bg --https=8444 http://127.0.0.1:8789`; el 8443 es el simulado de desarrollo). Sin Funnel.
3. Arrancarlo con `--cors-origin https://alxns-hub.vercel.app --cors-origin http://localhost:5173` y hacer que sus respuestas lleven `Access-Control-Expose-Headers: Retry-After`: sin esa cabecera el navegador no puede leer `Retry-After` entre orígenes y el aviso de «ocupado» usa siempre 10 s (no impide usar el chat).
4. Vercel: variable `VITE_SELFBANK_URL=https://raspberrypi.tail6f4cba.ts.net:8444` y redeploy (se incrusta al compilar; es una URL pública, no un secreto).

Comprobaciones desde un dispositivo de la tailnet (sin pegar el token en chats ni commits):

```bash
curl -s https://raspberrypi.tail6f4cba.ts.net:8444/api/health                     # {"ok": true}, sin token
curl -s -o /dev/null -w "%{http_code}\n" https://raspberrypi.tail6f4cba.ts.net:8444/api/status   # 401 sin token
curl -si -H "Origin: https://alxns-hub.vercel.app" https://raspberrypi.tail6f4cba.ts.net:8444/api/health | grep -i access-control-allow-origin
```

Después, abrir la PWA de Vercel, entrar en «Consultas», escribir el token, pulsar una sugerencia y comprobar que la interpretación se ve y que «No era eso» responde. Marcha atrás: `tailscale serve --https=8444 off` y quitar `VITE_SELFBANK_URL` (la pestaña desaparece).

### `selfbank` como servicio de `systemd` (`REQ-026`)

Una unidad de `systemd` es un archivo que le dice a la Pi «arranca este programa al encender y vuelve a lanzarlo si se cae». Sin ella, tras reiniciar la Pi hay que ejecutar `~/run-selfbank-real.sh` a mano. La unidad está en [`docs/ci-cd/selfbank-real.service`](../ci-cd/selfbank-real.service) (usuario `alonso`, código en `~/selfbank-dev`; solo puede escribir en `~/.selfbank`). Instalación, por SSH en la Pi:

```bash
cd ~/ALON_alxns-hub-app && git pull --ff-only
sudo cp docs/ci-cd/selfbank-real.service /etc/systemd/system/
kill "$(cat /tmp/selfbank-real.pid)"                  # para el proceso lanzado con el script (usa el mismo puerto)
sudo systemctl daemon-reload
sudo systemctl enable --now selfbank-real
systemctl status selfbank-real --no-pager             # active (running)
curl -s http://127.0.0.1:8789/api/health              # {"ok": true}
```

Comprobación completa: `sudo reboot` y, al volver la Pi, `systemctl is-active selfbank-real` debe decir `active` sin tocar nada. Registro: `journalctl -u selfbank-real -n 30 --no-pager`. Marcha atrás: `sudo systemctl disable --now selfbank-real` y `~/run-selfbank-real.sh`. Si se cambia la unidad (orígenes CORS, puerto), repetir `cp` + `daemon-reload` + `systemctl restart selfbank-real`.

### Token de `selfbank`

- **Dónde está:** `~/.selfbank/api-token` en la Pi (permisos 600, lo crea `run-selfbank-real.sh` la primera vez con `openssl rand -hex 32`). El servicio lo lee de ese archivo; nunca va en la línea de comandos, en el repositorio ni en Vercel.
- **Cómo se ve:** por SSH, `cat ~/.selfbank/api-token`. No pegarlo en chats, commits ni capturas.
- **Cómo se usa:** la pestaña «Consultas» lo pide al abrirla y lo guarda solo mientras dura la pestaña (`sessionStorage`); al cerrarla hay que volver a escribirlo. «Cambiar token» (en la propia pestaña) lo olvida. Para escribirlo en el móvil sin SSH, guardarlo una vez en el gestor de contraseñas.
- **Cómo se cambia (rotación):** si se filtra o se pierde un dispositivo, `rm ~/.selfbank/api-token` y reiniciar el servicio (`sudo systemctl restart selfbank-real`, o `~/run-selfbank-real.sh` si aún no usa `systemd`): genera uno nuevo con `run-selfbank-real.sh`; con `systemd` y sin el script, crearlo antes con `( umask 077; openssl rand -hex 32 > ~/.selfbank/api-token )`. El token anterior deja de valer al reiniciar.
- **Quién puede llegar a él:** solo dispositivos de la tailnet; el token es la segunda barrera. Sin Tailscale activo, «Consultas» no responde aunque se conozca el token.

## Pendientes antes de producción

- [x] Ejecutar el backend como contenedor Docker con reinicio automático.
- [x] Desplegar `REQ-023` (API solo en loopback) y comprobar que `:8787` ya no responde por la LAN (2026-11-16).
- [x] Vercel (hecho 2026-11-16): `VITE_PERSISTENCE_API_URL=https://raspberrypi.tail6f4cba.ts.net` (no la IP `100.x` con `:8787`, que ya no responde) y redesplegar, porque se incrusta al compilar (`REQ-023`).
- [BLOQUEADO] Configurar ACL de Tailscale para permitir solo los dispositivos necesarios.
- [BLOQUEADO] Definir backup, retención y prueba de restauración de SQLite.
- [x] `ALLOWED_ORIGINS` del `.env` de la Pi igualado con el del contenedor (`https://alxns-hub.vercel.app,http://localhost:5173`), verificado el 2026-11-11.
- [BLOQUEADO] Añadir autenticación técnica adicional si la tailnet deja de ser el único perímetro.
