# Cita del día en español vía la API personal

- **Estado:** En curso (implementada y probada en local; despliegue en la Raspberry pendiente)
- **REQ:** REQ-021
- **Tipo:** feat
- **Área:** `server/quote.js`, `server/index.js`, `src/domain/quote.ts`, `src/infrastructure/quote.ts`, `src/hooks/useQuote.ts`, `.env.example`
- **GitHub:** [#21](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/21)
- **Actualizada:** 2026-11-11

## Problema

La cita de Inicio usaba `https://api.quotable.io/random`, que ya no responde: la PWA siempre mostraba la frase de reserva. Se quiere una cita real, en español, inyectada en el `blockquote` de `HomeView` con los campos `content` y `author`.

## Decisión

Se compararon varias APIs (probadas con `curl` y cabecera `Origin`):

| API | Idioma | CORS desde el navegador | Resultado |
|---|---|---|---|
| `api.quotable.io` (la más conocida) | inglés | n/d | No responde |
| `zenquotes.io` | inglés | No | Funciona, pero el navegador no puede llamarla |
| `dummyjson.com/quotes/random` | inglés | Sí | Funciona; capitalización irregular |
| Espejo comunitario de Quotable | inglés | Sí | Funciona; no oficial |
| Dictum, Forismatic | — | — | No responden |
| `frasedeldia.azurewebsites.net/api/phrase` | español | No | Funciona (~1,1 s); frase del día, no oficial |

Ninguna API conocida ofrece español con CORS, así que la llamada pasa por la API personal:

```text
PWA --(1.5 s)--> GET /api/quote --> caché 6 h --> frasedeldia (5 s, 1 consulta compartida)
```

- **Contrato:** `{ "content": "...", "author": "..." }`; `503 { "error": "Quote unavailable" }` si no hay cita en caché y el origen falla.
- **Servidor** (`server/quote.js`): valida y limpia la respuesta (quita HTML, máximo 400 caracteres de texto y 120 de autor, autor por defecto «Anónimo»; acepta también el JSON codificado dos veces que el origen devuelve con algunas cabeceras `Accept`). La caché dura 6 h y, al caducar, responde al instante con la cita anterior y la renueva en segundo plano, porque el origen tarda ~1 s y la PWA espera 1.5 s. Se precalienta al arrancar. Variable opcional `QUOTE_URL`.
- **Cliente:** `fetchQuote` (timeout 1.5 s, sin API devuelve `null`) y `parseQuote` validan el contrato; `useQuote` muestra la frase de reserva local mientras carga o si falla. `HomeView` no cambia: el `blockquote` ya consume `{ content, author }`.
- **Descartado:** llamar a un origen en inglés directamente desde el navegador (idioma y capitalización) y traducir en el cliente (calidad y límites de uso).

## Criterios de aceptación

- [x] `GET /api/quote` devuelve `{ content, author }` en español, con caché y CORS de la API.
- [x] Respuestas inválidas, vacías, demasiado largas o con HTML se rechazan o se limpian.
- [x] Peticiones simultáneas comparten una sola consulta al origen; si el origen falla se sirve la cita anterior.
- [x] La PWA inyecta `content` y `author` en el `blockquote` y mantiene la frase de reserva sin API o ante un fallo (timeout de 1.5 s).
- [ ] Desplegado en la Raspberry y comprobado desde `https://alxns-hub.vercel.app`.

## Verificación

| Check | Resultado |
|---|---|
| `npm test` | OK: 47 pruebas (incluye `tests/quote-server.test.ts` y `tests/quote.test.ts`) |
| `npm run lint` / `npm run build` / `tsc -b` / `node --check server/*.js` | OK |
| API local contra el origen real | OK: `200` con `{ content, author }`; la segunda llamada sale de caché en ~2 ms; cabecera CORS correcta |
| Chrome contra la API local | OK: el `blockquote` muestra «El cobarde sólo amenaza cuando está a salvo.» — Goethe; sin errores de consola |
| Despliegue en la Pi | [BLOQUEADO] los comandos de escritura por SSH los ejecuta el desarrollador (ver Pendientes) |

Hallazgos durante la prueba: el origen tarda ~1,1 s por llamada y devuelve el JSON codificado dos veces cuando se envía `Accept: application/json`; ambos casos tienen prueba.

## Impacto documental

Actualizados: `docs/codebase/INTEGRATIONS.md`, `docs/arquitectura/integrations-n8n-grafana.md`, `docs/requisitos/{functional-requirements,backlog-features}.md`, `Issues/004`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`.

## Pendientes

- [ ] Desplegar en la Raspberry: `git pull --ff-only` y `docker compose --env-file .env -f docs/ci-cd/docker-compose.yml up -d --build` en `~/ALON_alxns-hub-app`; comprobar `GET /api/quote` y la PWA; la nota pasa a `Hecho` y se cierra #21.
- [ ] Origen no oficial: si desaparece, cambiar `QUOTE_URL` o el origen en `server/quote.js`; la PWA seguirá mostrando la frase de reserva.
- [ ] Modos `default` y `fav` de la cita → backlog (hoy solo `default` y `random`).
