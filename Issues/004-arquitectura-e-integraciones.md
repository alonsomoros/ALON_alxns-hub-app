# Arquitectura e integraciones

- **Estado:** En curso (nota marco)
- **REQ:** REQ-004
- **Tipo:** architecture
- **Área:** `docs/arquitectura/`, `src/hooks/`, `src/infrastructure/`
- **GitHub:** [#4](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/4)
- **Actualizada:** 2026-11-11

## Problema

El dashboard valida la experiencia antes de conectar n8n, Grafana y healthchecks. Las peticiones externas no deben bloquear la interfaz.

## Decisión

Separar presentación, dominio, preferencias, integración e infraestructura. Los widgets consumirán adaptadores tipados con timeout de 1.5 s, fallback local y estados `OFFLINE`/`UNREACHABLE`. La persistencia ya sigue este patrón (`REQ-018`, `src/infrastructure/persistence.ts`). La cita sigue con `fetch` directo y sin timeout: es la divergencia conocida.

Esta nota sigue `En curso` mientras existan integraciones sin adaptador; cada una se abre como nota propia al empezarla.

## Criterios de aceptación

- [x] La UI no depende de la red para el primer render.
- [x] Persistencia detrás de adaptador con timeout de 1.5 s.
- [x] Cita detrás de adaptador con timeout de 1.5 s (`REQ-021`); el modo `fav` queda en el backlog.
- [ ] Métricas Raspberry (`REQ-011`), healthchecks (`REQ-022`) y enlace a Grafana detrás de adaptadores; falta Grafana.

## Verificación

Persistencia validada en `REQ-018`. El resto está pendiente.

## Impacto documental

`docs/arquitectura/system-architecture.md`, `docs/arquitectura/integrations-n8n-grafana.md` y `docs/codebase/INTEGRATIONS.md`.

## Pendientes

- [x] Adaptador de cita → `REQ-021`.
- [ ] Adaptador n8n/Pi → `REQ-011`.
- [x] Healthchecks reales → `REQ-022`.
- [ ] Enlace a Grafana → backlog.
- [ ] Notificaciones de degradación → backlog.
