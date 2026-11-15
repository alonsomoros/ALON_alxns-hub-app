# Chat de consultas (REQ-024) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a la PWA la vista «Consultas»: un chat que habla directamente con la API de `selfbank` (misma Pi, por `tailscale serve`) con escritura, interpretación visible, tablas y feedback, probado contra el simulado del otro repositorio y documentado antes de cualquier despliegue.

**Architecture:** Dominio puro (`chat.ts`, `chatState.ts`) con validadores del contrato y estado de la conversación; un cliente HTTP inyectable (`selfbankClient.ts`) y un almacén de token en `sessionStorage` inyectable; un hook (`useChat`) y componentes React finos. No hay pasarela ni código nuevo en `server/`. La vista solo existe si `VITE_SELFBANK_URL` está definida.

**Tech Stack:** React 19 + TypeScript estricto + Vite, CSS plano con los tokens de tema existentes, `node:test` (`npm test`, módulos importados con extensión `.ts`), sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-16-chat-consultas-design.md`. Contrato de la API (manda): `C:\Users\Alonso\IdeaProjects\ALON_centralizedselfbank\docs\api-contrato.md` y `selfbank/api/schemas.json`.

## Global Constraints

- Proceso del repositorio (`WORKFLOW.md`): trabajo directo en `main` (sin worktree), commit y push tras validar. Mensaje por `git commit -F archivo` con los trailers `Refs #24`, `Issue local: Issues/024-chat-consultas.md`, `Requirements: REQ-024`, `Tests:`, `Docs:` y `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Los módulos bajo prueba no usan `import.meta.env`, DOM ni `window` en el nivel superior; se importan con extensión `.ts`. Los nombres de prueba empiezan por `REQ-024`.
- Token **solo** en `sessionStorage` (inyectado), nunca en URL, `localStorage`, bundle, logs ni `console.*`. Preguntas y respuestas **solo** en memoria. Sin `runtimeCaching` en `vite.config.ts`.
- Tiempos de espera: `status` y `suggestions` 1500 ms; `ask` 100 000 ms; el aviso «Pensando…» aparece a los 600 ms.
- Pregunta: 1–500 caracteres tras `trim`. Feedback: `{answer_id, verdict: "ok" | "wrong", correction?}` (`correction` ≤ 300).
- Aviso de consentimiento cuando `consent.days_left ≤ 14`.
- Texto de interfaz en español; solo tokens de color del tema (`var(--…)`), sin colores fijos; ancho móvil sin scroll horizontal.
- Sin dependencias nuevas. No se modifica el repositorio `selfbank` ni la Pi.
- Validación de cada tarea: `npm test`, `npm run lint`, `npm run build`; al final, el validador de notas (`validate.py` del scratchpad, `ALL OK`).

## Review Focus

Entradas que el spec implica y ninguna tarea «de camino feliz» cubre; cada una tiene su prueba en la tarea indicada:

