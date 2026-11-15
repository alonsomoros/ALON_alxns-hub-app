# Chat de consultas en el hub (REQ-024): diseño

- **Estado:** Aprobado por el desarrollador (16-nov-2026)
- **Nota:** `Issues/024-chat-consultas.md` · **Origen:** `ALON_centralizedselfbank/docs/hub-handoff-req-024.md` y `docs/api-contrato.md` de ese repositorio (el contrato manda).

## Intención

Consultar las cuentas bancarias desde la PWA del hub, con una conversación moderna e intuitiva y sin que ningún dato salga de la Pi. El motor ya existe en otro repositorio (`selfbank`: API HTTP en Python en la misma Pi, modelo local, cifras calculadas por SQL). El hub aporta solo la interfaz: escritura ahora, voz después (`REQ-025`).

## Objetivos

- Vista **Consultas** en la PWA: sugerencias, entrada de texto, respuesta con la interpretación visible, tabla cuando toca y botón «no era eso».
- Ningún dato bancario pasa por Vercel (solo entrega los archivos estáticos) ni por la API del hub.
- La credencial de `selfbank` sigue siendo suya: estar en la tailnet no basta.
- Todo probado y documentado antes de desplegar; cada fase útil por sí sola.

## No objetivos

- Pasarela o proxy en `server/` del hub; cualquier dato bancario en la API del hub.
- Guardar preguntas o respuestas en `localStorage`, en el servidor del hub o en la caché del service worker.
- Voz, memoria de conversación, varios usuarios (fuera de la v1 de `selfbank`; la voz es `REQ-025`).
- Cambios en el repositorio `selfbank` desde esta sesión.

## Anti-objetivos (fallos aunque «funcione»)

- Una cifra mostrada sin su interpretación, o inventada ante una pregunta no soportada.
- El token en la URL, `localStorage`, logs o el bundle.
- Una petición del chat que bloquee el resto del hub.

## Enfoques considerados

| Enfoque | Resumen | Veredicto |
|---|---|---|
| **A. Directo (elegido)** | La PWA llama a `selfbank` por `tailscale serve`, con CORS para el origen de Vercel y token Bearer en `sessionStorage`. | Menos piezas; respeta la credencial propia; no toca la red de Docker. |
| B. Pasarela en el hub con segundo factor | El contenedor llama a `selfbank` por `172.17.0.1`; el hub gestiona sesión y contraseña. | Más código y superficie (sesión, límite de intentos, red de Docker); misma experiencia para ti. |
| C. Pasarela sin segundo factor (handoff) | El hub añade el token por su cuenta. | Descartado: cualquier dispositivo de la tailnet leería el banco, contra el `AGENTS.md` de `selfbank`. |

Elegido el 16-nov-2026 por el desarrollador. La investigación de red (puerta de enlace de Docker `172.17.0.1`, IP de `ci-cd_default` no estable, alcance desde todos los contenedores) queda en `Issues/024` por si se retoma B.

## Diseño

```text
Móvil/PC (Tailscale)
  ├─ https://alxns-hub.vercel.app         → solo HTML/JS/CSS estáticos
  └─ fetch + Authorization: Bearer <token> → https://<pi>.ts.net:<puerto de selfbank>   (tailscale serve, tailnet only)
                                              └→ 127.0.0.1:8789 (selfbank) → SQLite + Ollama local
```

### Piezas

| Archivo | Responsabilidad |
|---|---|
| `src/domain/chat.ts` | Tipos y validadores puros: `parseAskResponse`, `parseStatus`, `parseSuggestions`, `parseApiError`; `messageForError(code)`; `consentWarning(daysLeft)` (≤ 14 días). Sin DOM ni `import.meta.env`. |
| `src/infrastructure/selfbankClient.ts` | `createSelfbankClient({ baseUrl, getToken, fetchImpl })`: `status`, `suggestions`, `ask`, `feedback`. Cabecera `Authorization`, `AbortController` (1,5 s para `status`/`suggestions`; 100 s para `ask`), errores tipados (`unauthorized`, `model_busy` con `retryAfter`, `timeout`, `network`, `invalid`). Inyectable, por eso se prueba con un servidor falso. |
| `src/infrastructure/selfbankToken.ts` | Token en `sessionStorage` con el almacenamiento inyectado; `try/catch`; nunca `localStorage`. |
| `src/hooks/useChat.ts` | Estado en memoria: mensajes, «pensando» con segundos, reintento, feedback. Se pierde al recargar (a propósito). |
| `src/components/chat/` | `ChatView` (estado, sugerencias, lista, composer), `TokenGate` (pide el token), `AnswerCard` (texto, chips de interpretación, tabla, «no era eso»), `ThinkingBubble`. |
| `Dashboard.tsx`, `SiteHeader.tsx`, `types/dashboard.ts` | Vista `chat` y entrada «Consultas» en la navegación; solo visible si `VITE_SELFBANK_URL` está definida. |
| `.env.example`, `.agents/context/environment-vars.md` | `VITE_SELFBANK_URL` (URL pública, no secreta; en Vercel se incrusta al compilar). |

### Experiencia

