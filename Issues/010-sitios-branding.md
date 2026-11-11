# Logos de "Tus sitios"

- **Estado:** Hecho
- **REQ:** REQ-010
- **Tipo:** feat
- **Área:** `src/components/ui/BrandLogo.tsx`, `src/components/home/HomeView.tsx`
- **GitHub:** [#10](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/10)
- **Actualizada:** 2026-11-11

## Problema

La sección de servicios usaba iconos Lucide fijos aunque cada servicio apunta a una web concreta y debía mostrar su logo con un fallback coherente.

## Decisión

`BrandLogo` es el componente único para servicios y enlaces: prioriza `logoUrl`, luego el favicon del dominio mediante el resolver compartido (`REQ-015`), y cae al icono Lucide si falla. El tile mantiene tamaño estable durante la carga. El indicador `online`/`offline` es independiente del logo y la etiqueta accesible incluye nombre y estado. Los healthchecks reales quedan fuera.

## Criterios de aceptación

- [x] El logo sustituye al icono cuando carga y Lucide permanece como fallback.
- [x] El estado visual es independiente del logo.
- [x] Etiqueta accesible con nombre y estado.

## Verificación

`npm run lint` y `npm run build` OK. Carga/error del proveedor remoto: Omitido: no existe runner (`REQ-020`).

## Impacto documental

`docs/requisitos/functional-requirements.md` (FR-04).

## Pendientes

- [x] Healthchecks reales → `REQ-022` (despliegue en la Pi pendiente).
