# Concerns

## Current risks

- Resuelto en `REQ-016`: `src/App.tsx` solo decide splash/dashboard; vistas, datos, dominio y hooks viven en modulos separados.
- La persistencia existe (`REQ-018`) pero solo se activa con `VITE_PERSISTENCE_API_URL`; sin ella el estado se pierde al recargar. Falta desplegarla en la Raspberry, backups y HTTPS.
- Al enviar enlaces a la API se fija `archived: false` y las preferencias se guardan pero no se leen de vuelta.
- No hay tests automatizados de comportamiento ni E2E.
- Las URLs de servicios son datos de prototipo en `src/data/dashboardData.ts`. La fecha de portada ya es dinamica (`REQ-017`).
- La API de cita se llama desde el componente, sin adaptador ni timeout explicito de 1.5 s.
- El requisito de healthchecks y estados `OFFLINE`/`UNREACHABLE` aun no tiene implementacion.
- No hay login de producto: el control de acceso de la API es la red privada (Tailscale). No introducir secretos en el bundle.

## Intent versus reality

- Intent: adaptadores tipados n8n/Grafana y healthchecks. Reality: datos estaticos y `fetch` directo para la cita.
- Intent: persistencia multidispositivo. Reality: API SQLite y cache `localStorage` implementadas; sin despliegue real ni E2E (`REQ-018`).
- Intent: tests E2E y accesibilidad movil. Reality: solo lint y build en CI.
- Intent: `strict` TypeScript. Reality: varias opciones estrictas estan activas, pero `strict: true` no aparece en `tsconfig.app.json`.
- Intent: una sola fuente de lockfile. Reality: coexisten `package-lock.json` y `pnpm-lock.yaml`.

## Prioritized TODOs

1. Extraer adaptadores tipados con timeout/fallback.
2. Desplegar y validar la persistencia (`REQ-018`).
3. Configurar runner y tests de UI/E2E (`REQ-020`).
4. Hecho (`REQ-016`): `App.tsx` separado por vistas y dominio.
5. Validar drag and drop tactil y accesibilidad.

## Evidence

- `src/components/Dashboard.tsx`
- `tsconfig.app.json`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/requisitos/backlog-features.md`