- Al abrir: si no hay token, `TokenGate` (campo `type=password` con `autocomplete="current-password"` para que el móvil lo rellene desde el gestor de contraseñas). Con token: `status` y `suggestions` a la vez; cabecera discreta con «datos hasta 14 nov» y el aviso de reautorizar cuando `consent.days_left ≤ 14`.
- Sin mensajes: chips de sugerencias pulsables que envían la pregunta.
- Entrada: `textarea` que crece; Enter envía, Mayús+Enter salta de línea; deshabilitada mientras espera. Pasados ~600 ms aparece «Pensando… 7 s» (región `aria-live="polite"`), sin bloquear el resto del hub; si el usuario cambia de vista, la petición sigue y la respuesta queda en la conversación.
- Respuesta: texto principal, **chips de interpretación** siempre visibles, tabla (`columns`/`rows`, importes con `Intl` en `es-ES`) y un distintivo «al instante» o «modelo». `needs_clarification` y `unsupported` se muestran como mensaje del asistente con el texto de la API y sugerencias; nunca una cifra.
- «No era eso» → `POST /api/feedback { verdict: "wrong" }`; el botón queda marcado.
- Errores: `401` borra el token y vuelve a `TokenGate`; `503 model_busy` ofrece reintentar tras `Retry-After`; red/timeout muestran un mensaje genérico y no pierden lo escrito.
- Diseño: respeta los temas existentes (variables CSS) y el ancho móvil; la voz (`REQ-025`) añadirá un botón al composer sin rehacerlo.
- Botón «Borrar conversación».

### Seguridad y privacidad

- Navegador → `selfbank` directo, solo tailnet (`tailscale serve`, sin Funnel). Vercel no ve consultas ni respuestas.
- Token solo en `sessionStorage` (contrato de `selfbank`), nunca en URL, `localStorage` ni bundle. Preguntas y respuestas solo en memoria.
- El service worker generado por `vite-plugin-pwa` solo precachea archivos estáticos; se añade una prueba que impide introducir `runtimeCaching` sin revisar esta regla. Las respuestas de `selfbank` ya llevan `Cache-Control: no-store`.
- **Riesgo aceptado:** la interfaz se entrega desde Vercel; si alguien comprometiera ese despliegue, un bundle manipulado podría leer el token y las respuestas dentro del navegador. Mitigaciones previstas, fuera de este REQ: una `Content-Security-Policy` con `connect-src` limitado a la API del hub y a `selfbank`, o servir la propia PWA desde la Pi.
- CORS en `selfbank`: solo `https://alxns-hub.vercel.app` y `http://localhost:5173`. Ya funciona hoy para el hub contra el mismo host `ts.net`.

### Configuración que necesita la Pi (lo hace el dueño del servicio, no esta sesión)

1. Servicio real de `selfbank` publicado en su propio puerto de `tailscale serve`, distinto del simulado (propuesta: `--https=8444 http://127.0.0.1:8789`; el 8443 sigue siendo el simulado para desarrollo).
2. Arrancarlo con `--cors-origin https://alxns-hub.vercel.app --cors-origin http://localhost:5173`.
3. Unidad `systemd` con reinicio automático, token en un fichero 600 y sincronización periódica (pendientes del otro repositorio).
4. Vercel: variable `VITE_SELFBANK_URL=https://raspberrypi.tail6f4cba.ts.net:8444` y redeploy.
5. `REQ-023` desplegado antes (no publica nada nuevo en la LAN).

## Pruebas (antes de cualquier despliegue)

- **Dominio** (`node:test`): cada respuesta del contrato (`answered`, `needs_clarification`, `unsupported`, tabla, escalar), formas inválidas, códigos de error, aviso de consentimiento.
- **Cliente** contra un servidor HTTP falso: cabecera `Authorization`, token fuera de la URL, tiempos de espera distintos por ruta, `401`, `503` con `Retry-After`, cuerpo no JSON, respuesta que incumple el esquema.
- **Privacidad**: el token solo toca `sessionStorage`; ningún módulo del chat usa `localStorage`; `vite.config.ts` sin `runtimeCaching`.
- **Contrato real** (opcional, se omite si no existe el repo): arrancar `python -m selfbank.api.mock` en el PC con un token de pruebas y comprobar que los validadores aceptan sus respuestas.
- **Chrome** a ancho de móvil contra el simulado local (`--cors-origin http://localhost:5173`): sugerencia, pregunta que pasa por el «modelo» simulado (`--model-delay 3`), tabla, «no era eso», `__busy__`, `__error__`, token inválido.
- `npm run lint`, `npm run build`, `npm test`, validador de notas.

## Documentación

`Issues/024` (decisión, estado, pasos de despliegue), `docs/arquitectura/{system-architecture,integrations-n8n-grafana,deploy-persistencia-raspberry}.md`, `docs/diagramas/data-flow` (SVG y Mermaid sincronizados), `docs/requisitos/functional-requirements.md` y `backlog-features.md`, `docs/codebase/{INTEGRATIONS,STRUCTURE,TESTING}.md`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`, `Issues/README.md`, nota nueva `REQ-025` (voz).

## Decisiones que quedan para el constructor (mis llamadas)

- Reutilizar `REQ-024` (`WORKFLOW` §2) y abrir `REQ-025` para la voz.
- Desarrollo y pruebas contra el simulado local, no contra el servicio de la Pi.
- Conversación solo en memoria; sin «recordar token» (el contrato lo prohíbe).
- La vista `chat` aparece solo con `VITE_SELFBANK_URL` definida.
