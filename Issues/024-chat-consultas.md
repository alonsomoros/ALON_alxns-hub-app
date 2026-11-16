# Chat de consultas dentro del hub

- **Estado:** En curso (implementado y verificado en local; despliegue pendiente)
- **REQ:** REQ-024
- **Tipo:** architecture
- **Área:** `src/components/chat/`, `src/domain/chat.ts`, `src/infrastructure/selfbankClient.ts`, `docs/arquitectura/`
- **GitHub:** [#24](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/24)
- **Actualizada:** 2026-11-16

## Problema

Las consultas personales (incluido el proyecto de banca y consultas centralizado, gestionado en otro repositorio) se hacen hoy por WhatsApp. Como todo está en la Raspberry, se quiere una ventana de chat en la PWA que simule una conversación con una IA y devuelva los datos, de forma centralizada, segura y sin sacar información de la Pi.

## Objetivos

- Chat moderno e intuitivo en la PWA, con escritura convencional y, después, voz a texto.
- Entrega incremental: cada fase útil por sí sola.
- Datos sensibles que no pasan por Vercel ni salen de la Pi.
- Solo lectura: sin pagos ni modificaciones desde el chat.

## No objetivos

- Sustituir WhatsApp para notificaciones o alertas (eso va por n8n/WAHA).
- Que un modelo vea toda la base de datos.

## Principios de diseño (provisionales, a aprobar)

- **Catálogo cerrado de consultas.** El modelo, si lo hay, solo traduce la frase a una consulta de una lista fija (por ejemplo `gastos(mes, categoría)`, `saldo(cuenta)`); código normal la ejecuta, de solo lectura.
- **Sin modelo al principio.** Un primer paso con comandos y atajos cubre las consultas habituales sin enviar nada a ningún modelo.
- **Perímetro.** Servicio en la Pi, solo en loopback, detrás de `tailscale serve`; las rutas de Vercel no intervienen (Vercel sirve solo archivos estáticos).
- **Autenticación.** Token que no vaya en el bundle ni en `localStorage` (`AGENTS.md`); límite de peticiones y registro de consultas sin contenido sensible.
- **Voz.** Opciones a comparar: Web Speech API del navegador (sin servidor, pero el audio puede salir a un tercero según el navegador) frente a Whisper local en la Pi (`whisper.cpp`, el audio no sale de casa, más lento).

## Fases

1. Perímetro: `REQ-023` desplegado. La autenticación la aporta el token propio de `selfbank`.
2. Interfaz de chat (este REQ): sugerencias, escritura, interpretación visible, tabla y feedback, contra el simulado local.
3. Despliegue y comprobación con el servicio real, cuando `selfbank` lo publique (lo hace el dueño del servicio).
4. Voz a texto: `REQ-025`.

## Decisiones (16-nov-2026)

Respuestas del repositorio `selfbank` (`docs/hub-handoff-req-024.md`):

- [x] Datos del banco: API HTTP en Python en la misma Pi, `127.0.0.1:8789`, token Bearer, contrato en `docs/api-contrato.md` de ese repo.
- [x] Consultas: dataset de 66 preguntas reales (gasto por categoría y periodo, última transferencia, saldo, comparar meses, comercios, suscripciones).
- [x] Modelo: **local** (`qwen2.5:3b` en Ollama); solo traduce a un catálogo cerrado; el ~79 % se resuelve por reglas en ~10 ms y el resto tarda 5–9 s. Nada sale de la Pi.
- [x] Servicio aparte (otro proceso y otro repo). Las fases 2 y 3 las cubre `selfbank`; al hub le queda la interfaz y, después, la voz (`REQ-025`).
- [x] **Arquitectura: directa, sin pasarela.** La PWA llama a `selfbank` por `tailscale serve` con su token Bearer en `sessionStorage`. Se descartó la pasarela del handoff porque el hub no tiene credenciales y convertiría su API en un proxy del banco para toda la tailnet, contra el `AGENTS.md` de `selfbank`. Diseño: [`docs/superpowers/specs/2026-11-16-chat-consultas-design.md`](../docs/superpowers/specs/2026-11-16-chat-consultas-design.md).

Investigación de red en la Pi (solo lectura, por si se retoma la pasarela): el contenedor del hub está en `ci-cd_default` (`172.27.0.1`, IP no estable al recrear la red) y no alcanza el `127.0.0.1` del host; `host-gateway` apunta a `docker0` (`172.17.0.1`), alcanzable desde todos los contenedores; `selfbank` escuchar ahí exigiría arrancar después de Docker. Estado de la Pi: servicio real en `127.0.0.1:8789` (script, sin `systemd`), simulado en `127.0.0.1:8788` publicado en `:8443`, Ollama en `127.0.0.1:11434` como servicio de `systemd`.

## Criterios de aceptación

- [x] Vista «Consultas» con sugerencias, entrada de texto, respuesta con la interpretación visible, tabla y «No era eso».
- [x] Estado «Pensando… N s» sin bloquear el hub; `unsupported`, `needs_clarification`, `401` y `503` con su mensaje y «Reintentar».
- [x] Sin token en URL, `localStorage`, bundle ni logs; preguntas y respuestas solo en memoria.
- [x] El service worker no cachea nada de `selfbank` (guarda automática: sin `runtimeCaching`).
- [x] Pruebas `node:test` con nombres `REQ-024` (dominio, cliente, estado, privacidad y contrato contra el simulado real) y comprobación en Chrome a ancho de móvil.
- [x] Documentación y pasos de despliegue listos.
- [ ] Desplegado y comprobado con el servicio real de `selfbank` en la Pi.

## Verificación

| Check | Resultado |
|---|---|
| `npm test` | OK: 163 pruebas; las del chat: `chat` (16), `chatState` (8), `selfbank-client` (13), `selfbank-token` (4), `selfbank-contract` (6, contra el simulado real), `chat-privacy` (6) |
| `npx tsc -b`, `npm run lint`, `npm run build` | OK |
| Chrome contra el simulado de `selfbank` (ancho 390 px en un iframe del mismo origen; `resize_window` no cambió el viewport) | OK: token incorrecto (aviso) y token de pruebas; sugerencias y estado; respuesta escalar con chips y distintivos; tabla dentro de su scroll sin desbordar la página; ruta del «modelo» con «Pensando… N s»; salir de la vista mientras piensa y volver con la respuesta; `__busy__` y `__error__` con «Reintentar»; «No era eso»; tema oscuro; recarga (conversación vacía; el token sigue durante la pestaña); ni preguntas ni respuestas en `localStorage`; solo `POST /api/ask` al simulado, sin parámetros en la URL; sin errores de consola |
| Revisión final (agente independiente), 4 hallazgos Importantes corregidos con prueba primero | Cifras de cuatro dígitos sin separador de miles (`1768,90 €` frente al `1.768,90 €` de la API): `useGrouping: 'always'`; un token con caracteres que una cabecera no admite (p. ej. espacio de ancho cero) dejaba al usuario atascado: ahora `isPlausibleToken` y «Cambiar token»; las respuestas `unsupported`/`needs_clarification` no ofrecían sugerencias; el campo fijo podía tapar el final de la última respuesta. Comprobado de nuevo en Chrome (token con espacio de ancho cero, «Cambiar token», 3 sugerencias tras una operación no soportada, 0 px tapados) |
| Hallazgos de la comprobación, corregidos | Un token rechazado devolvía el campo sin avisar (`tokenRejected`); el texto de ayuda del campo ocupaba dos líneas a 390 px |

Tests de caja negra: `REQ-024 …` (`npm test`). Componentes y hook `useChat`: `Omitido: no cubierto por el runner` (se comprobaron en Chrome, arriba).

## Impacto documental

Actualizados: `docs/arquitectura/{system-architecture,integrations-n8n-grafana,deploy-persistencia-raspberry}.md`, `docs/diagramas/{data-flow.svg,architecture-diagrams.mmd,README.md}`, `docs/requisitos/{functional-requirements,backlog-features}.md`, `docs/codebase/{INTEGRATIONS,STRUCTURE,TESTING}.md`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`, `AGENTS.md` (contexto de producto), `Issues/README.md`. Sin cambio: `docs/diagramas/{architecture,screens-flow}.svg` (no se rehacen en este cambio), skills de `.agents/skills/` (no cambian endpoints del hub).

## Pendientes

- [ ] `selfbank` debería enviar `Access-Control-Expose-Headers: Retry-After`: hoy el aviso de «ocupado» siempre dice 10 s porque el navegador no puede leer la cabecera entre orígenes (no es un defecto del hub).
- [ ] Menores de la revisión final, sin corregir: «Reintentar» sigue activo con el campo de token a la vista y tras `model_busy` no espera; el feedback no tiene guarda de doble clic ni avisa si falla; borrar la conversación no cancela la petición en curso; el aviso «Pensando…» se anuncia cada segundo a los lectores de pantalla y no se mueve el foco al cambiar campo y formulario de token; el campo de texto no vuelve a su altura tras un envío de varias líneas y no se deshabilita mientras espera; claves de React repetibles (chips y columnas con el mismo texto); el analizador acepta tablas sin columnas y rechaza un texto vacío que el esquema permite; el contador de «Pensando…» re-renderiza todo el `Dashboard` cada segundo; la línea «Datos hasta» sigue visible tras un 401; en iOS enfocar el campo amplía la página; la guarda de privacidad solo exige 3 archivos; en la documentación, `GET /api/health` figura como consumido (no se llama) y la fila de Chrome dice «solo `POST /api/ask`» cuando se usaron también `status`, `suggestions` y `feedback`.
- [ ] Desplegar: lo hace el dueño del servicio `selfbank` y el desarrollador en Vercel; pasos y comprobaciones en [`deploy-persistencia-raspberry.md`](../docs/arquitectura/deploy-persistencia-raspberry.md) (sección «Chat de consultas»). Hasta entonces no se cierra #24.
- [ ] `REQ-023` desplegado (no publica nada en la LAN) antes de abrir el servicio real.
- [ ] Riesgo aceptado de la entrega desde Vercel: CSP con `connect-src` o servir la PWA desde la Pi → backlog.
- [ ] `strict` no está activo en `tsconfig.app.json` → backlog.
- [ ] Voz a texto → `REQ-025`.