1. `unsupported` o `needs_clarification` con una cifra (`kind` ≠ `none`) en la respuesta: se rechaza, nunca se pinta un número (Task 1).
2. `401` a mitad de sesión: el token se borra, vuelve el campo de token y la conversación se conserva con «Reintentar» (Tasks 2 y 4).
3. `503 model_busy` con `Retry-After` ausente o no numérico: espera por defecto de 10 s, nunca `NaN` (Task 2).
4. Cuerpo no JSON con estado de error (por ejemplo, el 502 en HTML de `tailscale serve` si `selfbank` está caído): error `network` con mensaje genérico, sin volcar el HTML (Task 2).
5. Tabla malformada (fila de distinta longitud que `columns`, o `data: null` con `kind: "table"`): toda la respuesta es inválida (Task 1).
6. Respuesta que llega después de borrar la conversación o cambiar de vista: no reaparece ni rompe el estado (Task 4).

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/domain/chat.ts` (nuevo) | Tipos del contrato, validadores, mensajes de error, formato de celdas, aviso de consentimiento. |
| `src/domain/chatState.ts` (nuevo) | Estado puro de la conversación y sus transiciones. |
| `src/infrastructure/selfbankClient.ts` (nuevo) | Cliente HTTP inyectable con tiempos de espera y errores tipados. |
| `src/infrastructure/selfbankToken.ts` (nuevo) | Almacén del token sobre un `Storage` inyectado. |
| `src/infrastructure/selfbankConfig.ts` (nuevo) | Lee `VITE_SELFBANK_URL` y crea el cliente y el almacén reales (único archivo con `import.meta.env`/`window`). |
| `src/hooks/useChat.ts` (nuevo) | Une cliente, almacén y estado; expone `ChatController`. |
| `src/components/chat/{ChatView,TokenGate,SuggestionChips,MessageList,AnswerCard,ThinkingBubble,Composer}.tsx` (nuevos) | Interfaz. |
| `src/components/{Dashboard,layout/SiteHeader}.tsx`, `src/types/dashboard.ts`, `src/index.css` | Navegación, vista y estilos. |
| `tests/{chat,chatState,selfbank-client,selfbank-token,chat-privacy,selfbank-contract}.test.ts` (nuevos) | Pruebas. |

---

### Task 1: Dominio del contrato (`chat.ts`)

**Files:**
- Create: `src/domain/chat.ts`
- Test: `tests/chat.test.ts`

**Interfaces:**
- Produces (exactos, los usan las tareas 2–5):

```ts
export type AnswerStatus = 'answered' | 'needs_clarification' | 'unsupported'
export type ColumnType = 'text' | 'date' | 'money' | 'count'
export interface TableColumn { key: string; label: string; type: ColumnType }
export type CellValue = string | number | null
export type AnswerData =
  | { kind: 'scalar'; value: number; unit: 'EUR' | 'count' }
  | { kind: 'table'; columns: TableColumn[]; rows: CellValue[][] }
  | { kind: 'none' }
