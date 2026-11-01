# Requisitos funcionales

## Trazabilidad y entrega

- **FR-00:** toda funcionalidad debe estar vinculada a una issue de GitHub, un requisito `REQ-XXX`, criterios de aceptación y evidencia de tests; solo se considera cerrada después de commit trazable, push y CI verde.
- **FR-08 Diagramas:** mantener diagramas SVG y Mermaid de arquitectura, pantallas, flujo de datos y entrega sincronizados con el codigo y marcar lo pendiente de forma explicita.

- **FR-01 Splash:** mostrar una pantalla de bienvenida breve y pasar al dashboard sin bloquear por red.
- **FR-02 Inicio:** mostrar logo, nombre, fecha y una cita personalizada responsive con autor y fallback local.
- **FR-03 Infraestructura:** presentar Raspberry Pi 5 con indicador discreto y CPU, memoria y temperatura en un componente visual configurable (`graph` o `pbar`).
- **FR-04 Servicios:** mostrar logos clicables, priorizando `logoUrl` o favicon del dominio con fallback Lucide, y un halo/indicador de health `online` u `offline` independiente.
- **FR-05 Hábitos:** mostrar logros de forma visual y rewarding, con progreso por color y navegación a una vista de retos escalable.
- **FR-06 Enlaces:** permitir añadir, borrar, abrir y reordenar accesos desde una vista dedicada.
- **FR-07 PWA:** instalarse como aplicación standalone y funcionar con shell precacheado.
- **FR-09 Retos:** permitir crear, editar y archivar retos con título, descripción, categoría, unidad, valor actual y objetivo; derivar el porcentaje y limitarlo visualmente al 100%; mostrar la racha junto al título sin porcentaje y conservar snapshots de progreso durante la sesión.
- **FR-10 Persistencia personal:** guardar y recuperar preferencias, retos, historial de progreso y enlaces mediante un adaptador de persistencia, manteniendo el orden de los enlaces y el estado archivado.
- **FR-11 Sincronización multidispositivo:** sincronizar los datos del propietario entre dispositivos mediante una API personal protegida por red privada o un perímetro equivalente, sin introducir cuentas ni login en la interfaz.
- **FR-12 Operación degradada:** iniciar la PWA con la última caché válida, reflejar cambios confirmados localmente y mostrar `OFFLINE` o `UNREACHABLE` cuando la persistencia remota no esté disponible; nunca bloquear el shell por la red.
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
