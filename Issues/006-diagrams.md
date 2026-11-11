# Skill de diagramas y análisis de arquitectura

- **Estado:** Hecho
- **REQ:** REQ-006
- **Tipo:** docs
- **Área:** `.agents/skills/diagrams.md`, `docs/diagramas/`, `docs/codebase/`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

Solo existía un diagrama Mermaid conceptual y ninguna skill para mantener diagramas sincronizados con el código.

## Decisión

Skill `/diagrams` y SVG accesibles y portables en `docs/diagramas/` (arquitectura, pantallas, datos y entrega). Mermaid sigue como fuente textual de arquitectura. Marcado `IMPLEMENTADO`/`PREPARADO`/`PENDIENTE`. Los diagramas se sincronizaron con la persistencia en `REQ-019`.

## Criterios de aceptación

- [x] Cuatro SVG válidos como XML.
- [x] Fuente Mermaid de arquitectura.
- [x] Documentación `docs/codebase/` completada.

## Verificación

XML de los SVG, `npm run lint` y `npm run build` OK en la entrega original.

## Impacto documental

`docs/diagramas/README.md`.

## Pendientes

- [ ] Automatizar la validación XML de los SVG → `REQ-020`.
