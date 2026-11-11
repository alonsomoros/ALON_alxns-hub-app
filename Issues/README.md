# Issues e ideas

Este directorio conserva la trazabilidad funcional del proyecto. Antes de cambiar comportamiento, consultar este índice y la nota relacionada.

Cada nota distingue el problema observado, la solución propuesta y la decisión adoptada. Las decisiones técnicas deben respetar `AGENTS.md`, `.agents/context/system-status.md` y la arquitectura documentada.

## Alcance actual

- [Enlaces responsive y ordenación](001-enlaces-responsive.md): corregido en la UI; queda pendiente persistir el orden.
- [Páginas y vistas](002-paginas-y-vistas.md): dashboard, retos y enlaces en primera iteración.
- [Parámetros y preferencias](003-parametros-y-preferencias.md): configuración preparada, pantalla pospuesta.
- [Arquitectura e integraciones](004-arquitectura-e-integraciones.md): datos estáticos ahora, adaptadores tipados después.
- [CI/CD y trazabilidad](005-cicd-trazabilidad.md): flujo obligatorio de issue, tests, commit, push y cierre.
- [Diagramas y arquitectura](006-diagrams.md): skill `/diagrams`, analisis y SVG sincronizados.
- [Gobierno del flujo de agentes](007-agent-governance.md): preflight, dueños documentales y gates de entrega.
- [Retos, racha y edición](008-retos-y-progreso.md): propuesta para crear y editar retos con progreso derivado.
- [Enlaces arrastrables y branding](009-enlaces-drag-y-branding.md): propuesta para drag and drop accesible y logos remotos.
- [Sitios con branding](010-sitios-branding.md): propuesta para logos de servicios con fallback.
- [Telemetría Raspberry](011-telemetria-raspberry.md): alternativas de polling, push y tiempo real.
- [Revisión global de código y branding](012-code-review-global.md): hallazgos de mantenimiento, UX y branding para priorizar mejora.
- [Branding con asset real en la app](013-branding-asset.md): usar el logo oficial del producto en la UI principal.
- [Separar datos mock y configuración real](014-mock-data.md): aislar prototipos del flujo real.
- [Centralizar la resolución del logo de enlaces](015-link-logo-resolver.md): unificar la lógica de marcas y fallbacks.
- [Refactor de arquitectura del archivo principal](016-app-architecture.md): implementado (`REQ-016`); `App.tsx` reducido a splash/dashboard.
- [Fecha dinámica en la pantalla principal](017-date-dynamic.md): derivar la fecha del sistema en lugar de hardcodearla.
- [Persistencia personal multidispositivo](018-persistencia-personal-multidispositivo.md): propuesta de API privada, almacenamiento en Raspberry y sincronización sin login visible.

## Entrega

La skill operativa es `.agents/skills/cicd-github-delivery.md`. Toda funcionalidad debe tener issue de GitHub y requisito `REQ-XXX`; la issue solo se cierra tras validación local, push, CI verde y confirmación explícita del desarrollador.
