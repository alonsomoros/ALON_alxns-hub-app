# Architecture

## 1) Architectural style

- Estilo primario: SPA React monolitica de presentacion, con separacion conceptual por capas y adaptadores futuros.
- Motivo: `src/main.tsx` monta una sola aplicacion; `src/App.tsx` contiene estado, vistas y datos estaticos; `docs/arquitectura/system-architecture.md` define presentacion, dominio, preferencias, integracion e infraestructura como objetivo.
- Restricciones: render inicial no debe bloquearse por red; la UI debe ser responsive; las integraciones reales deben quedar detras de adaptadores tipados.

## 2) System flow

```text
index.html -> src/main.tsx -> App/SplashScreen -> Dashboard -> vista activa -> estado local o enlace externo
```

1. `index.html` aporta el nodo raiz.
2. `src/main.tsx` registra el service worker PWA y monta React en `#root`.
3. `App` muestra splash durante 700 ms y despues `Dashboard`.
4. `Dashboard` mantiene `activeView`, cita, enlaces y formulario con `useState`, y sincroniza retos/enlaces mediante el adaptador de persistencia cuando existe `VITE_PERSISTENCE_API_URL`.
5. `HomeView`, `GoalsView` y `LinksView` renderizan el estado y mutan enlaces localmente.
6. La cita hace `fetch` directo a Quotable y vuelve al fallback local si falla.

## 3) Layer responsibilities

| Layer/module | Owns | Must not own | Evidence |
|---|---|---|---|
| Bootstrap PWA | registro SW y montaje React | estado de negocio | `src/main.tsx` |
| App/Dashboard | navegacion y estado local | integraciones desacopladas | `src/App.tsx` |
| Views | composicion de pantallas y acciones UI | persistencia real | `src/App.tsx` |
| Styles | layout responsive y apariencia | datos o red | `src/index.css`, `src/App.css` |
| Persistence adapter | carga y guardado remoto con timeout/fallback | base de datos o red en la UI | `src/infrastructure/persistence.ts`, `docs/arquitectura/persistencia-personal.md` |
| Integrations future | contratos n8n/Grafana/healthchecks | implementacion actual inexistente | `docs/arquitectura/integrations-n8n-grafana.md` |

## 4) Reused patterns

| Pattern | Where | Why |
|---|---|---|
| Typed model interfaces | `src/App.tsx` | delimitar Quote, Service, QuickLink y config |
| Local fallback | `fallbackQuote` y `catch` | mantener render aunque falle la red |
| Adapter boundary planned | arquitectura y skills | aislar futuras fuentes externas |

## 5) Known risks

- `App.tsx` concentra estado, vistas y datos; el crecimiento puede dificultar pruebas y mantenimiento.
- La persistencia inicial existe, pero requiere despliegue de la API y configuración de `VITE_PERSISTENCE_API_URL`; sin ella enlaces y hábitos siguen siendo locales.
- Healthchecks, n8n y Grafana estan documentados pero no conectados al runtime actual.
- El drag and drop usa API HTML nativa; `[TODO]` validar experiencia tactil en PWA.

## 6) Evidence

- `src/main.tsx`
- `src/App.tsx`
- `docs/arquitectura/system-architecture.md`
- `docs/arquitectura/integrations-n8n-grafana.md`
- `docs/diagramas/architecture-diagrams.mmd`
