export interface SiteStatus { url: string; ok: boolean; status: number | null; ms: number | null }
export interface SiteHealth { checkedAt: string; sites: SiteStatus[] }
export type ServiceState = 'online' | 'offline' | 'unknown'

/** Misma normalización que `server/health.js`: `http`/`https`, host en minúsculas y sin barra final; `null` si no es válida. */
export function normalizeSiteUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

const isNumberOrNull = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))

/** Valida la respuesta de `GET /api/sites/health` (REQ-022); `null` si no cumple el contrato. */
export function parseSiteHealth(raw: unknown): SiteHealth | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const { checkedAt, sites } = raw as Record<string, unknown>
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt)) || !Array.isArray(sites)) return null
  const parsed: SiteStatus[] = []
  for (const site of sites) {
    if (typeof site !== 'object' || site === null) return null
    const { url, ok, status, ms } = site as Record<string, unknown>
    if (typeof url !== 'string' || typeof ok !== 'boolean' || !isNumberOrNull(status) || !isNumberOrNull(ms)) return null
    parsed.push({ url, ok, status: status as number | null, ms: ms as number | null })
  }
  return { checkedAt, sites: parsed }
}

/** Estado de un sitio según la última comprobación; sin dato o sin comprobar es `unknown`, nunca se supone que está arriba. */
export function serviceStateFor(url: string, health: SiteHealth | null): ServiceState {
  const key = normalizeSiteUrl(url)
  if (!health || !key) return 'unknown'
  const site = health.sites.find((item) => normalizeSiteUrl(item.url) === key)
  return site ? (site.ok ? 'online' : 'offline') : 'unknown'
}
