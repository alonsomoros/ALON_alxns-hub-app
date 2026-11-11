# Structure

## Top-level map

| Path | Purpose | Evidence |
|---|---|---|
| `src/` | Entry point, React views, CSS y assets de la UI | `src/main.tsx`, `src/App.tsx`, `src/index.css` |
| `src/components/` | Dashboard orquestador y vistas por feature (`home/`, `goals/`, `links/`, `layout/`, `ui/`) | `src/components/Dashboard.tsx` |
| `src/types/`, `src/domain/`, `src/data/` | Modelos, logica pura de retos/enlaces y datos de prototipo | `src/types/dashboard.ts`, `src/domain/goals.ts` |
| `src/hooks/`, `src/utils/`, `src/infrastructure/` | Estado con efectos (cita, persistencia), helpers y adaptadores | `src/hooks/usePersistedDashboard.ts` |
| `public/` | Assets publicos de la PWA | `public/favicon.svg`, `public/icons.svg` |
| `docs/` | Arquitectura, requisitos, CI/CD y diagramas | `docs/arquitectura/`, `docs/requisitos/` |
| `Issues/` | Trazabilidad de decisiones y problemas | `Issues/README.md` |
| `.agents/` | Contexto y skills operativas | `.agents/context/`, `.agents/skills/` |
| `.github/` | CI y plantillas de issues | `.github/workflows/ci.yml` |

## Entry points

- Runtime principal: `src/main.tsx`, seleccionado por `index.html`.
- Configuracion de build/PWA: `vite.config.ts`.
- No hay workers, CLI ni backend dentro de este repositorio.

## Boundaries

| Boundary | Pertenece | No debe contener |
|---|---|---|
| Presentacion | `App.tsx`, `src/components/`, `App.css`, `index.css` | Credenciales o logica de infraestructura futura |
| Integracion futura | Adaptadores previstos en arquitectura | Acoplamiento directo de widgets a endpoints |
| Documentacion | `docs/`, `Issues/`, `.agents/` | Estado runtime de la aplicacion |

## Naming

Los componentes y tipos usan PascalCase; las variables y handlers usan camelCase. Los documentos y skills usan nombres kebab-case. No hay aliases de paths configurados.

## Evidencia

- `index.html`
- `src/main.tsx`
- `vite.config.ts`
- `docs/arquitectura/system-architecture.md`
