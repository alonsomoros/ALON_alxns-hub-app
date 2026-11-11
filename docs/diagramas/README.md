# Diagramas

Los diagramas visuales se generan siguiendo `.agents/skills/diagrams.md` mediante `/diagrams`.

- [Arquitectura actual](architecture.svg): runtime PWA, estado, presentacion e integraciones futuras.
- [Flujo de pantallas](screens-flow.svg): Splash, Inicio, Retos y Enlaces.
- [Flujo de datos](data-flow.svg): datos estaticos, estado React, cita externa y futuras fuentes.
- [Flujo de entrega](delivery-flow.svg): issue, requisito, validacion, commit, push, CI y cierre.
- [Fuente Mermaid de arquitectura](architecture-diagrams.mmd): version textual mantenible.

Validación: cada SVG debe ser XML bien formado (ver `.agents/skills/diagrams.md`). Verde significa implementado, amarillo preparado y rojo pendiente. Los SVG son estaticos, portables y no contienen secretos.
