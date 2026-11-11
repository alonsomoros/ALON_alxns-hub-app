# Concerns

## Current risks

- Resuelto en `REQ-016`: `src/App.tsx` solo decide splash/dashboard; vistas, datos, dominio y hooks viven en modulos separados.
- No hay persistencia para enlaces, retos o preferencias; el estado se pierde al recargar.
- No hay tests automatizados de comportamiento ni E2E.
- Las URLs de servicios y la fecha de portada estan hardcodeadas en la UI.
- La API de cita se llama desde el componente, sin adaptador ni timeout explicito de 1.5 s.
- El requisito de healthchecks y estados `OFFLINE`/`UNREACHABLE` aun no tiene implementacion.
- No hay autenticacion ni backend; no se deben introducir secretos en el bundle.

## Intent versus reality

- Intent: adaptadores tipados n8n/Grafana y healthchecks. Reality: datos estaticos y `fetch` directo para la cita.
- Intent: persistencia local de preferencias/enlaces/habitos. Reality: `useState` en memoria.
- Intent: tests E2E y accesibilidad movil. Reality: solo lint y build en CI.
- Intent: `strict` TypeScript. Reality: varias opciones estrictas estan activas, pero `strict: true` no aparece en `tsconfig.app.json`.

## Prioritized TODOs

1. Extraer adaptadores tipados con timeout/fallback.
2. Añadir persistencia local no bloqueante.
3. Configurar runner y tests de UI/E2E.
4. Hecho (`REQ-016`): `App.tsx` separado por vistas y dominio.
5. Validar drag and drop tactil y accesibilidad.

## Evidence

- `src/components/Dashboard.tsx`
- `tsconfig.app.json`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/requisitos/backlog-features.md`
