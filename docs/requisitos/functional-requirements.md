# Requisitos funcionales

Dueño de **qué debe hacer el producto**. Cada `FR-xx` enlaza a la nota `REQ-NNN` que lo implementó (`../../Issues/README.md`); lo pendiente está en [`backlog-features.md`](backlog-features.md).

## Cobertura

| ID | REQ | Estado |
|---|---|---|
| FR-00 Trazabilidad | `REQ-005`, `REQ-007`, `REQ-019` | Implementado (issues #1 a #20 en GitHub; CI [BLOQUEADO] por facturación (verificación local)) |
| FR-01 Splash | `REQ-002` | Implementado |
| FR-02 Inicio | `REQ-002`, `REQ-013`, `REQ-017`, `REQ-021` | Implementado; cita en español vía la API personal con timeout de 1.5 s (desplegada en la Pi) |
| FR-03 Infraestructura | `REQ-011` | Implementado y desplegado (métricas reales con refresco de 30, 60 o 120 s y resumen de contenedores); vistas de barras, anillos y medidores (`REQ-003`) |
| FR-04 Servicios | `REQ-010`, `REQ-015`, `REQ-022` | Implementado: logos con fallback y estado real vía la API (despliegue en la Pi pendiente); sin API, estado de ejemplo |
| FR-05 Hábitos | `REQ-008` | Implementado |
| FR-06 Enlaces | `REQ-001`, `REQ-009`, `REQ-016` | Implementado (con estado vacío) |
| FR-07 PWA | `REQ-013` | Implementado |
| FR-08 Diagramas | `REQ-006`, `REQ-019` | Implementado |
| FR-09 Retos | `REQ-008` | Implementado |
| FR-10 Persistencia personal | `REQ-018`, `REQ-003` | Implementado: retos, enlaces y preferencias se guardan y se leen |
| FR-11 Sincronización multidispositivo | `REQ-018` | Parcial: API desplegada en la Pi (HTTPS por `tailscale serve`); ACL de Tailscale y E2E de persistencia pendientes |
| FR-12 Operación degradada | `REQ-018` | Implementado (caché y estado `OFFLINE` en el pie) |
| FR-13 Integridad de dominio | `REQ-008`, `REQ-018` | Implementado y probado (`tests/goals.test.ts`, `tests/api.test.ts`) |
| FR-14 Preferencias de interfaz | `REQ-003` | Implementado (seis temas, vista de stats, tarjetas de Inicio y refresco; sincronizadas con la API) |
| RNF-01 a RNF-09 | `REQ-018` | RNF-03 y RNF-05 implementados; RNF-02, RNF-07 y RNF-09 pendientes de despliegue |
| RNF-10 Pruebas | `REQ-020` | Implementado: `npm test` (`node:test`) cubre dominio, API, preferencias, cita y SVG; faltan componentes React y E2E |

## Trazabilidad y entrega

- **FR-00:** toda funcionalidad debe estar vinculada a una nota `Issues/NNN-slug.md` (`REQ-NNN`) con criterios de aceptación y evidencia de tests; solo se considera cerrada después de commit trazable y push con validación en verde (proceso en `WORKFLOW.md`).
- **FR-08 Diagramas:** mantener diagramas SVG y Mermaid de arquitectura, pantallas, flujo de datos y entrega sincronizados con el codigo y marcar lo pendiente de forma explicita.

- **FR-01 Splash:** mostrar una pantalla de bienvenida breve y pasar al dashboard sin bloquear por red.
- **FR-02 Inicio:** mostrar logo, nombre, fecha y una cita personalizada responsive con autor y fallback local.
- **FR-03 Infraestructura:** presentar Raspberry Pi 5 con indicador discreto y CPU, memoria, disco y temperatura reales (actualizados cada 60 s) y un resumen de contenedores, en un componente visual configurable (`graph` o `pbar`).
- **FR-04 Servicios:** mostrar logos clicables, priorizando `logoUrl` o favicon del dominio con fallback Lucide, y un halo/indicador de health `online` u `offline` independiente.
- **FR-05 Hábitos:** mostrar logros de forma visual y rewarding, con progreso por color y navegación a una vista de retos escalable.
- **FR-06 Enlaces:** permitir añadir, borrar, abrir y reordenar accesos desde una vista dedicada.
- **FR-07 PWA:** instalarse como aplicación standalone y funcionar con shell precacheado.
- **FR-09 Retos:** permitir crear, editar y archivar retos con título, descripción, categoría, unidad, valor actual y objetivo; derivar el porcentaje y limitarlo visualmente al 100%; mostrar la racha junto al título sin porcentaje y conservar snapshots de progreso durante la sesión.
- **FR-10 Persistencia personal:** guardar y recuperar preferencias, retos, historial de progreso y enlaces mediante un adaptador de persistencia, manteniendo el orden de los enlaces y el estado archivado.
- **FR-11 Sincronización multidispositivo:** sincronizar los datos del propietario entre dispositivos mediante una API personal protegida por red privada o un perímetro equivalente, sin introducir cuentas ni login en la interfaz.
- **FR-12 Operación degradada:** iniciar la PWA con la última caché válida, reflejar cambios confirmados localmente y mostrar `OFFLINE` o `UNREACHABLE` cuando la persistencia remota no esté disponible; nunca bloquear el shell por la red.
- **FR-14 Preferencias de interfaz:** pantalla de Ajustes accesible desde la cabecera para elegir tema, vista de las estadísticas de la Raspberry, orden y visibilidad de las tarjetas de Inicio, intervalo de refresco y nombre del saludo; se aplican al instante, se validan con valores por defecto y se sincronizan entre dispositivos sin bloquear el render.
- **FR-13 Integridad de dominio:** derivar el progreso de retos desde `current / target`, validar límites y conservar snapshots de edición en el historial; el cliente no puede imponer un porcentaje incoherente.

## Requisitos no funcionales

- **RNF-01 Privacidad:** no exponer directamente la base de datos a Internet ni incluir credenciales, service role keys o secretos en el bundle PWA, `localStorage` o el repositorio.
- **RNF-02 Control de acceso:** aunque no exista autenticación visible de producto, toda API de persistencia debe quedar detrás de una red privada o perímetro con identidad de dispositivo y rechazar tráfico no autorizado.
- **RNF-03 Rendimiento:** las lecturas y escrituras remotas deben tener un timeout máximo de 1.5 s y no bloquear el primer render ni la navegación local.
- **RNF-04 Disponibilidad:** la PWA debe seguir mostrando la última versión conocida y permitir consultar el estado local cuando la Raspberry, la API o el proveedor remoto estén caídos.
- **RNF-05 Consistencia:** las escrituras deben ser idempotentes o usar versión/`updatedAt`; los conflictos entre dispositivos deben detectarse y no sobrescribirse silenciosamente.
- **RNF-06 Validación:** la API debe validar esquema, tamaños, URLs, límites de colecciones y relaciones antes de persistir datos.
- **RNF-07 Recuperación:** el almacenamiento debe tener copias de seguridad automatizables, una política de retención y una restauración verificable antes de producción.
- **RNF-08 Evolución:** el cliente debe depender de interfaces/adaptadores tipados para poder cambiar SQLite por PostgreSQL/Supabase sin acoplar la UI al proveedor.
- **RNF-09 Observabilidad:** los fallos de sincronización deben registrar contexto técnico sin incluir secretos ni datos personales innecesarios.
- **RNF-10 Pruebas:** la implementación deberá cubrir lectura, escritura, timeout, respuesta inválida, conflicto, recuperación desde caché y acceso desde dos dispositivos.
