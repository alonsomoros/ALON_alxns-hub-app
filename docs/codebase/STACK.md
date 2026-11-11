# Stack

## Runtime

- Lenguaje principal: TypeScript con JSX; `tsconfig.app.json` usa target ES2023 y modo bundler.
- Runtime de desarrollo/build: Node.js con npm (CI usa Node 22). No hay `.nvmrc`. `[TODO]` fijar version minima. La API de persistencia requiere Node 22.5+ por `node:sqlite`.
- Framework: React 19 con Vite 8.
- PWA: `vite-plugin-pwa` con `registerType: autoUpdate` y `workbox-window`.
- Backend de persistencia: `server/index.js` (HTTP nativo de Node + SQLite `node:sqlite`) empaquetado en `Dockerfile.persistence` y `docs/ci-cd/docker-compose.yml` (`REQ-018`).

## Dependencias de produccion

- `react`, `react-dom`: runtime UI.
- `lucide-react`: iconografia.
- `tailwindcss`, `@tailwindcss/vite`: estilos/utilidades.
- `vite-plugin-pwa`: manifest y service worker.

## Herramientas de desarrollo

- TypeScript `~5.9.3` (fijado: TypeScript 7 fallaba en Windows por una dependencia opcional), Vite 8, `@vitejs/plugin-react`, Oxlint y tipos de React/Node.
- Scripts: `npm run dev`, `npm run persistence`, `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.
- Existen `package-lock.json` (usado por CI) y `pnpm-lock.yaml`; el gestor oficial es npm.

## Evidencia

- `package.json`
- `tsconfig.app.json`
- `vite.config.ts`
