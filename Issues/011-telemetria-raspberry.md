# Telemetría de Raspberry Pi

- **Estado:** Propuesta
- **REQ:** REQ-011
- **Tipo:** feat
- **Área:** `docs/arquitectura/integrations-n8n-grafana.md`, futuro adaptador en `src/infrastructure/`
- **GitHub:** —
- **Actualizada:** 2026-11-11

## Problema

La tarjeta Raspberry muestra métricas estáticas, pero se quiere información cercana a tiempo real. Un navegador no puede observar la Raspberry de forma fiable sin un canal intermedio, autenticación y una política de actualización.

## Contrato de datos propuesto

```json
{
  "schemaVersion": 1,
  "deviceId": "raspberry-pi-5",
  "observedAt": "2026-10-28T12:00:00Z",
  "sequence": 42,
  "metrics": { "cpuBusyPercent": 24, "ramUsedPercent": 61, "storageUsedPercent": 48, "temperatureCelsius": 47 }
}
```

Validar rangos, timestamp, `deviceId` y `schemaVersion`. La app conserva `lastKnownGood`, muestra la edad del dato y distingue `loading`, `online`, `stale`, `offline` y `unreachable`.

## Opciones de transporte

| Opción | Ventaja | Coste |
|---|---|---|
| A. Polling directo desde la app cada 60 s | Simple, se recupera tras desconexiones | No es tiempo real; tráfico sin cambios |
| **B. Push Pi → n8n + polling web (recomendada provisional)** | Separa la Pi del navegador; n8n valida y guarda el último snapshot | Depende de n8n y de la autenticación del webhook |
| C. SSE/WebSocket | Latencia de segundos | Conexión persistente, autenticación, reconexión y proxy |

No usar `MutationObserver`: observa el DOM, no datos remotos.

## Decisión

Pendiente. Recomendación provisional: opción B con polling de 60 s, timeout de 1.5 s, `lastSeen`/staleness y fallback. Si luego se necesita latencia de segundos, evolucionar el adaptador a SSE/WebSocket sin cambiar el contrato.

## Criterios de aceptación

- [ ] Decisión de transporte y de seguridad aprobada por el desarrollador.
- [ ] Adaptador tipado con timeout de 1.5 s y estados `stale`/`offline`/`unreachable`.
- [ ] Tests de contrato, timeout y reconexión (`REQ-011 ...`).

## Verificación

No aplica: sin implementación.

## Impacto documental (al implementar)

`docs/arquitectura/integrations-n8n-grafana.md`, `data-flow.svg`, `.agents/context/environment-vars.md`, `.agents/skills/n8n-api-connectors.md`.

## Preguntas abiertas

- ¿"Tiempo real" significa segundos o basta con un minuto?
- ¿La Raspberry puede hacer HTTPS saliente y cómo se autentica el webhook?
- ¿n8n guarda histórico o solo el último snapshot?
- ¿Se necesita operar sin n8n mediante un endpoint local directo?
- ¿Qué retención y tolerancia de datos obsoletos se acepta?

## Pendientes

- [ ] Responder las preguntas y aprobar la decisión antes de implementar. No crear ADR hasta fijar la arquitectura.
