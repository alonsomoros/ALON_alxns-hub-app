# Conventions

## Naming and organization

- Componentes y tipos: PascalCase (`Dashboard`, `QuickLink`).
- Variables, funciones y handlers: camelCase (`activeView`, `reorderLinks`).
- Archivos de documentacion y skills: kebab-case.
- La UI se organiza por feature en `src/components/` (`home/`, `goals/`, `links/`, `layout/`, `ui/`); tipos en `src/types/`, logica pura en `src/domain/`, datos de prototipo en `src/data/`, hooks de estado/red en `src/hooks/` y helpers en `src/utils/` (`REQ-016`).

## TypeScript

`tsconfig.app.json` activa `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `strict` no aparece explicitamente. `[TODO]` decidir si debe habilitarse `strict: true`.

## Imports and styles

Los imports de iconos se agrupan desde `lucide-react`; los tipos se importan con `import type`. Los estilos globales estan en CSS plano y Tailwind se integra desde Vite.

## Error handling

La cita captura fallos de `fetch` y usa `fallbackQuote`. No hay logger estructurado ni boundary de errores documentado. La validacion de formularios de enlaces descarta entradas vacias.

## Evidence

- `src/components/Dashboard.tsx`
- `src/index.css`
- `tsconfig.app.json`
- `.oxlintrc.json`
