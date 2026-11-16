import {
  normalizeQuestion, parseApiErrorCode, parseAskResponse, parseStatus, parseSuggestions,
  type ChatAnswer, type ChatError, type ChatStatus, type Result, type Suggestion,
} from '../domain/chat.ts'

/** Cliente de la API de `selfbank` (REQ-024). Sin `import.meta.env` ni `window`: la URL, el token y `fetch` se inyectan. Nunca escribe en consola. */
export interface SelfbankClientOptions {
  baseUrl: string
  getToken: () => string | null
  fetchImpl?: typeof fetch
  /** `quickMs` para `status` y `suggestions`; `askMs` para preguntas y feedback. */
  timeouts?: { quickMs: number; askMs: number }
}
export interface SelfbankClient {
  status(): Promise<Result<ChatStatus>>
  suggestions(): Promise<Result<Suggestion[]>>
  ask(question: string): Promise<Result<ChatAnswer>>
  feedback(answerId: string, verdict: 'ok' | 'wrong', correction?: string): Promise<Result<true>>
}

const defaultTimeouts = { quickMs: 1500, askMs: 100_000 }
const defaultRetrySeconds = 10
const failure = (error: ChatError): { ok: false; error: ChatError } => ({ ok: false, error })

const retryAfterSeconds = (header: string | null): number => {
  const value = header?.trim() ?? ''
  const seconds = /^\d+$/.test(value) ? Number(value) : 0
  return seconds >= 1 ? seconds : defaultRetrySeconds
}

/** Un error con cuerpo de la API se traduce por su código; sin cuerpo JSON (p. ej. el 502 del proxy) es un fallo de red. */
const errorFor = (body: unknown, retryAfter: string | null): ChatError => {
  const code = parseApiErrorCode(body)
  if (code === null) return { code: 'network' }
  switch (code) {
    case 'unauthorized': case 'invalid_request': case 'not_found': case 'internal': return { code }
    case 'model_busy': return { code: 'model_busy', retryAfterSeconds: retryAfterSeconds(retryAfter) }
    default: return { code: 'internal' }
  }
}

export const createSelfbankClient = (options: SelfbankClientOptions): SelfbankClient => {
  const baseUrl = options.baseUrl.replace(/\/+$/, '')
  const timeouts = options.timeouts ?? defaultTimeouts
  const doFetch = options.fetchImpl ?? ((input, init) => fetch(input, init))

  const call = async <T>(path: string, timeoutMs: number, parse: (raw: unknown) => T | null, body?: unknown): Promise<Result<T>> => {
    const token = options.getToken()
    if (!token) return failure({ code: 'unauthorized' })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await doFetch(`${baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      })
      const text = await response.text()
      let raw: unknown
      try { raw = JSON.parse(text) } catch { raw = undefined }
      if (!response.ok) return failure(errorFor(raw, response.headers.get('Retry-After')))
      const value = raw === undefined ? null : parse(raw)
      return value === null ? failure({ code: 'invalid_response' }) : { ok: true, value }
    } catch (error) {
      return failure({ code: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network' })
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    status: () => call('/api/status', timeouts.quickMs, parseStatus),
    suggestions: () => call('/api/suggestions', timeouts.quickMs, parseSuggestions),
    ask: (question) => {
      const normalized = normalizeQuestion(question)
      if (!normalized) return Promise.resolve(failure({ code: 'invalid_request' }))
      return call('/api/ask', timeouts.askMs, parseAskResponse, { question: normalized })
    },
    feedback: (answerId, verdict, correction) =>
      call('/api/feedback', timeouts.askMs, (raw): true | null => (typeof raw === 'object' && raw !== null && (raw as { stored?: unknown }).stored === true ? true : null),
        { answer_id: answerId, verdict, ...(correction === undefined ? {} : { correction }) }),
  }
}
