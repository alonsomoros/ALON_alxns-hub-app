# Voz a texto en el chat de consultas

- **Estado:** Propuesta
- **REQ:** REQ-025
- **Tipo:** feat
- **Área:** `src/components/chat/` (composer), posible servicio nuevo en la Pi
- **GitHub:** [#25](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/25)
- **Actualizada:** 2026-11-16

## Problema

Con el chat de `REQ-024` (escritura) funcionando, se quiere dictar las preguntas, sobre todo desde el móvil. Las preguntas pueden contener datos bancarios, así que el audio no debe salir de casa sin una decisión explícita.

## Decisión

Pendiente. Opciones a comparar cuando `REQ-024` esté desplegado:

| Opción | A favor | En contra |
|---|---|---|
| Web Speech API del navegador | Sin servidor, inmediata. | En Chrome el audio se procesa en servidores de Google: sale de la Pi. |
| Whisper local en la Pi (`whisper.cpp` o `faster-whisper`) | El audio no sale de casa. | Más lenta; comparte la CPU con el modelo de `selfbank` (una consulta a la vez); servicio nuevo. |

El botón de micrófono se añadirá al composer de `REQ-024` sin rehacerlo. Una transcripción no se envía sola: aparece en el campo para revisarla.

## Criterios de aceptación

Se fijarán al decidir la opción.

## Verificación

No aplica todavía.

## Impacto documental

Sin cambio: es una propuesta.

## Pendientes

- [ ] `REQ-024` desplegado y en uso.
- [ ] Decidir privacidad (audio fuera o dentro de la Pi) y medir el coste en la Pi 5 → diseño.
