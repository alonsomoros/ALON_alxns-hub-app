# Páginas y vistas

- **Estado:** Hecho
- **REQ:** REQ-002
- **Tipo:** feat
- **Área:** `src/components/{home,goals,links}/`, `src/components/Dashboard.tsx`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

El producto necesita una primera impresión sencilla, con navegación clara entre el resumen personal y las áreas editables, sin convertirse en una consola técnica.

## Decisión

Shell PWA con navegación simple y tres vistas: Inicio, Retos y Enlaces. La portada concentra estado, servicios, accesos y progreso; las vistas dedicadas contienen la edición. Ajustes y perfil quedan fuera de la primera impresión. La estructura no asume tres servicios fijos. Tras `REQ-016` cada vista vive en su carpeta de feature.

## Criterios de aceptación

- [x] Navegación entre Inicio, Retos y Enlaces.
- [x] Layout responsive sin overflow.
- [x] Ajustes y perfil ausentes de la primera iteración.

## Verificación

`npm run lint` y `npm run build` OK en la entrega original. Tests de caja negra: Omitido: no existe runner (`REQ-020`).

## Impacto documental

Sin cambio posterior: `docs/diagramas/screens-flow.svg` y FR-02/FR-05/FR-06 ya reflejan las vistas.

## Pendientes

Ninguno propio. La pantalla de preferencias está en el backlog (`docs/requisitos/backlog-features.md`).
