import { useEffect, useState } from 'react'
import type { SiteHealth } from '../domain/siteHealth'
import { persistenceEnabled } from '../infrastructure/persistence'
import { fetchSiteHealth } from '../infrastructure/siteHealth'

const pollIntervalMs = 60_000

/**
 * Estado real de los sitios (REQ-022): sondea cada 60 s mientras `enabled` y la pestaña es visible, y al volver a ella.
 * Si la API falla conserva la última comprobación válida. Sin API configurada devuelve `null` y la vista usa los datos de ejemplo.
 */
export function useSiteHealth(enabled: boolean): SiteHealth | null {
  const [health, setHealth] = useState<SiteHealth | null>(null)

  useEffect(() => {
    if (!persistenceEnabled || !enabled) return
    let cancelled = false
    const refresh = async () => {
      if (document.hidden) return
      const result = await fetchSiteHealth()
      if (cancelled || !result) return
      setHealth(result)
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), pollIntervalMs)
    const onVisibilityChange = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled])

  return health
}
