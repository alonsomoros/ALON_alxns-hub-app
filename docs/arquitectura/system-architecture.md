# Arquitectura del sistema

El cliente React renderiza un shell PWA inmediato orientado a una primera impresión simple. Los widgets consumen adaptadores tipados que aislan la red y exponen estados `loading`, `online`, `degraded` y `offline`. La API personal consulta Prometheus y un proxy de solo lectura de Docker en la Raspberry y normaliza las métricas (`REQ-011`); n8n queda para automatizaciones futuras; Grafana conserva la observabilidad detallada. La configuración de presentación debe mantenerse separada de los datos y permitir intercambiar componentes sin rehacer el dashboard.

## Capas

1. Presentación: inicio, retos y enlaces; componentes visuales responsive y reutilizables.
2. Dominio: modelos de métricas, servicios y `HabitGoal`.
3. Preferencias: tema, modo claro/oscuro, fuente de citas, orden de servicios y showcase de métricas.
4. Integración: clientes HTTP de telemetría, healthchecks y persistencia con timeout, reintentos limitados y fallback.
5. Infraestructura: n8n, Grafana, Raspberry Pi 5, API personal, almacenamiento y servicios desplegados.

## Persistencia personal

`REQ-018` mantiene la ausencia de login en la UI sin dejar la base de datos expuesta: API personal en la Raspberry (`server/index.js`), SQLite con volumen Docker y acceso por red privada Tailscale. La PWA usa caché local y muestra el estado de sincronización; el detalle de recursos, conflictos y pendientes vive en [persistencia-personal.md](persistencia-personal.md).

## Chat de consultas

`REQ-024`: la vista «Consultas» de la PWA habla **directamente** con la API de `selfbank` (otro repositorio, misma Raspberry), publicada con `tailscale serve` (solo tailnet, sin Funnel). No hay pasarela en la API del hub ni rutas de Vercel: Vercel solo entrega los archivos estáticos y no ve consultas ni respuestas. La credencial es el token Bearer propio de `selfbank` (el hub no tiene credenciales, y una pasarela lo convertiría en un proxy del banco para toda la tailnet); el token vive solo en `sessionStorage` y la conversación solo en memoria. La vista existe únicamente si `VITE_SELFBANK_URL` está definida. Diseño: `docs/superpowers/specs/2026-11-16-chat-consultas-design.md`.

**Riesgo aceptado:** la interfaz se entrega desde Vercel; si ese despliegue se comprometiera, un bundle manipulado podría leer el token y las respuestas dentro del navegador. Mitigaciones previstas (backlog): `Content-Security-Policy` con `connect-src` limitado, o servir la propia PWA desde la Pi.

## Estado verificado

- Implementado: shell PWA, splash, navegacion Inicio/Retos/Enlaces, estado React, fallback de cita, adaptador de persistencia con timeout de 1.5 s y cache, API SQLite y Docker Compose (`REQ-018`); métricas de la Raspberry con polling de 60 s mediante `GET /api/pi/metrics` (`REQ-011`, desplegado).
- Preparado: manifest/service worker PWA y contratos/documentacion para preferencias.
- Implementado y probado en local: chat de consultas contra el simulado de `selfbank` (`REQ-024`).
- Pendiente: backups con retención, ACL de Tailscale, adaptadores n8n/Grafana, tests E2E y el despliegue del chat con el servicio real de `selfbank` (`REQ-024`).

## Diagramas

La vista SVG se mantiene en `docs/diagramas/` mediante la skill `/diagrams`: arquitectura, pantallas, datos y entrega CI/CD. La fuente textual base es `docs/diagramas/architecture-diagrams.mmd`.
