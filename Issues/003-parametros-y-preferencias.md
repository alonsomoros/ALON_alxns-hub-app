# Parámetros y preferencias

- **Estado:** Hecho (pantalla de ajustes pospuesta)
- **REQ:** REQ-003
- **Tipo:** architecture
- **Área:** `src/data/dashboardData.ts`, `src/types/dashboard.ts`, `docs/arquitectura/ui-preferences.md`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

Hay decisiones de presentación que deben ser configurables, pero una pantalla de ajustes temprana añadiría ruido a la primera impresión.

## Decisión

`DashboardConfig` tipado y separado de los datos: `theme: soft`, `mode: light`, `quote: random`, `orderServices` y `raspberryPiStatsShowcase: pbar`. Los componentes aceptan estas opciones. La pantalla pública de preferencias queda pospuesta. Contrato en [`ui-preferences.md`](../docs/arquitectura/ui-preferences.md).

## Criterios de aceptación

- [x] Configuración tipada separada de los datos.
- [x] Sin pantalla de ajustes en la primera iteración.
- [x] La app envía `preferences` a la API de persistencia (`REQ-018`).

## Verificación

`npm run lint` y `npm run build` OK. Test de preferencias: Omitido: no existe runner (`REQ-020`).

## Impacto documental

Sin cambio posterior.

## Pendientes

- [ ] La app guarda las preferencias en la API pero no las lee de vuelta; decidirlo junto con la pantalla de preferencias → backlog.
- [ ] Pantalla de preferencias → backlog.
