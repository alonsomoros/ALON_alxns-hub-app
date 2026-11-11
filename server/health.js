/**
 * Estado real de los sitios de Inicio (REQ-022). La API comprueba solo las URLs de su propia configuración
 * (`HEALTHCHECK_URLS`), nunca las que envíe un cliente, para no servir de proxy a cualquier destino.
 */
export const defaultSiteUrls = ['https://hipoglifo.es', 'https://el-negredo.vercel.app', 'https://alonsomoros.github.io']
const maxSites = 10

/** URL canónica de un sitio (`http`/`https`, host en minúsculas, sin barra final); `null` si no es válida. */
export function normalizeSiteUrl(value) {
  try {
    const url = new URL(String(value).trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

/** Lista separada por comas → URLs válidas, sin duplicados y como máximo 10; sin ninguna válida, los sitios por defecto. */
export function parseSiteUrls(value) {
  const urls = []
  for (const item of String(value ?? '').split(',')) {
    const normalized = normalizeSiteUrl(item)
    if (normalized && !urls.includes(normalized)) urls.push(normalized)
  }
  return urls.length ? urls.slice(0, maxSites) : [...defaultSiteUrls]
}

/**
 * Servicio con caché de 60 s, una sola ronda de comprobaciones compartida y renovación en segundo plano:
 * al caducar responde al instante con el resultado anterior (las comprobaciones pueden tardar hasta `timeoutMs`).
 * Cada sitio falla por separado. Una respuesta 2xx o 3xx cuenta como «arriba».
 */
export function createSiteHealth({ urls, fetchImpl = fetch, now = Date.now, ttlMs = 60_000, timeoutMs = 4000 }) {
  let cached = null
  let pending = null

  const request = (url, method) => fetchImpl(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })

  const checkSite = async (url) => {
    const started = Date.now()
    try {
      let response = await request(url, 'HEAD')
      if (response.status === 405 || response.status === 501) response = await request(url, 'GET')
      return { url, ok: response.status >= 200 && response.status < 400, status: response.status, ms: Date.now() - started }
    } catch {
      return { url, ok: false, status: null, ms: null }
    }
  }

  const refresh = async () => {
    const sites = await Promise.all(urls.map(checkSite))
    cached = { value: { checkedAt: new Date(now()).toISOString(), sites }, at: now() }
    return cached.value
  }

  const renew = () => {
    pending ??= refresh().finally(() => { pending = null })
    return pending
  }

  return {
    async getHealth() {
      if (!cached) return renew()
      if (now() - cached.at >= ttlMs) void renew()
      return cached.value
    },
  }
}

export const siteHealth = createSiteHealth({ urls: parseSiteUrls(process.env.HEALTHCHECK_URLS) })
export const getSiteHealth = () => siteHealth.getHealth()
