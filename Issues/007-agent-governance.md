# Gobierno del flujo de agentes

- **Estado:** Hecho (rediseñado en `REQ-019`)
- **REQ:** REQ-007
- **Tipo:** docs
- **Área:** `AGENTS.md`, `WORKFLOW.md`, `CODE_STANDARD.md`, `context/`
- **GitHub:** [#7](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/7)
- **Actualizada:** 2026-11-11

## Problema

Las reglas exigían documentar, pero no definían orden de lectura, dueño de cada hecho, matriz de impacto ni gates de entrega.

## Decisión

Separar responsabilidades: `AGENTS.md` enruta, `WORKFLOW.md` define el proceso, `CODE_STANDARD.md` el código y los tests, `context/` el índice, la visión y el estilo, e `Issues/` la trazabilidad. No se crea ADR: es una regla de proceso. Los defectos de esta primera versión (lectura obligatoria duplicada en cuatro archivos, referencia a una sección inexistente, cierre siempre dependiente del desarrollador) se corrigen en `REQ-019`.

## Criterios de aceptación

- [x] Dueño único por tipo de hecho.
- [x] Matriz de impacto documental.
- [x] Gate de cierre.

## Verificación

Lectura cruzada de las reglas; lint y build OK.

## Impacto documental

Sustituido en parte por `REQ-019`.

## Pendientes

Ninguno propio.
