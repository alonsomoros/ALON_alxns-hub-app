# Enlaces responsive y ordenación

- **Estado:** Hecho
- **REQ:** REQ-001
- **Tipo:** fix
- **Área:** `src/components/links/`, `src/index.css`
- **GitHub:** [#1](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/1)
- **Actualizada:** 2026-11-11

## Problema

La vista de enlaces producía scroll horizontal en pantallas pequeñas y cada fila tenía demasiados controles. El alcance admite como máximo 10 enlaces, por lo que la edición debe ser rápida y legible.

## Decisión

Fila compacta con icono, nombre, URL truncada, apertura, borrado y un único asa de arrastre; se eliminan las flechas duplicadas. El ancho es fluido con `min-width: 0` y truncado de texto. La reordenación vive en el estado del dashboard y no acopla la vista a la persistencia. La mejora de arrastre y teclado se completó en `REQ-009`.

## Criterios de aceptación

- [x] Sin scroll horizontal en móvil.
- [x] Un único control de ordenación por fila.
- [x] El orden se persiste cuando `VITE_PERSISTENCE_API_URL` está configurada (`REQ-018`).

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` / `npm run build` | OK en la entrega original |
| Pruebas de accesibilidad y flujo móvil | Omitido: no existe runner (`REQ-020`) |

## Impacto documental

Sin cambio posterior: el contrato vive en `docs/requisitos/functional-requirements.md` (FR-06).

## Pendientes

- [ ] Pruebas de accesibilidad y flujo móvil → `REQ-020`.
