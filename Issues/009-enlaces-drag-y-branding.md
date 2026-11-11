# Enlaces arrastrables y logo remoto

- **Estado:** Hecho
- **REQ:** REQ-009
- **Tipo:** fix
- **Área:** `src/components/links/`, `src/domain/links.ts`, `src/utils/brandLogo.ts`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

El arrastre nativo sobre la fila era inconsistente en táctil y sin teclado, y los enlaces usaban iconos estáticos aunque se quería identificar cada web por su logo.

## Decisión

- La identidad del arrastre es el `id`, no el índice.
- El reordenado es una operación pura (`src/domain/links.ts`) activable por arrastre y por teclado (`ArrowUp`/`ArrowDown`, `EditableLinkRow.tsx`).
- El logo usa un favicon del dominio con fallback a icono; la resolución está centralizada en `REQ-015`.
- Fila compacta sin overflow horizontal.

## Criterios de aceptación

- [x] Reordenado estable por `id` con arrastre y teclado.
- [x] Logo remoto con estados `loading`/`ready`/`fallback` sin bloquear la UI.
- [x] Sin scroll horizontal.
- [ ] Validar la experiencia táctil en la PWA instalada → `REQ-020`.

## Verificación

`npm run lint` y `npm run build` OK. Tests de caja negra: Omitido: no existe runner (`REQ-020`).

## Impacto documental

`docs/requisitos/functional-requirements.md` (FR-04, FR-06).

## Pendientes

- [ ] Override manual de logo o proveedor alternativo; cambiar el proveedor requiere una decisión de privacidad → backlog.
