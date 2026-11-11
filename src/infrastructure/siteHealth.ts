import { parseSiteHealth, type SiteHealth } from '../domain/siteHealth'
import { persistenceUrl } from './persistence'

const requestTimeoutMs = 1500

/** Estado de los sitios desde `GET /api/sites/health` de la API personal (REQ-022). `null` si no hay API, falla, caduca o no es válido. */
export async function fetchSiteHealth(): Promise<SiteHealth | null> {
  if (!persistenceUrl) return null
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    const response = await fetch(`${persistenceUrl}/api/sites/health`, { signal: controller.signal })
    return response.ok ? parseSiteHealth(await response.json()) : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
