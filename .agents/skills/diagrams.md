---
name: diagrams
description: Crea y mantiene diagramas SVG verificables de arquitectura, pantallas, flujos de datos y entrega para este repositorio.
argument-hint: "Area: architecture, screens, data, delivery or all"
---

# /diagrams

## Objetivo

Documentar visualmente el sistema sin separar el diagrama de la realidad del repositorio. Los SVG se guardan en `docs/diagramas/` y deben poder abrirse directamente en un navegador.

## Flujo

1. Preflight según `WORKFLOW.md` §1 (fila "Diagramas"), más la arquitectura y los requisitos relacionados.
2. Inspeccionar entrypoints, componentes, scripts, integraciones y workflow CI. Distinguir `IMPLEMENTADO`, `PREPARADO` y `PENDIENTE`.
3. Elegir el diagrama solicitado: `architecture`, `screens`, `data`, `delivery` o `all`.
4. Generar SVG accesible con `title`, `desc`, `viewBox` estable, tipografía legible, flechas con marcador y leyenda de estados. Sin imágenes externas ni texto que contradiga el código.
5. Mantener el Mermaid fuente en `docs/diagramas/architecture-diagrams.mmd`; el SVG es la salida visual.
6. Actualizar `docs/codebase/ARCHITECTURE.md` y la nota `Issues/` cuando el diagrama revele una decisión o divergencia nueva.
7. Validar que cada SVG sea XML bien formado, que los ids de los marcadores de flecha existan y que los documentos enlazados existan.

## Convenciones visuales

- Fondo claro, alto contraste y formas simples.
- Verde: implementado; amarillo: preparado; rojo: pendiente o riesgo.
- Flechas para flujo y líneas discontinuas para dependencias futuras.
- El texto describe responsabilidades y contratos, no decora.
- SVG estático y portable; sin JavaScript ni datos sensibles.

## Entrega

Informe de verificación de `WORKFLOW.md` §5, listando los SVG creados o modificados, los documentos actualizados y las divergencias entre intención y realidad. Una relación no demostrada por el código se marca `PENDIENTE` o `[TODO]`.
