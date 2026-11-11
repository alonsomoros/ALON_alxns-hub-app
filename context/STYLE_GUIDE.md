# Style guide

## Escritura

- Idioma del repositorio: español; nombres de código siguen las convenciones del lenguaje.
- Redacción breve, verificable y sin afirmar planes como si fueran comportamiento implementado.
- Usar `[TODO]` para desconocidos y `[BLOQUEADO]` para dependencias externas no disponibles.
- No duplicar hechos: enlazar al documento dueño.

## Identificadores

- Requisitos: `REQ-NNN`, igual al número de su nota `Issues/NNN-slug.md`, que es el registro único (índice en `Issues/README.md`). Los requisitos funcionales de producto son `FR-xx` y enlazan a su `REQ`.
- Issues: número real devuelto por `gh` y anotado en la nota; la nota local es la fuente de verdad y no se inventa `#N`.
- Estados de nota: `Propuesta`, `En curso`, `Hecho`, `Bloqueado`, `Descartado`.
- Decisiones de arquitectura: solo ADR aprobado; una propuesta va a `Issues/` hasta aprobarse.

## Referencias

Las referencias deben usar rutas relativas existentes. Cada documento de análisis incluye evidencia. Los diagramas marcan `IMPLEMENTADO`, `PREPARADO` o `PENDIENTE` y no presentan intención como hecho.
