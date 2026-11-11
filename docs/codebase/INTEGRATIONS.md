# Integrations

## Integration inventory

| System | Type | Purpose | Auth | Criticality | Evidence |
|---|---|---|---|---|---|
| Quotable | HTTPS API | Cita aleatoria | No configurada en codigo | Baja; tiene fallback | `src/hooks/useQuote.ts` |
| n8n | HTTPS webhook | Metricas Pi y healthchecks futuros | `[TODO]` | Media; no implementado | `docs/arquitectura/integrations-n8n-grafana.md` |
| Grafana | Dashboard externo | Detalle historico futuro | URL/config futura | Baja para shell actual | `docs/arquitectura/integrations-n8n-grafana.md` |
| Servicios publicados | HTTPS links | Sitios clicables y healthchecks futuros | No configurada | Baja para shell actual | `src/data/dashboardData.ts` |

## Data stores

No hay base de datos ni store persistente implementado. El estado de enlaces, cita y vista vive en memoria React. `localStorage`/IndexedDB quedan `[TODO]` segun backlog.

## Secrets

Las variables previstas son `N8N_METRICS_URL`, `N8N_HEALTHCHECK_URL` y `GRAFANA_URL`; el documento de entorno indica que no deben entrar en el bundle. No hay lectura de esas variables en `src/` actualmente.

## Reliability

La cita usa `AbortController` para cancelar al desmontar y fallback local ante error. El timeout de 1.5 s y estados `OFFLINE`/`UNREACHABLE` estan documentados como objetivo, no implementados en el runtime actual.

## Observability

No hay logging, metricas ni tracing de integraciones. `[TODO]` definir visibilidad cuando se incorporen adaptadores.

## Evidence

- `src/hooks/useQuote.ts`
- `src/data/dashboardData.ts`
- `.agents/context/environment-vars.md`
- `docs/arquitectura/integrations-n8n-grafana.md`
