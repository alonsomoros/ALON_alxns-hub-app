# Separar datos mock y configuración real

- **Estado:** Hecho (implementado con `REQ-016`)
- **REQ:** REQ-014
- **Tipo:** refactor
- **Área:** `src/data/dashboardData.ts`
- **GitHub:** [#14](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/14)
- **Actualizada:** 2026-11-11

## Problema

La app mezclaba métricas, servicios, citas y textos de ejemplo con la lógica de render, lo que oculta el estado real del producto y dificulta pasar a APIs reales.

## Decisión

Los datos de prototipo y la configuración viven en `src/data/dashboardData.ts`, marcados con un comentario `Datos de prototipo`. Son sustituibles por adaptadores sin tocar las vistas; los retos y enlaces se sobrescriben con los datos persistidos cuando `VITE_PERSISTENCE_API_URL` está configurada (`REQ-018`).

## Criterios de aceptación

- [x] El código de render no contiene datos de prueba.
- [x] La fuente de datos del dashboard está documentada (`docs/codebase/STRUCTURE.md`).
- [x] La app funciona sin servicios externos.

## Verificación

`npm run lint` y `npm run build` OK en `REQ-016`.

## Impacto documental

`docs/codebase/{STRUCTURE,ARCHITECTURE}.md` (entregado en `REQ-016`).

## Pendientes

- [ ] Decidir si los datos de prototipo se mantienen como adaptador por defecto o se eliminan cuando existan integraciones reales → junto a `REQ-004`.
