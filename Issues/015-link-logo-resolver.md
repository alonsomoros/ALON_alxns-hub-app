# Centralizar la resolución del logo de enlaces

- **Estado:** Hecho (implementado con `REQ-016`)
- **REQ:** REQ-015
- **Tipo:** refactor
- **Área:** `src/utils/brandLogo.ts`, `src/components/ui/BrandLogo.tsx`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

`QuickLink` admite `logoUrl`, pero la creación y el render de enlaces no lo usaban de forma consistente y la lógica estaba repartida entre modelo y vista.

## Decisión

Función única `resolveBrandLogo(url, explicitLogoUrl)` en `src/utils/brandLogo.ts` con prioridad: `logoUrl` explícito → favicon del dominio → `null` (la vista pinta el icono de fallback).

## Criterios de aceptación

- [x] Un `logoUrl` explícito sustituye al favicon.
- [x] Sin override se usa el favicon del dominio.
- [x] Si falla la carga se muestra el icono por defecto (`BrandLogo`).
- [x] La lógica es reutilizable y no está embebida en la vista.

## Verificación

`npm run lint` y `npm run build` OK en `REQ-016`. Tests del resolver: Omitido: no existe runner (`REQ-020`).

## Impacto documental

Sin cambio posterior.

## Pendientes

- [ ] Permitir edición manual de `logoUrl` desde la UI → backlog (el modelo y la API ya lo guardan).
