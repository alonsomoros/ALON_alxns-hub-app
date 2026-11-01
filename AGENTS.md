# alXns Command Center PWA

## Autoridad y lectura obligatoria

Este archivo es el SOP de navegación del repositorio. Antes de leer código, proponer trabajo o editar, el agente DEBE leer completos `AGENTS.md`, `WORKFLOW.md`, `context/INDEX.md`, `context/STYLE_GUIDE.md`, `context/VISION.md`, `CODE_STANDARD.md`, `.agents/context/system-status.md` e `Issues/README.md`. Después leerá solo la documentación y el código del área afectada.

Las reglas de proceso viven en `WORKFLOW.md`; las convenciones de código/tests en `CODE_STANDARD.md`; los IDs y referencias en `context/STYLE_GUIDE.md`; los requisitos en `docs/requisitos/`; las tareas y problemas en `Issues/`. No duplicar hechos: enlazar al dueño.

Si falta un archivo requerido o hay conflicto entre reglas, el agente debe detener la edición, nombrar el conflicto y pedir decisión. Una propuesta no es una decisión de arquitectura: se documenta en `Issues/` hasta aprobación.

## Vision
PWA rápida y privada para centralizar infraestructura self-hosted, estado de aplicaciones, accesos contextuales y objetivos personales.

## Stack
- React + TypeScript + Vite
- Tailwind CSS v4 y CSS modular para la UI cyberpunk
- vite-plugin-pwa para manifest, precache y actualización automática
- Lucide React para iconografía
- Integraciones futuras mediante endpoints HTTPS de n8n y APIs ligeras

## Development rules
- Antes de procesar un prompt o cambiar comportamiento, consulta `Issues/README.md` y la nota de alcance relacionada; conserva la trazabilidad de problema, propuesta, decisión y pendientes.
- Consulta `.agents/context/system-status.md` antes de cambiar comportamiento.
- Para cada funcionalidad, sigue `.agents/skills/cicd-github-delivery.md`: issue de GitHub, requisito `REQ-XXX`, criterios de aceptación, tests, commit trazable, push y cierre solo con validación verde.
- Mantén TypeScript estricto y componentes desacoplados.
- Las peticiones externas no deben bloquear la interfaz: usa skeletons, timeouts de 1.5 s y estados `OFFLINE / UNREACHABLE`.
- Actualiza el skill correspondiente cuando añadas endpoints, integraciones o widgets.
- Para mapas de arquitectura, pantallas, datos o entrega, usa `.agents/skills/diagrams.md` mediante `/diagrams`; mantén SVG y Mermaid sincronizados con la realidad del código.
- Mantén los diagramas Mermaid de `docs/diagramas/` sincronizados.

## Change gates

Antes de editar, el agente DEBE identificar el problema, el requisito `REQ-XXX`, la issue, el área afectada, el check que puede falsar la hipótesis y los documentos que deben cambiar. Después de editar, DEBE actualizar el dueño correcto según `WORKFLOW.md` y no cerrar una issue sin push, CI verde y confirmación del desarrollador.

Si la petición añade o cambia UI, datos, integración, configuración, arquitectura, CI o diagramas, revisará la matriz de impacto de `WORKFLOW.md`. Si un documento no cambia, debe dejar constancia de `Sin cambio: motivo` en la trazabilidad.

## Commands
- `npm run dev`: servidor local
- `npm run persistence`: API de persistencia SQLite
- `npm run build`: typecheck y build de producción
- `npm run lint`: lint con Oxlint
- `npm run preview`: servir `dist`

## Delivery workflow
Cada funcionalidad debe actualizar la nota correspondiente de `Issues/`, el backlog y los requisitos cuando proceda. Antes del commit ejecuta `npm run lint` y `npm run build`; si fallan, corrige y repite. Usa commits Conventional Commit con `(#issue)`, referencia `REQ-XXX` y evidencia de tests. El workflow `.github/workflows/ci.yml` valida push y pull request. Nunca hagas push forzado ni cierres una issue sin poder verificar el push y la CI.

## Architecture
La UI vive en `src/`. El dashboard actual usa datos estáticos para validar la experiencia; las fuentes n8n/Grafana se conectarán detrás de adaptadores tipados, sin acoplar widgets a la red.

## Repository map

```text
/AGENTS.md              SOP, mapa y enrutamiento
/WORKFLOW.md            proceso, trazabilidad y Git
/CODE_STANDARD.md       convenciones de código y tests
/context/               índice, visión y estilo de documentación
/src/                   aplicación React/Vite
/server/                API personal de persistencia SQLite
/docs/                  requisitos, arquitectura y diagramas
/Issues/                problemas y trazabilidad local
/.agents/               contexto y skills operativas
/.github/               workflows y plantillas GitHub
```

No añadir carpetas de primer nivel sin justificarlo en la issue y actualizar este mapa.

## Product context
La primera iteración prioriza una experiencia personal sencilla y responsive con las vistas Inicio, Retos y Enlaces. La configuración de tema, citas, orden de servicios y métricas está preparada pero la pantalla de preferencias queda pospuesta. Los enlaces admiten hasta 10 elementos y se reordenan mediante arrastre; su persistencia y las integraciones reales siguen pendientes.
