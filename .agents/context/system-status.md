# Estado del sistema

- **Fase:** foundation / dashboard personal simplificado.
- **Implementado:** splash breve, inicio con cita API y fallback, tarjeta Raspberry Pi, logros visuales, servicios como logos clicables, vista de retos, vista editable de enlaces y navegación simple.
- **Configuración preparada:** `raspberryPiStatsShowcase: 'pbar'`, `quote: 'random'`, `orderServices` y estructura para tema/modo.
- **Implementado parcialmente:** API de persistencia SQLite en `server/index.js`, adaptador tipado en `src/infrastructure/persistence.ts`, caché local y sincronización versionada de retos/enlaces mediante `REQ-018`.
- **Implementado parcialmente:** imagen Docker y Compose para la API SQLite con volumen persistente y reinicio automático.
- **Pendiente:** desplegar el compose en la Raspberry, configurar backups del volumen, ACL de Tailscale, HTTPS, UI de preferencias y tests E2E desde dos dispositivos.
- **Decisiones de producto:** ajustes y perfil quedan pospuestos; la primera impresión no debe parecer una consola técnica.
