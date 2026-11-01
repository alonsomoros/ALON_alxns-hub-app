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

En producción se recomienda HTTPS aunque el tráfico vaya dentro de Tailscale. No se deben incluir credenciales de base de datos en `VITE_*`.

## Verificación inicial

Desde un dispositivo conectado a Tailscale:

```bash
curl http://100.x.x.x:8787/health
```

La respuesta esperada es JSON con `status: "ok"`. Después se debe abrir la PWA, crear un reto y un enlace, recargar y comprobar que siguen disponibles desde el dispositivo cliente `100.y.y.y`.

## Pendientes antes de producción

- [x] Ejecutar el backend como contenedor Docker con reinicio automático.
- [BLOQUEADO] Configurar ACL de Tailscale para permitir solo los dispositivos necesarios.
- [BLOQUEADO] Definir backup, retención y prueba de restauración de SQLite.
- [BLOQUEADO] Servir la PWA por HTTPS y revisar el origen CORS final.
- [BLOQUEADO] Añadir autenticación técnica adicional si la tailnet deja de ser el único perímetro.
