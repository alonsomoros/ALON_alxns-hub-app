# Backlog

## Flujo de entrega

Toda funcionalidad nueva debe tener una issue de GitHub y un requisito `REQ-XXX` documentado en `Issues/`. Antes de cerrar una tarea se deben ejecutar `npm run lint` y `npm run build`; los fallos se corrigen antes del commit. El commit debe referenciar la issue y el requisito, y la issue solo se cierra después del push y de CI verde. Ver `.agents/skills/cicd-github-delivery.md`.

## Entregas completadas

- [x] Skill `/diagrams` y diagramas SVG de arquitectura, pantallas, datos y CI/CD (`REQ-006`).

## Propuestas en debate

- [x] `REQ-008`: separar racha del porcentaje y permitir alta/edición/archivo de retos con título, descripción, categoría y progreso derivado en memoria (`Issues/008-retos-y-progreso.md`).
- [ ] Añadir tests de caja negra de retos y validar restauración de historial para `REQ-008`.
- [x] `REQ-009`: corregir drag and drop accesible de enlaces y resolver logos remotos con fallback (`Issues/009-enlaces-drag-y-branding.md`).
- [x] `REQ-010`: mostrar logos configurados de los sitios y enlaces con favicon compartido y fallback (`Issues/010-sitios-branding.md`).
- [x] `REQ-013`: consolidar branding real de la app y del icono de instalación PWA con `logo.png` (`Issues/013-branding-asset.md`).
- [ ] `REQ-011`: definir contrato y transporte de métricas Raspberry mediante push/polling o tiempo real (`Issues/011-telemetria-raspberry.md`).
- [x] `REQ-018`: implementar persistencia personal multidispositivo sin login visible; queda despliegue y validación en Raspberry (`Issues/018-persistencia-personal-multidispositivo.md`).

- [ ] Adaptador n8n para métricas de Raspberry Pi 5.
- [ ] Implementar `raspberryPiStatsShowcase: graph` con gráficas ligeras y accesibles.
- [ ] Healthchecks reales con timeout y fallback offline.
- [ ] Cliente de citas configurable: `default`, `random`, `fav`.
- [ ] Enlace configurable a Grafana.
- [ ] Persistencia local de hábitos con IndexedDB.
- [ ] Persistir enlaces editables y conservar el orden del drag and drop ya implementado.
- [ ] Crear menú de preferencias para tema, modo, cita, orden de servicios y widgets.
- [ ] Notificaciones de degradación de servicios.
- [ ] Ajustes de usuario y configuración de endpoints. El perfil queda fuera de la primera iteración.
- [ ] Pruebas de accesibilidad y flujos PWA en móvil.
