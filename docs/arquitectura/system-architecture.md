# Arquitectura del sistema

El cliente React renderiza un shell PWA inmediato orientado a una primera impresión simple. Los widgets consumen adaptadores tipados que aislan la red y exponen estados `loading`, `online`, `degraded` y `offline`. n8n actúa como orquestador para consultar la Raspberry Pi y normalizar métricas; Grafana conserva la observabilidad detallada. La configuración de presentación debe mantenerse separada de los datos y permitir intercambiar componentes sin rehacer el dashboard.

## Capas

1. Presentación: inicio, retos y enlaces; componentes visuales responsive y reutilizables.
2. Dominio: modelos de métricas, servicios y `HabitGoal`.
3. Preferencias: tema, modo claro/oscuro, fuente de citas, orden de servicios y showcase de métricas.
4. Integración: clientes HTTP de telemetría, healthchecks y persistencia con timeout, reintentos limitados y fallback.
5. Infraestructura: n8n, Grafana, Raspberry Pi 5, API personal, almacenamiento y servicios desplegados.

## Persistencia personal

La propuesta de `REQ-018` mantiene la ausencia de login en la UI, pero no deja la base de datos anónimamente expuesta. La primera alternativa a evaluar es una API personal en la Raspberry, almacenamiento SQLite con backups y acceso desde los dispositivos mediante una red privada. La PWA usa caché local y estados `OFFLINE`/`UNREACHABLE`; el detalle de recursos, conflictos y decisiones pendientes vive en [persistencia-personal.md](persistencia-personal.md).

## Estado verificado

- Implementado: shell PWA, splash, navegacion Inicio/Retos/Enlaces, estado local React y fallback de cita.
- Preparado: manifest/service worker PWA y contratos/documentacion para preferencias.
- Pendiente: adaptadores n8n/Grafana, healthchecks reales, persistencia `REQ-018` y tests E2E.

## Diagramas

La vista SVG se mantiene en `docs/diagramas/` mediante la skill `/diagrams`: arquitectura, pantallas, datos y entrega CI/CD. La fuente textual base es `docs/diagramas/architecture-diagrams.mmd`.
