# Chat de consultas con voz dentro del hub

- **Estado:** Propuesta (diseño escrito, pendiente de aprobación)
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

Se fijarán al aprobar el diseño. Propuesta:

- [ ] Vista «Consultas» con sugerencias, entrada de texto, respuesta con la interpretación visible, tabla y «no era eso».
- [ ] Estado «pensando…» con segundos, sin bloquear el hub; `unsupported`, `needs_clarification`, `401` y `503` con su mensaje.
- [ ] Sin token en URL, `localStorage`, bundle ni logs; preguntas y respuestas solo en memoria.
- [ ] El service worker no cachea nada de `selfbank` (prueba automática).
- [ ] Pruebas `node:test` con nombres `REQ-024` (dominio, cliente, privacidad) y comprobación en Chrome a ancho de móvil contra el simulado.
- [ ] Documentación y pasos de despliegue listos; despliegue comprobado en la Pi.

## Verificación

No aplica todavía.

## Impacto documental

Sin cambio: es una propuesta; al aprobarla se actualizarán `docs/arquitectura/`, `docs/requisitos/` y `.agents/context/system-status.md`.

## Pendientes

- [ ] Aprobación del diseño → plan de tareas → implementación y pruebas → despliegue.
- [ ] `REQ-023` desplegado antes de empezar.
