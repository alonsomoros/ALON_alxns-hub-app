# Retos, racha y edición

- **Estado:** Hecho
- **REQ:** REQ-008
- **Tipo:** feat
- **Área:** `src/domain/goals.ts`, `src/components/goals/`, `src/types/dashboard.ts`
- **GitHub:** [#8](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/8)
- **Actualizada:** 2026-11-11

## Problema

En Inicio la racha aparecía junto a un porcentaje, aunque una racha es una magnitud acumulada y no un progreso. Además, "Nuevo reto" no creaba nada y el botón de ajustes no editaba el reto.

## Decisión

- La racha (`12 días seguidos`) se muestra junto al título de la tarjeta, sin porcentaje; sigue estática en esta fase.
- El reto guarda `current`, `target` y `unit`; el porcentaje se deriva (`current / target`) y se limita visualmente al 100 %, aunque el actual puede superar el objetivo.
- El mismo formulario crea y edita. Validación: título obligatorio, objetivo positivo y actual no negativo.
- Categorías iniciales: Lectura, Movimiento y Aprendizaje.
- Al editar actual u objetivo se conserva un snapshot en `history`.
- Archivar está incluido; eliminar y duplicar quedan fuera.
- Alternativas descartadas: porcentaje editable (permite estados incoherentes) y rango como texto libre (difícil de validar).

## Criterios de aceptación

- [x] Racha sin porcentaje junto al título.
- [x] Alta, edición y archivo de retos.
- [x] Porcentaje derivado y limitado al 100 %.
- [x] Snapshot en el historial al editar.
- [x] Persistencia de retos e historial con la API configurada (`REQ-018`).
- [ ] Tests de caja negra y restauración de historial → `REQ-020`.

## Verificación

`npm run lint` y `npm run build` OK en la entrega original. Tests de caja negra: Omitido: no existe runner (`REQ-020`).

## Impacto documental

`docs/requisitos/functional-requirements.md` (FR-05, FR-09, FR-13); `.agents/skills/habit-tracker-logic.md`.

## Pendientes

- [ ] Tests de `src/domain/goals.ts` con `REQ-008` en el nombre → `REQ-020`.
- [ ] Racha derivada de registros diarios → backlog.
