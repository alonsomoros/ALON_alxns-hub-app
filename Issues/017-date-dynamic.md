# Fecha dinámica en la pantalla principal

## Problema

La fecha mostrada en la vista de inicio está hardcodeada (`27 de octubre de 2026`), cuando el contenido de la interfaz debería representar el momento actual del usuario.

## Solución propuesta

- Calcular la fecha del sistema con `new Date()`.
- Formatear la fecha con `toLocaleDateString()` usando locale apropiado.
- Mantener el texto de bienvenida como valor actual y no fijo.

## Criterios de aceptación

- La fecha cambia con el día real del sistema.
- La pantalla principal no muestra una fecha falsa o desalineada con el contexto real.
- La UI sigue funcionando en distintas zonas horarias y locales.

## Estado

Implementado (2026-11-11). Requisito: `REQ-017`. Issue de GitHub: [BLOQUEADO] `gh` no está instalado; trazabilidad local.

## Decisión adoptada

`src/utils/date.ts` formatea `Date.now()` con `Intl.DateTimeFormat('es-ES', { day, month: 'long', year })` en la zona horaria local del navegador; `HomeView` la calcula al montarse (inicializador de `useState`, para no llamar a una función impura durante el render). El idioma de la UI es español, así que el locale queda fijo en `es-ES`.

## Validación

- `npm run lint` OK; `tsc 5.9.3 --noEmit` OK; `vite build` OK.
- Visual: Inicio muestra la fecha del sistema.
- Tests de caja negra: Omitido: no existe runner.
- Sin cambio: requisitos funcionales y diagramas, porque solo cambia el origen del dato mostrado.

## Pendiente

- La fecha no se refresca sola si la app queda abierta al cambiar de día; se actualiza al volver a montar Inicio (cambiar de vista o recargar).
- Decidir si la fecha del dashboard debe ser configurable en el futuro para entorno productivo o si se usará únicamente como dato local.
