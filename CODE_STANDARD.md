# Código y tests

## TypeScript/React

- Mantener componentes desacoplados y tipos explícitos en contratos de datos.
- Usar nombres descriptivos en camelCase para valores/funciones y PascalCase para componentes/tipos.
- No acoplar widgets a red, almacenamiento o infraestructura; usar adaptadores tipados cuando se incorporen.
- No introducir dependencias sin justificarla en la issue y actualizar lockfile solo como parte de esa decisión.
- Mantener accesibilidad: controles semánticos, labels/aria-label y navegación por teclado.

## Estilos

- Respetar los patrones visuales y responsive existentes.
- No introducir overflow horizontal ni dimensiones que dependan de un viewport concreto.
- Mantener SVG y Mermaid sincronizados cuando describan una superficie afectada.

## Tests

- Cada cambio de comportamiento debe declarar el test que lo verifica.
- Tests de caja negra deben cubrir el flujo observable y contener `REQ-XXX` en el nombre (`npm test`, `node:test` con `--experimental-strip-types`; los módulos que se prueban importan con extensión `.ts` y no usan `import.meta.env` ni el DOM en el nivel superior).
- Para UI: cubrir estados iniciales, interacción principal, error/fallback y viewport relevante.
- Para integraciones: cubrir timeout, respuesta válida, respuesta inválida y estado no disponible.
- Si el runner no cubre el cambio (componentes React, navegador, PWA móvil), registrar `Omitido: no cubierto por el runner`, ejecutar lint, tests y build y describir una comprobación en Chrome reproducible en la nota.
- Cambios en `server/`: ejecutar además `node --check server/index.js`.

## Calidad

- No dejar errores del compilador, lint o diagnósticos nuevos.
- No ocultar fallos con casts, desactivación de reglas o tests vacíos.
- Los comentarios explican decisiones no obvias, no repiten el código.
