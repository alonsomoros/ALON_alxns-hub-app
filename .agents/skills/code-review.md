# Skill: Code Review

## Objetivo

Revisión funcional y técnica antes de cerrar una tarea, con foco en consistencia, mantenibilidad, accesibilidad y alineación con la arquitectura y los requisitos.

## Flujo

1. Leer la nota `Issues/NNN-*.md` y los criterios de aceptación del cambio.
2. Comprobar que la solución respeta `AGENTS.md` y `.agents/context/system-status.md`.
3. Revisar el diff completo de la zona afectada con la checklist de abajo.
4. Documentar los hallazgos priorizados en la nota (sección `Pendientes`) y corregir los que bloquean.
5. Revalidar con `npm run lint` y `npm run build` y entregar el informe de `WORKFLOW.md` §5.

## Checklist

- **Branding y assets:** usar el asset oficial; sin letras ni mascotas hardcodeadas.
- **Datos:** los valores de prototipo viven en `src/data/` y no se presentan como reales.
- **Trazabilidad:** el cambio conserva `REQ-NNN` y la nota actualizada.
- **Responsive:** sin overflow horizontal, tarjetas gigantes, texto truncado sin contexto ni controles pequeños.
- **Accesibilidad:** labels, `focus-visible`, `aria-label`, teclado y contraste.
- **Mantenibilidad:** sin lógica repetida, componentes complejos ni estado duplicado; lógica pura en `src/domain/`.
- **Red y secretos:** adaptador tipado con timeout de 1.5 s y fallback local; sin secretos en el cliente.
- **Git:** sin `dist/`, secretos ni cambios ajenos en el commit.

## Salida

Hallazgos prioritarios, riesgos funcionales o de UX, mejora propuesta y evidencia de validación, dentro de la nota del cambio.
