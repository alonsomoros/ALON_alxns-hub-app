# Structure

## Top-level map

| Path | Purpose | Evidence |
|---|---|---|
| `src/` | Entry point, React views, CSS y assets de la UI | `src/main.tsx`, `src/App.tsx`, `src/index.css` |
| `src/components/` | Dashboard orquestador y vistas por feature (`home/`, `goals/`, `links/`, `settings/`, `layout/`, `ui/`) | `src/components/Dashboard.tsx` |
| `src/types/`, `src/domain/`, `src/data/`, `src/themes.ts` | Modelos, logica pura de retos/enlaces/preferencias/estadísticas, temas como datos y datos de prototipo | `src/types/dashboard.ts`, `src/domain/preferences.ts`, `src/themes.ts` |
| `src/hooks/`, `src/utils/`, `src/infrastructure/` | Estado con efectos (cita, persistencia, métricas Pi), helpers y adaptadores | `src/hooks/usePersistedDashboard.ts`, `src/hooks/usePreferences.ts` |
| `tests/` | Pruebas `node:test` (`npm test`) de los módulos puros (temas y contraste, preferencias, estadísticas) y del CSS sin colores fijos | `tests/themes.test.ts` |
| `server/` | API de persistencia SQLite (`REQ-018`) y métricas de la Raspberry (`REQ-011`); imagen en `Dockerfile.persistence` | `server/index.js`, `server/metrics.js` |
| `public/` | Assets publicos de la PWA | `public/favicon.svg`, `public/icons/` |
| `docs/` | Requisitos, arquitectura, mapa del codigo, CI/CD y diagramas | `docs/arquitectura/`, `docs/requisitos/` |
| `Issues/` | Notas `REQ-NNN`, indice y plantilla | `Issues/README.md`, `Issues/_TEMPLATE.md` |
| `.agents/` | Contexto y skills operativas | `.agents/context/`, `.agents/skills/` |
| `.github/` | CI y plantillas de issues | `.github/workflows/ci.yml` |

## Entry points

- Runtime principal: `src/main.tsx`, seleccionado por `index.html`.
- Configuracion de build/PWA: `vite.config.ts`.
- Backend: `server/index.js` (`npm run persistence`), solo para persistencia personal. No hay workers ni CLI.

## Boundaries

| Boundary | Pertenece | No debe contener |
|---|---|---|
| Presentacion | `App.tsx`, `src/components/`, `App.css`, `index.css` | Credenciales o logica de infraestructura futura |
| Integracion | `src/infrastructure/` (persistencia) y adaptadores futuros | Acoplamiento directo de widgets a endpoints |
| Documentacion | `docs/`, `Issues/`, `.agents/` | Estado runtime de la aplicacion |

## Naming

Los componentes y tipos usan PascalCase; las variables y handlers usan camelCase. Los documentos y skills usan nombres kebab-case. No hay aliases de paths configurados.

## Evidencia

- `index.html`
- `src/main.tsx`
- `vite.config.ts`
- `docs/arquitectura/system-architecture.md`
