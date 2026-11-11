# Estado del sistema

Actualizado: 2026-11-11. Este archivo solo resume el estado; el detalle vive en `Issues/README.md` (notas `REQ-NNN`) y en `docs/`.

- **Fase:** foundation / dashboard personal simplificado.
- **Implementado:** splash breve, Inicio con fecha del sistema, cita con fallback, tarjeta Raspberry (datos de prototipo), logros, servicios como logos clicables con fallback, vista de retos (alta, edición, archivo, historial), vista de enlaces (alta, borrado, reordenación por arrastre y teclado, máximo 10) y navegación simple.
- **Implementado parcialmente (`REQ-018`):** API de persistencia SQLite (`server/index.js`) con `GET /health`, `GET /api/state` y `PUT /api/state` con versión optimista; adaptador `src/infrastructure/persistence.ts` con timeout de 1.5 s y caché en `localStorage`; imagen Docker y Compose con volumen y reinicio automático. Solo se activa con `VITE_PERSISTENCE_API_URL`; sin ella, retos y enlaces viven en memoria con datos de prototipo.
- **Configuración preparada:** `raspberryPiStatsShowcase: 'pbar'`, `quote: 'random'`, `orderServices`, tema/modo. Las preferencias se envían a la API pero no se leen de vuelta.
- **Pendiente:** desplegar el compose en la Raspberry, backups del volumen, ACL de Tailscale, HTTPS, UI de preferencias, adaptadores n8n/Grafana/healthchecks (`REQ-011`), adaptador de cita con timeout, runner de tests (`REQ-020`) y E2E desde dos dispositivos.
- **Herramientas:** `gh` 2.103.3 autenticado (puede faltar en el `PATH` de la sesión). Repositorio: `alonsomoros/ALON_alxns-hub-app`. CI [BLOQUEADO]: los jobs no arrancan porque la cuenta de GitHub tiene un problema de facturación (anotación de las ejecuciones desde 2026-11-11); no es un fallo del código. Línea base verificada: `npm run lint` y `npm run build` pasan.
- **Decisiones de producto:** ajustes y perfil quedan pospuestos; la primera impresión no debe parecer una consola técnica.
