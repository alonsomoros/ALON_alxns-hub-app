# Persistencia personal multidispositivo

## Alcance

Esta arquitectura cubre preferencias, retos, historial de progreso y enlaces. No cubre métricas de Raspberry, healthchecks, citas ni el histórico de Grafana.

La implementación inicial vive en `server/index.js` y `src/infrastructure/persistence.ts`. El despliegue concreto de Raspberry y Tailscale está documentado en [deploy-persistencia-raspberry.md](deploy-persistencia-raspberry.md).

## Despliegue implementado

```text
[PWA en dispositivo]
        |
        | HTTPS o HTTP privado, timeout 1.5 s
        v
[Adaptador de persistencia]
        |
        v
[API personal en Raspberry]
        |
        v
[SQLite + backups verificables]

[Dispositivos del propietario] -- [red privada Tailscale]
```

La aplicación no muestra login. El control de acceso lo proporciona la red privada y la API valida todos los payloads. La PWA conserva una caché local para render inicial y operación degradada, pero la fuente sincronizada es la API personal.

## Contrato lógico mínimo

| Recurso | Operaciones | Datos principales |
|---|---|---|
| `preferences` | leer, reemplazar parcialmente | versión, tema, modo, cita, orden de servicios, showcase |
| `goals` | listar, crear, editar, archivar | título, descripción, categoría, unidad, actual, objetivo, archivedAt |
| `goal_history` | listar, insertar | goalId, actual, objetivo, progreso derivado, createdAt |
| `links` | listar, crear, editar, archivar, reordenar | título, URL, icono, posición, archivedAt |

Los porcentajes de retos se derivan de `current / target` y no se aceptan como verdad escrita por el cliente. Las posiciones de enlaces deben tener una regla de actualización transaccional.

## Flujo de lectura y escritura

1. La PWA carga shell y caché sin esperar a la red.
2. El adaptador intenta sincronizar con la API con timeout de 1.5 s.
3. Una respuesta válida sustituye la caché y actualiza la UI.
4. Un fallo mantiene la última versión local y marca `OFFLINE` o `UNREACHABLE`.
5. Las escrituras llevan `updatedAt` o una versión y se rechazan si existe conflicto no resuelto.

## Seguridad

“No auth” se interpreta como ausencia de cuentas y login de producto, no como acceso anónimo a la base de datos. No se debe poner una clave de Supabase con privilegios, una contraseña de API o una credencial de base de datos en el bundle. Si se elige Supabase, debe existir un perímetro equivalente: backend intermedio, acceso privado o identidad técnica gestionada fuera de la PWA.

## Pendientes antes de producción

- URL interna y certificado HTTPS.
- Política de copias, retención y restauración.
- Migraciones futuras del esquema.
- Gestión de la primera configuración del dispositivo.

La implementación usa Docker Compose, Node.js 22, `node:sqlite` y un volumen Docker para SQLite. Hasta resolver los pendientes, los datos mock y el estado en memoria permanecen como fallback de desarrollo. La API inicial ya puede leer y escribir el estado completo mediante `GET /api/state` y `PUT /api/state`, con versión optimista y respuesta `409` ante conflictos.
