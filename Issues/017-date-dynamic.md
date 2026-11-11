# Fecha dinámica en la pantalla principal

- **Estado:** Hecho
- **REQ:** REQ-017
- **Tipo:** fix
- **Área:** `src/utils/date.ts`, `src/components/home/HomeView.tsx`
- **GitHub:** [#17](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/17)
- **Actualizada:** 2026-11-11

## Problema

La fecha de Inicio estaba fija (`27 de octubre de 2026`) en lugar de reflejar el día real del usuario.

## Decisión

`src/utils/date.ts` formatea `Date.now()` con `Intl.DateTimeFormat('es-ES', { day, month: 'long', year })` en la zona horaria local. `HomeView` la calcula al montarse (inicializador de `useState`) para no llamar a una función impura durante el render. El locale queda fijo en `es-ES` porque la UI está en español.

## Criterios de aceptación

- [x] La fecha cambia con el día real del sistema.
- [x] La pantalla no muestra una fecha falsa.
- [x] Funciona en distintas zonas horarias.

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` | OK |
| Typecheck y `vite build` | OK |
| Visual | Inicio muestra la fecha del sistema |
| Tests de caja negra | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Sin cambio: requisitos funcionales y diagramas, porque solo cambia el origen del dato.

## Pendientes

- [x] La fecha se refresca sola en la medianoche local y al volver a la pestaña (`useToday`, `msUntilNextDay` con `tests/date.test.ts`); comprobado en Chrome adelantando el reloj 36 h (2026-11-11).
