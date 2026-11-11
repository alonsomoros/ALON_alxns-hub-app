# Persistencia personal multidispositivo

- **Estado:** En curso (implementación validada; despliegue en Raspberry bloqueado)
- **REQ:** REQ-018
- **Tipo:** feat
- **Área:** `server/index.js`, `src/infrastructure/persistence.ts`, `src/hooks/usePersistedDashboard.ts`, `Dockerfile.persistence`, `docs/ci-cd/docker-compose.yml`
- **GitHub:** [#18](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/18)
- **Actualizada:** 2026-11-11

## Problema

La app es personal y no necesita cuentas ni login, pero preferencias, retos, historial y enlaces deben sobrevivir al cierre de la PWA y estar disponibles desde varios dispositivos.

## Decisión

"Sin login de la app" no significa "sin control de acceso": el perímetro es la red privada.

- API HTTP nativa de Node 22 con SQLite (`node:sqlite`) en la Raspberry, empaquetada en `Dockerfile.persistence` y desplegada con `docs/ci-cd/docker-compose.yml` (volumen `alxns-persistence-data`, reinicio automático).
- Acceso solo por Tailscale; la API no se expone a Internet. Las IP reales no se guardan en el repositorio.
- Contrato: `GET /health`, `GET /api/state`, `PUT /api/state` con versión optimista y `409` ante conflicto.
- El cliente usa el adaptador `persistence.ts` con timeout de 1.5 s, caché en `localStorage` y estados `Sincronizado`/`Conectando`/`Solo local`/`OFFLINE`. Sin `VITE_PERSISTENCE_API_URL` la app arranca con los datos de prototipo.
- Datos persistidos: preferencias, retos con historial y enlaces con orden. Métricas, healthchecks, citas y Grafana no se persisten.

Alternativas descartadas: PostgreSQL en la Raspberry (operación innecesaria), Supabase (exige backend intermedio o secreto compartido para evitar login) y sincronización directa entre navegadores (no fiable). Detalle de arquitectura en [`persistencia-personal.md`](../docs/arquitectura/persistencia-personal.md) y de despliegue en [`deploy-persistencia-raspberry.md`](../docs/arquitectura/deploy-persistencia-raspberry.md).

## Criterios de aceptación

- [x] Esquema SQLite y endpoints `health`, `GET`/`PUT /api/state`.
- [x] Adaptador con timeout de 1.5 s y fallback.
- [x] Caché local del último estado y control optimista de conflictos.
- [x] Backend en Docker Compose con volumen y reinicio automático.
- [x] HTTPS y URL definitiva: `tailscale serve` en `https://raspberrypi.tail6f4cba.ts.net` con CORS para `https://alxns-hub.vercel.app` (2026-11-11).
- [ ] [BLOQUEADO] ACL de Tailscale.
- [ ] [BLOQUEADO] Backup, retención y restauración verificada del volumen.
- [ ] E2E de persistencia desde dos dispositivos (PC y móvil ya tienen Tailscale; falta ejecutarlo y documentarlo).

## Verificación

| Check | Resultado |
|---|---|
| `docker compose -f docs/ci-cd/docker-compose.yml config` | OK |
| `npm run lint` / `npm run build` | OK |
| `node --check server/index.js` | OK |
| Smoke manual: lectura, escritura, versión y conflicto `409` | OK |
| `docker compose up -d --build` en Docker local, healthcheck y escritura/lectura | OK |
| Tests automáticos (`REQ-018 ...`) | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Actualizados: `docs/requisitos/` (FR-10 a FR-13, RNF-01 a RNF-10), `docs/arquitectura/{system-architecture,persistencia-personal,deploy-persistencia-raspberry}.md`, `.env.example`. Sin cambio: `integrations-n8n-grafana.md`.

## Pendientes

- [x] Desplegado en la Raspberry (contenedor `healthy`) y accesible desde la PWA de Vercel en PC y móvil.
- [ ] [BLOQUEADO] ACL, backup con retención y restauración verificada (hay una copia manual del 2026-11-11 en `~/backups`).
- [x] Tests de contrato de la API y de conflicto `409` (`tests/api.test.ts`).
- [ ] Corregir `archived: false` fijo al enviar enlaces y decidir si se leen las preferencias → backlog.
- [ ] Migraciones futuras del esquema → backlog.

La nota pasa a `Hecho` cuando el despliegue y el backup estén verificados.
