/**
 * Cita del día para la PWA (REQ-021). La API pide una frase en español a un origen externo (sin CORS, por eso no
 * puede llamarse desde el navegador), la valida, la guarda en caché y la sirve en `GET /api/quote` como `{ content, author }`.
 */
const defaultUrl = 'https://frasedeldia.azurewebsites.net/api/phrase'
const maxContentLength = 400
const maxAuthorLength = 120

const clean = (value) => typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''

/**
 * Normaliza la respuesta del origen (`{ phrase, author }` o `{ content, author }`); `null` si no es una cita válida.
 * El origen devuelve a veces el JSON codificado dos veces (un string con el JSON dentro), así que también se acepta.
 */
export function parseUpstreamQuote(raw) {
  if (typeof raw === 'string') {
    try { return parseUpstreamQuote(JSON.parse(raw)) } catch { return null }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const content = clean(raw.phrase ?? raw.content)
  const author = clean(raw.author) || 'Anónimo'
  if (!content || content.length > maxContentLength || author.length > maxAuthorLength) return null
  return { content, author }
}

/**
 * Servicio con caché, una sola consulta compartida entre peticiones simultáneas y renovación en segundo plano:
 * al caducar la caché responde al instante con la cita anterior (el origen tarda ~1 s) y la renueva sin bloquear;
 * si el origen falla, sigue sirviendo la anterior. Solo la primera vez, sin caché, espera al origen (y devuelve `null` si falla).
 */
export function createQuoteService({ url = defaultUrl, fetchImpl = fetch, now = Date.now, ttlMs = 6 * 60 * 60 * 1000, timeoutMs = 5000 } = {}) {
  let cached = null
  let pending = null

  const refresh = async () => {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) return null
      const quote = parseUpstreamQuote(await response.json())
      if (quote) cached = { quote, at: now() }
      return quote
    } catch {
      return null
    }
  }

  const renew = () => {
    pending ??= refresh().finally(() => { pending = null })
    return pending
  }

  return {
    async getQuote() {
      if (!cached) return renew()
      if (now() - cached.at >= ttlMs) void renew()
      return cached.quote
    },
  }
}

const configuredUrl = process.env.QUOTE_URL?.trim()
export const { getQuote } = createQuoteService({ url: configuredUrl || defaultUrl })
