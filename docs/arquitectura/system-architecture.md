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

## Estado verificado

- Implementado: shell PWA, splash, navegacion Inicio/Retos/Enlaces, estado React, fallback de cita, adaptador de persistencia con timeout de 1.5 s y cache, API SQLite y Docker Compose (`REQ-018`); métricas de la Raspberry con polling de 60 s mediante `GET /api/pi/metrics` (`REQ-011`, desplegado).
- Preparado: manifest/service worker PWA y contratos/documentacion para preferencias.
- Pendiente: despliegue de la API en la Raspberry, backups, HTTPS, adaptadores n8n/Grafana, healthchecks reales y tests E2E.

## Diagramas

La vista SVG se mantiene en `docs/diagramas/` mediante la skill `/diagrams`: arquitectura, pantallas, datos y entrega CI/CD. La fuente textual base es `docs/diagramas/architecture-diagrams.mmd`.
