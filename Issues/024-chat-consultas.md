# Chat de consultas con voz dentro del hub

- **Estado:** Propuesta
- **REQ:** REQ-024
- **Tipo:** architecture
- **Área:** `src/components/` (vista de chat), `server/` o servicio nuevo en la Pi, `docs/arquitectura/`
- **GitHub:** [#24](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/24)
- **Actualizada:** 2026-11-13

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

## Fases propuestas

1. Endurecer el perímetro: `REQ-023` y autenticación de la API.
2. Chat con comandos y atajos sobre el catálogo de consultas, sin modelo (solo escritura).
3. Interpretación de lenguaje natural con un modelo (local o API externa, a decidir) limitada al catálogo.
4. Voz a texto.

## Decisiones abiertas (necesitan respuesta del desarrollador)

- [ ] ¿Cómo expone datos el proyecto de banca: API HTTP, base de datos o ficheros? ¿Corre en la misma Pi?
- [ ] ¿Qué consultas se hacen hoy por WhatsApp? Con 5 o 10 ejemplos reales se decide si basta el catálogo.
- [ ] ¿Modelo local (más privado, más limitado) o API externa (más capaz, los datos de cada consulta salen de la Pi)?
- [ ] ¿El servicio del chat vive en esta API o aparte, con su propio contenedor?

## Criterios de aceptación

Se definirán al aprobar el diseño (spec en `docs/superpowers/specs/`).

## Verificación

No aplica todavía.

## Impacto documental

Sin cambio: es una propuesta; al aprobarla se actualizarán `docs/arquitectura/`, `docs/requisitos/` y `.agents/context/system-status.md`.

## Pendientes

- [ ] Responder las decisiones abiertas → diseño y plan.
- [ ] `REQ-023` desplegado antes de empezar.