export interface ChatAnswer {
  id: string; question: string; status: AnswerStatus
  reason: 'ambigua' | 'fuera_de_alcance' | 'operacion' | null
  source: 'rules' | 'model'
  interpretation: { title: string; chips: string[]; text: string }
  text: string; data: AnswerData; timingMs: number; mock: boolean
}
export interface ChatStatus {
  mode: 'mock' | 'live'; modelName: string; modelLoaded: boolean
  lastSync: string | null; dataThrough: string | null; accounts: number
  consentValidUntil: string | null; consentDaysLeft: number | null
}
export interface Suggestion { id: string; label: string; question: string }
export type ChatErrorCode = 'unauthorized' | 'model_busy' | 'timeout' | 'network' | 'invalid_response' | 'invalid_request' | 'not_found' | 'internal'
export interface ChatError { code: ChatErrorCode; retryAfterSeconds?: number }
export type Result<T> = { ok: true; value: T } | { ok: false; error: ChatError }
export const maxQuestionLength = 500
export const parseAskResponse = (raw: unknown): ChatAnswer | null
export const parseStatus = (raw: unknown): ChatStatus | null
export const parseSuggestions = (raw: unknown): Suggestion[] | null
export const parseApiErrorCode = (raw: unknown): string | null
export const normalizeQuestion = (input: string): string | null
export const messageForError = (error: ChatError): string
export const consentWarning = (daysLeft: number | null): string | null
export const formatCell = (value: CellValue, type: ColumnType): string
```

- [ ] **Step 1: Write the failing tests** in `tests/chat.test.ts` (valores del contrato `api-contrato.md`). Un `const scalarRaw` con el JSON de la respuesta de ejemplo (`id: 'ans_3f9c1a7b2d04'`, `status: 'answered'`, `source: 'rules'`, `interpretation` con `title`, `chips: ['restaurantes','1 oct – 31 oct 2026']`, `text`, `query: {…}`, `answer: { text, kind: 'scalar', data: { value: 1768.9, unit: 'EUR' } }`, `timing_ms: 3`, `mock: true`) y otro `tableRaw` (`kind: 'table'`, `data: { columns: [{key:'merchant',label:'Comercio',type:'text'},{key:'amount',label:'Importe',type:'money'}], rows: [['SUPERMERCADO DEMO', -42.5]] }`). Pruebas:
  - `REQ-024 parseAskResponse: accepts a scalar answer` → `text`, `data` `{kind:'scalar',value:1768.9,unit:'EUR'}`, `interpretation.chips`, `timingMs: 3`, `mock: true`, `source: 'rules'`.
  - `... accepts a table answer` → `data.kind === 'table'` con 1 fila.
  - `... accepts unsupported with no data` (`status:'unsupported'`, `reason:'fuera_de_alcance'`, `answer.kind:'none'`, `data:null`) → `data` `{kind:'none'}`.
  - `... rejects malformed responses`: no objeto; `id` que no cumple `/^ans_[0-9a-f]{12}$/`; `status` desconocido; `source` desconocida; `scalar` con `value` no numérico; `unit` desconocida; `answer.text` vacío; `chips` no es lista de cadenas; `kind` desconocido.
  - `... rejects a table with a row of a different length than the columns, and a table without data` (Review Focus 5).
  - `... never accepts figures on unsupported or needs_clarification answers` (`status:'unsupported'` o `'needs_clarification'` con `kind:'scalar'` o `'table'` → `null`; Review Focus 1).
  - `parseStatus: accepts a valid status and rejects an invalid mode` (mapea `data.last_sync` → `lastSync`, `consent.days_left` → `consentDaysLeft`, `days_left: null` válido).
  - `parseSuggestions: accepts a list, rejects an empty list and a question longer than 500`.
  - `parseApiErrorCode: reads error.code from the error envelope and ignores anything else`.
  - `normalizeQuestion: trims, rejects empty and over-long input` (500 caracteres válidos, 501 → `null`, `'   '` → `null`).
  - `consentWarning`: `null`→`null`, `15`→`null`, `14` → `'El consentimiento bancario caduca en 14 días: reautoriza pronto.'`, `1` → `'… caduca en 1 día: …'`, `0` y `-3` → `'El consentimiento bancario ha caducado: reautoriza el acceso.'`.
  - `messageForError`: para cada `ChatErrorCode` devuelve una cadena no vacía en español; `unauthorized` contiene `token`; `model_busy` con `retryAfterSeconds: 7` contiene `7`; ningún mensaje contiene `undefined` ni `NaN`.
  - `formatCell`: `money` igual a `new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(-42.5)` (comparando con espacios normalizados); `count` con separador `es-ES`; `date` `'2026-10-31'` igual a `new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date('2026-10-31T00:00:00Z'))`; `text` tal cual; `null` → `'—'`; un valor no numérico en una columna `money` se devuelve como texto.

- [ ] **Step 2: Run to verify it fails** — `npm test -- tests/chat.test.ts` (o `node --experimental-strip-types --test tests/chat.test.ts`). Expected: FAIL («Cannot find module» de `chat.ts`).

- [ ] **Step 3: Implement `src/domain/chat.ts`** con las firmas de Interfaces. Los validadores son estrictos (propiedades requeridas del `schemas.json`, tipos exactos, enums cerrados) y devuelven `null` ante cualquier incumplimiento; no lanzan. `parseAskResponse` aplica además las reglas de coherencia (Review Focus 1 y 5). Mensajes de error en español claros y sin detalles internos.

- [ ] **Step 4: Run to verify it passes** — mismo comando. Expected: PASS; luego `npm test` completo en verde.

- [ ] **Step 5: Commit** — `feat(chat): domain validators and messages for the selfbank contract (REQ-024)`.

---

### Task 2: Cliente HTTP y almacén del token

**Files:**
- Create: `src/infrastructure/selfbankClient.ts`, `src/infrastructure/selfbankToken.ts`
- Test: `tests/selfbank-client.test.ts`, `tests/selfbank-token.test.ts`

**Interfaces:**
- Consumes: todo de Task 1.
- Produces:

```ts
export interface SelfbankClientOptions {
  baseUrl: string
  getToken: () => string | null
  fetchImpl?: typeof fetch
  timeouts?: { quickMs: number; askMs: number }   // por defecto 1500 y 100000
}
export interface SelfbankClient {
  status(): Promise<Result<ChatStatus>>
  suggestions(): Promise<Result<Suggestion[]>>
  ask(question: string): Promise<Result<ChatAnswer>>
  feedback(answerId: string, verdict: 'ok' | 'wrong', correction?: string): Promise<Result<true>>
}
export const createSelfbankClient = (options: SelfbankClientOptions): SelfbankClient
export interface TokenStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface TokenStore { get(): string | null; set(token: string): void; clear(): void }
export const createTokenStore = (storage: TokenStorage | null): TokenStore   // clave 'alxns:selfbank-token'
```

- [ ] **Step 1: Write the failing client tests** (`tests/selfbank-client.test.ts`) con un servidor `node:http` real en el puerto `0` que registra método, URL, cabeceras y cuerpo, y cuya respuesta configura cada prueba (se cierra en `after`). Pruebas:
  - `REQ-024 client: ask sends a POST with the bearer token and the question in the JSON body, and nothing in the URL` → `Authorization: Bearer tok`, `Content-Type: application/json`, cuerpo `{"question":"¿Cuál es mi saldo?"}`, `url === '/api/ask'` (sin `?`), resultado `ok` con la respuesta analizada.
  - `... status and suggestions are GET requests with the token`.
  - `... without a token it fails with unauthorized and does not touch the network` (el servidor registra 0 peticiones).
  - `... a baseUrl with a trailing slash still works`.
  - `... maps error envelopes by code`: `401 unauthorized` → `unauthorized`; `400 invalid_request` → `invalid_request`; `404 not_found` → `not_found`; `500 internal` → `internal`; un código desconocido → `internal`.
  - `... model_busy reads Retry-After in seconds and defaults to 10 when missing or not numeric` (`7`→7; sin cabecera→10; `abc`→10; Review Focus 3).
  - `... an HTML error body (a 502 from the proxy) is a network error, and the body is not leaked` (Review Focus 4: `error.code === 'network'`; el `JSON.stringify(error)` no contiene el HTML).
  - `... a 200 with an invalid shape is invalid_response`.
  - `... ask times out with the injected askMs and quick routes with quickMs` (servidor que tarda 300 ms; `askMs: 50` → `timeout`; `quickMs: 50` → `timeout` en `status`).
  - `... a refused connection is a network error` (puerto cerrado).
  - `... feedback posts answer_id and verdict, omits an undefined correction and maps 404 to not_found`.

- [ ] **Step 2: Write the failing token-store tests** (`tests/selfbank-token.test.ts`) con un `Map` como almacenamiento: `set` recorta espacios y guarda bajo `'alxns:selfbank-token'`; `set('   ')` equivale a `clear`; `get` lee lo guardado; `clear` lo elimina y no toca otras claves; con un almacenamiento cuyo `setItem`/`getItem` lanzan, el token sigue disponible en memoria; con `null` funciona solo en memoria.

- [ ] **Step 3: Run to verify they fail** — `node --experimental-strip-types --test tests/selfbank-client.test.ts tests/selfbank-token.test.ts`. Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implement both modules.** El cliente usa `fetch` con `AbortController`, `cache: 'no-store'`, `credentials: 'omit'`; trata `AbortError` como `timeout`, cualquier otro fallo de red como `network`; valida cada respuesta con los `parse*` de Task 1; nunca registra por consola. Comprueba `normalizeQuestion` antes de enviar (si falla → `invalid_request` sin red). El almacén captura toda excepción del almacenamiento.

- [ ] **Step 5: Run to verify they pass**, `npm test` completo en verde.

- [ ] **Step 6: Commit** — `feat(chat): selfbank HTTP client with typed errors and a session-only token store (REQ-024)`.

---

### Task 3: Prueba de contrato contra el simulado real y pruebas de privacidad

**Files:**
- Create: `tests/selfbank-contract.test.ts`, `tests/chat-privacy.test.ts`

**Interfaces:**
- Consumes: `createSelfbankClient` (Task 2), `parse*` (Task 1).

- [ ] **Step 1: Write `tests/selfbank-contract.test.ts`.** Localiza el repositorio con `process.env.SELFBANK_REPO ?? '../ALON_centralizedselfbank'` (relativo a la raíz del hub); si no existe `selfbank/api/mock.py`, cada prueba se omite con `t.skip('repositorio selfbank no disponible')`. En `before`, lanza `python -B -m selfbank.api.mock --port <puerto libre> --token test-token --model-delay 0.2` con `cwd` en ese repositorio (`spawn` propio), espera a `GET /api/health` (máx. 10 s) y guarda el `child`; en `after`, `child.kill()` (solo ese proceso). Pruebas (cliente real, `askMs` 10 000):
  - `REQ-024 contract: the real mock status and suggestions parse` (modo `mock`, ≥ 1 sugerencia).
  - `... every suggested question is answered by the rules and parses` (todas `status:'answered'`, `source:'rules'`; al menos una con `data.kind === 'table'`).
  - `... an unknown question goes through the model path or is unsupported, never with figures` (`source:'model'` o `status` ≠ `answered` con `data.kind === 'none'`).
  - `... __busy__ is model_busy with a numeric retryAfterSeconds and __error__ is internal`.
  - `... a wrong token is unauthorized`.
  - `... feedback is stored for a real answer id and an unknown id is not_found` (`'ans_000000000000'`).

- [ ] **Step 2: Write `tests/chat-privacy.test.ts`.** Lee como texto los archivos del chat (`src/domain/chat.ts`, `src/domain/chatState.ts`, `src/infrastructure/selfbank*.ts`, `src/hooks/useChat.ts`, `src/components/chat/*.tsx`; omite los que aún no existan solo para los componentes y el hook) y comprueba: `REQ-024 privacy: no chat module uses localStorage` y `... no chat module writes to the console` (sin `console.`); `... vite.config.ts has no runtimeCaching, so the service worker never caches selfbank`; `... the token store key is only used by selfbankToken.ts` (la cadena `alxns:selfbank-token` aparece solo ahí).

- [ ] **Step 3: Run** — `node --experimental-strip-types --test tests/selfbank-contract.test.ts tests/chat-privacy.test.ts`. Expected: PASS (el de contrato ejecuta de verdad con Python 3.13 local; si el repositorio no estuviera, queda omitido y se anota en la nota del REQ). Si un `parse*` rechaza una respuesta real del simulado, es un defecto del validador de Task 1: corregirlo con una prueba nueva en `tests/chat.test.ts` que falle primero.

- [ ] **Step 4: Commit** — `test(chat): contract test against the real selfbank mock and privacy guards (REQ-024)`.

---

### Task 4: Estado de la conversación y hook

**Files:**
- Create: `src/domain/chatState.ts`, `src/hooks/useChat.ts`
- Test: `tests/chatState.test.ts`

**Interfaces:**
- Consumes: `ChatAnswer`, `ChatError`, `ChatStatus`, `Result`, `Suggestion` (Task 1); `SelfbankClient`, `TokenStore` (Task 2).
- Produces:

```ts
export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; answer: ChatAnswer; feedback: 'none' | 'wrong' }
  | { id: string; role: 'error'; question: string; error: ChatError }
export interface PendingAsk { id: string; question: string; startedAt: number }
export interface ChatState { messages: ChatMessage[]; pending: PendingAsk | null }
export const emptyChat: ChatState
export const startAsk = (state: ChatState, question: string, id: string, now: number): ChatState
export const resolveAsk = (state: ChatState, id: string, result: Result<ChatAnswer>): ChatState
export const markWrong = (state: ChatState, answerId: string): ChatState
export const clearChat = (): ChatState
export const elapsedSeconds = (pending: PendingAsk, now: number): number
export const thinkingDelayMs = 600
// useChat.ts
export interface ChatController {
  needsToken: boolean
  saveToken(token: string): void
  status: ChatStatus | null
  suggestions: Suggestion[]
  loadError: ChatError | null
  state: ChatState
  thinkingSeconds: number | null   // null si no hay petición o aún no pasaron 600 ms
  ask(question: string): void
  retry(question: string): void    // vuelve a preguntar (mismo efecto que ask)
  sendWrong(answerId: string): void
  reload(): void                   // reintenta status y suggestions
  clear(): void
}
export const useChat = (client: SelfbankClient | null, tokens: TokenStore, active: boolean): ChatController
```

- [ ] **Step 1: Write the failing tests** (`tests/chatState.test.ts`, sin DOM):
  - `REQ-024 chatState: startAsk appends the user message and sets pending` (id y `startedAt`).
  - `... startAsk is ignored while another question is pending` (devuelve el mismo estado).
  - `... resolveAsk with an answer clears pending and appends an assistant message with feedback none`.
  - `... resolveAsk with an error clears pending and appends an error message carrying the question` (para «Reintentar»; incluye `unauthorized`, Review Focus 2).
  - `... a late resolution after clearChat is ignored` (`resolveAsk` con un `id` que ya no es el pendiente devuelve el estado intacto; Review Focus 6).
  - `... markWrong flags only the matching assistant message`.
  - `... elapsedSeconds floors the seconds since startedAt and never goes negative`.
  - `... messages keep their order across several asks`.

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implement `chatState.ts`** (funciones puras e inmutables; el `id` de un mensaje de usuario es el de la petición; el de error, `e-<id>`).

- [ ] **Step 4: Run to verify it passes**, `npm test` completo en verde.

- [ ] **Step 5: Implement `useChat.ts`** (sin prueba automática: no hay runner de componentes; se verifica en Task 6). Comportamiento: con `client` `null` no hace nada. Mientras `active` y haya token, carga `status` y `suggestions` en paralelo (y en `reload`). Cualquier resultado `unauthorized` ejecuta `tokens.clear()` y deja `needsToken: true`; `saveToken` guarda el token y vuelve a cargar. `ask` valida con `normalizeQuestion`, usa `startAsk`/`resolveAsk` y un `AbortController` solo para ignorar el resultado al desmontar, no para cancelar. Al pasar `thinkingDelayMs` con una petición pendiente, `thinkingSeconds` pasa a contar (intervalo de 1 s; se limpia al terminar). `sendWrong` llama a `client.feedback(answerId, 'wrong')` y, si va bien, `markWrong`. El estado vive en `Dashboard` (el hook se llama allí), para que la conversación sobreviva al cambio de vista.

- [ ] **Step 6: Run** `npm run lint` y `npm run build`. Expected: sin errores.

- [ ] **Step 7: Commit** — `feat(chat): conversation state and useChat hook (REQ-024)`.

---

### Task 5: Interfaz, navegación y configuración

**Files:**
- Create: `src/infrastructure/selfbankConfig.ts`, `src/components/chat/{ChatView,TokenGate,SuggestionChips,MessageList,AnswerCard,ThinkingBubble,Composer}.tsx`
- Modify: `src/types/dashboard.ts` (añadir `'chat'` a `DashboardView`), `src/components/Dashboard.tsx`, `src/components/layout/SiteHeader.tsx`, `src/index.css`, `.env.example`

**Interfaces:**
- Consumes: `ChatController`, `useChat` (Task 4), `formatCell`, `messageForError`, `consentWarning` (Task 1), `createSelfbankClient`, `createTokenStore` (Task 2).
- Produces: `selfbankEnabled: boolean`, `selfbankClient: SelfbankClient | null` y `selfbankTokens: TokenStore` desde `selfbankConfig.ts` (lee `import.meta.env.VITE_SELFBANK_URL`, quita la `/` final; `window.sessionStorage` envuelto en `try`, `null` si falla).

- [ ] **Step 1: Configuración y navegación.** `selfbankConfig.ts` como arriba. `Dashboard` llama a `useChat(selfbankClient, selfbankTokens, activeView === 'chat')`, renderiza `ChatView` para la vista `chat` y pasa `chatEnabled={selfbankEnabled}` a `SiteHeader`, que añade «Consultas» a `navItems` solo si está habilitada. `.env.example` documenta `VITE_SELFBANK_URL` (URL pública, no secreta; comentario con el puerto de `tailscale serve`).

- [ ] **Step 2: Componentes** (comportamiento fijado por el spec):
  - `ChatView`: cabecera discreta con «Datos hasta …» (`dataThrough`, `Intl es-ES`), el modo `mock` visible como «Datos de ejemplo» y el aviso `consentWarning`; sugerencias solo si no hay mensajes; lista de mensajes; si `needsToken`, `TokenGate` sustituye al composer; botón «Borrar conversación» cuando hay mensajes; `loadError` muestra `messageForError` y un botón «Reintentar» (`reload`).
  - `TokenGate`: `input type="password" autocomplete="current-password" name="selfbank-token"` con etiqueta, botón «Entrar», sin mostrar ni registrar el valor.
  - `SuggestionChips`: botones que llaman a `ask(question)`.
  - `MessageList`: `role="log"` con `aria-live="polite"`; usuario a la derecha, asistente y errores a la izquierda; desplaza al último mensaje.
  - `AnswerCard`: `answer.text` como texto principal; **chips de `interpretation.chips` siempre visibles** junto al título; tabla con `formatCell` y alineación numérica a la derecha (contenedor con scroll horizontal propio en móvil, sin desbordar la página); distintivo «al instante» (`rules`) o «modelo» (`model`); botón «No era eso» (deshabilitado y marcado tras pulsar); para `needs_clarification`/`unsupported` solo el texto de la API, sin cifras.
  - Mensaje de error: `messageForError` + «Reintentar» (`retry(question)`).
  - `ThinkingBubble`: «Pensando… N s» con `thinkingSeconds`, `role="status"`.
  - `Composer`: `textarea` que crece hasta 5 líneas, `maxLength` 500, Enter envía y Mayús+Enter salta de línea, deshabilitada con una pregunta pendiente, botón de enviar con `aria-label`, sin perder el texto si falla.

- [ ] **Step 3: Estilos** en `src/index.css` (bloque nuevo, solo variables del tema; reutilizar `card`, `.back-button`/`.subview` donde encaje): burbujas, chips, tabla, composer fijo al borde inferior del contenido en móvil, estados `:focus-visible` visibles.

- [ ] **Step 4: Validate** — `npm test` (incluye `css-tokens` y `chat-privacy` con los componentes ya presentes), `npm run lint`, `npm run build`. Expected: todo en verde. Las pruebas de componentes quedan `Omitido: no cubierto por el runner`; se verifican en Task 6.

- [ ] **Step 5: Commit** — `feat(chat): the Consultas view with suggestions, visible interpretation, tables and feedback (REQ-024)`.

---

### Task 6: Verificación en Chrome a ancho de móvil contra el simulado

**Files:** ninguno de producto; resultados a `Issues/024-chat-consultas.md` (tabla de verificación).

- [ ] **Step 1: Arrancar el simulado en el PC** (proceso propio, anotando su PID para pararlo después): desde `ALON_centralizedselfbank`, `python -B -m selfbank.api.mock --port 8788 --token dev-token --model-delay 3 --cors-origin http://localhost:5173`. Arrancar Vite con `VITE_SELFBANK_URL=http://127.0.0.1:8788` y `VITE_PERSISTENCE_API_URL=` (vacío, sin API de persistencia).
- [ ] **Step 2: Recorrer con las herramientas de Chrome** (ancho 390 px, y una pasada a 1060 px): pestaña «Consultas» visible; token incorrecto → mensaje y campo de nuevo; `dev-token` → cabecera «Datos de ejemplo», sugerencias; pulsar una sugerencia → respuesta con chips de interpretación; pregunta por categorías → tabla sin desbordar la página; pregunta libre que pase por el «modelo» → «Pensando… N s» y respuesta; «No era eso» → marcado; `__busy__` y `__error__` → mensajes y «Reintentar»; cambiar de vista mientras piensa y volver → la respuesta está; recargar → conversación vacía y token pedido de nuevo; cambiar de tema (incl. oscuro) → legible; consola sin errores; comprobar en la pestaña de red que el token solo viaja en la cabecera `Authorization` y no hay peticiones a otros destinos.
- [ ] **Step 3: Parar** solo los procesos lanzados aquí (por PID verificado). Corregir lo que falle con TDD si es lógica de dominio o del cliente; si es de interfaz, corregir y repetir el paso afectado.
- [ ] **Step 4: Commit** de las correcciones, si las hubo — `fix(chat): … (REQ-024)`.

---

### Task 7: Documentación, despliegue preparado y cierre del trabajo local

**Files:**
- Modify: `Issues/024-chat-consultas.md` (estado `En curso`, criterios marcados, verificación, pasos de despliegue), `Issues/README.md`, `docs/arquitectura/{system-architecture,integrations-n8n-grafana,deploy-persistencia-raspberry}.md`, `docs/diagramas/data-flow.svg` y su Mermaid (sincronizados, `.agents/skills/diagrams.md`), `docs/requisitos/{functional-requirements,backlog-features}.md`, `docs/codebase/{INTEGRATIONS,STRUCTURE,TESTING}.md`, `.agents/context/{system-status,environment-vars}.md`, `docs/superpowers/specs/2026-11-16-chat-consultas-design.md` (estado `Aprobado`)

- [ ] **Step 1: Actualizar cada documento** con lo implementado (nombres de archivos y pruebas reales, la variable `VITE_SELFBANK_URL`, el flujo directo navegador → `selfbank`, la regla «sin `runtimeCaching`», la advertencia del riesgo de entrega desde Vercel y la mitigación futura). `FR-` nuevo para el chat en `functional-requirements.md`; backlog: CSP con `connect-src`, servir la PWA desde la Pi, memoria de conversación (fuera de la v1 de `selfbank`). `TESTING.md`: las seis suites nuevas y la prueba de contrato opcional.
- [ ] **Step 2: Guía de despliegue** en `deploy-persistencia-raspberry.md` y en la nota: lista para el dueño del servicio (publicar el servicio real en su propio puerto con `tailscale serve`, `--cors-origin` para Vercel y localhost, unidad `systemd`, token 600, sincronización periódica), variable `VITE_SELFBANK_URL` en Vercel con redeploy, comprobaciones (`GET /api/health` sin token, `GET /api/status` con y sin token, PWA de Vercel, CORS con `curl -H "Origin: …"`) y marcha atrás. Marcar como `[BLOQUEADO]`/pendiente lo que ejecuta otro (despliegue, `REQ-023` confirmado).
- [ ] **Step 3: Validación completa** — `npm test`, `npm run lint`, `npm run build`, `node --check server/*.js`, validador de notas (`ALL OK`).
- [ ] **Step 4: Commit y push** a `main` — `docs(chat): document and prepare the deployment of the queries chat (REQ-024)` con los trailers de `WORKFLOW.md`. La nota queda `En curso`: se cierra #24 solo tras desplegar y comprobar con el servicio real.
