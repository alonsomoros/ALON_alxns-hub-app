# Revisión global de código y branding

- **Estado:** Hecho (todos los hallazgos resueltos)
- **REQ:** REQ-012
- **Tipo:** chore
- **Área:** transversal
- **GitHub:** [#12](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/12)
- **Actualizada:** 2026-11-11

## Problema

Tras la primera toma de producto (dashboard, retos, enlaces) había inconsistencias de marca, datos, estructura y fecha que convenía priorizar.

## Hallazgos y resolución

| # | Hallazgo | Resuelto en |
|---|---|---|
| 1 | Marca `AX` hardcodeada en lugar del logo real | `REQ-013` |
| 2 | Datos de muestra mezclados con el producto | `REQ-014` |
| 3 | `QuickLink.logoUrl` no se usaba de forma consistente | `REQ-015` |
| 4 | Dependencia de Google Favicons (privacidad, disponibilidad) | Aceptado; override manual y cambio de proveedor en backlog |
| 5 | `App.tsx` demasiado denso | `REQ-016` |
| 6 | Fecha literal en Inicio | `REQ-017` |
| 7 | Validación lint/build | Ejecutada y correcta |

## Decisión

Nota cerrada. La checklist reutilizable de revisión vive en `.agents/skills/code-review.md`; esta nota solo conserva el mapa hallazgo → resolución.

## Criterios de aceptación

- [x] Hallazgos documentados y priorizados.
- [x] Hallazgos 1, 2, 3, 5 y 6 resueltos.
- [ ] Hallazgo 4: [BLOQUEADO] requiere decisión de privacidad → backlog.

## Verificación

`npm run lint` y `npm run build` OK en la revisión original.

## Impacto documental

Sin cambio: los detalles viven en las notas 013-017.

## Pendientes

- [ ] Proveedor de favicon o logo manual → backlog.
