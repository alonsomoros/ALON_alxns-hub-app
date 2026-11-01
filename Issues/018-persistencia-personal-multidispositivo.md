# Propuesta: persistencia personal multidispositivo

## Estado

Implementación inicial validada. Requisito: `REQ-018`.

## Problema

La app es personal y no necesita cuentas ni una pantalla de login, pero los parámetros, retos, historial y enlaces deben sobrevivir al cierre de la PWA y estar disponibles desde varios dispositivos. El estado actual vive en memoria y el navegador local no sincroniza por sí solo entre dispositivos.

## Decisión adoptada

Mantener la ausencia de autenticación visible para el usuario, pero proteger el transporte mediante una red privada de acceso entre dispositivos. La primera alternativa recomendada es:

- API pequeña y tipada desplegada en la Raspberry junto a los servicios existentes.
- Base de datos local en la Raspberry, preferiblemente SQLite con copias de seguridad.
- Acceso desde los dispositivos mediante una red privada como Tailscale; la API no se expone directamente a Internet.
- El cliente consume un adaptador de persistencia, con caché local para arranque y uso degradado.
- La configuración remota se resuelve por variables de entorno o configuración de despliegue, nunca con secretos en el bundle PWA.

La Raspberry usa una API HTTP nativa de Node y SQLite mediante `node:sqlite`, empaquetada en `Dockerfile.persistence` y desplegada con `docs/ci-cd/docker-compose.yml`. El contenedor escucha por defecto en `0.0.0.0:8787`, persiste `/app/data` en un volumen Docker y la PWA apunta a la IP de Tailscale configurada mediante `VITE_PERSISTENCE_API_URL`. Las IPs concretas se mantienen fuera del repositorio.

Esto significa “sin login de la app”, no “sin control de acceso”: la identidad de la red privada es el perímetro de seguridad.

## Datos incluidos

- Preferencias y parámetros: tema, modo, fuente de cita, orden de servicios y presentación de métricas.
- Retos: datos editables, estado archivado y snapshots del historial.
- Enlaces: URL, título, icono/fallback, estado archivado y orden.

Las métricas de Raspberry, healthchecks, citas y Grafana mantienen sus contratos de integración actuales y no se convierten automáticamente en datos persistidos de usuario.

## Alternativas

1. **Raspberry + SQLite + red privada (recomendada):** control, privacidad, coste bajo y dependencia operativa concentrada en la infraestructura propia.
2. **Raspberry + PostgreSQL:** adecuada si el volumen o las consultas crecen, pero añade operación innecesaria para este alcance.
3. **Supabase:** reduce el trabajo de API y copias, pero para evitar login habría que proteger el acceso por red, usar un backend intermedio o aceptar un secreto compartido; la clave pública por sí sola no protege datos personales.
4. **Sincronización directa entre navegadores:** no resuelve acceso multidispositivo de forma fiable y no se considera suficiente.

## Reglas de seguridad y disponibilidad

- No exponer SQLite, credenciales de base de datos ni una service role key al navegador.
- No guardar secretos en `localStorage`, el bundle ni el repositorio.
- La PWA debe arrancar con la última caché válida y mostrar `OFFLINE` o `UNREACHABLE` si la API no responde en 1.5 s.
- Las escrituras deben ser idempotentes o incluir versión/updatedAt para detectar conflictos.
- La API debe validar esquema, tamaño y límites de cada colección.
- La Raspberry debe tener copias de seguridad verificables antes de considerar la persistencia lista.

## Criterios de aceptación documental

- `REQ-018` enlaza requisitos funcionales y no funcionales con esta propuesta.
- La arquitectura distingue cliente, adaptador, API, almacenamiento y perímetro de red.
- Quedan enumerados los pendientes de producción: HTTPS, ubicación final, backups, restauración y migraciones futuras.
- No se añaden variables reales ni credenciales al repositorio; el contenedor y sus valores de despliegue se configuran mediante Compose y archivos locales ignorados.

## Pendientes

- [x] Confirmar Tailscale como perímetro y registrar las IPs de la Raspberry y del móvil.
- [x] Elegir Node.js 22.5+ con `node:sqlite` y API HTTP nativa como runtime inicial.
- [x] Implementar esquema SQLite, `GET /health`, `GET /api/state` y `PUT /api/state`.
- [x] Implementar adaptador frontend con timeout de 1.5 s y fallback en memoria.
- [x] Ejecutar el backend en Docker Compose con volumen persistente y reinicio automático.
- [BLOQUEADO] Configurar ACL, HTTPS y backup del volumen Docker en la Raspberry.
- [BLOQUEADO] Definir dominio/URL interna, backup y recuperación.
- [x] Diseñar e implementar el contrato HTTP inicial y migración desde defaults en memoria.
- [x] Añadir caché local de último estado y control optimista de conflictos.
- [BLOQUEADO] Añadir cobertura E2E desde dos dispositivos y backup/restauración real del volumen.

## Impacto documental

- Actualizados: `docs/requisitos/functional-requirements.md`, `docs/requisitos/backlog-features.md`, `docs/arquitectura/system-architecture.md`, `docs/arquitectura/persistencia-personal.md`, `Issues/README.md`.
- Actualizados: `server/index.js`, `src/infrastructure/persistence.ts`, `src/App.tsx`, `.env.example`, `package.json` y `.gitignore`.
- Añadidos: `Dockerfile.persistence`, `.dockerignore` y configuración Docker Compose en `docs/ci-cd/docker-compose.yml`.
- Actualizado: `docs/arquitectura/deploy-persistencia-raspberry.md` con configuración Docker y Tailscale.
- Sin cambio: `docs/arquitectura/integrations-n8n-grafana.md`, porque sus contratos de telemetría y healthchecks no cambian.
- Sin cierre de issue hasta desplegar, configurar backups y validar desde el móvil.

## Validación de esta iteración

- `docker compose -f docs/ci-cd/docker-compose.yml config`: correcto.
- `npm run lint`: correcto.
- `npm run build`: correcto.
- `node --check server/index.js`: correcto.
- Smoke test manual: lectura, escritura, versión y conflicto `409`: correcto.
- `docker compose --env-file .env -f docs/ci-cd/docker-compose.yml up -d --build`: correcto en Docker local.
- Healthcheck y escritura/lectura contra el contenedor: correcto; los registros temporales fueron retirados del volumen.
