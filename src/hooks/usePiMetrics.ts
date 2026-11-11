import { useEffect, useRef, useState } from 'react'
import { fetchPiMetrics, piMetricsEnabled } from '../infrastructure/piMetrics'
import type { PiMetrics, PiMetricsStatus, PiRefreshSeconds } from '../types/dashboard'

/**
 * Métricas de la Raspberry (REQ-011): sondea cada `intervalSeconds` (30, 60 o 120; ajustable en REQ-003) mientras `enabled` y la pestaña es visible.
 * Conserva el último dato válido: si la API falla, `status` pasa a `stale` y `ageMinutes` indica su edad.
 */
export function usePiMetrics(enabled: boolean, intervalSeconds: PiRefreshSeconds = 60) {
  const [snapshot, setSnapshot] = useState<PiMetrics | null>(null)
  const [status, setStatus] = useState<PiMetricsStatus>(piMetricsEnabled ? 'loading' : 'prototype')
  const [ageMinutes, setAgeMinutes] = useState(0)
  const lastGood = useRef<PiMetrics | null>(null)

  useEffect(() => {
    if (!piMetricsEnabled || !enabled) return
    let cancelled = false
    const refresh = async () => {
      if (document.hidden) return
      const result = await fetchPiMetrics()
      if (cancelled) return
      if (result) {
        lastGood.current = result
        setSnapshot(result)
        setAgeMinutes(0)
        setStatus(result.sources.prometheus === 'ok' && result.sources.docker !== 'unreachable' ? 'online' : 'degraded')
        return
      }
      const previous = lastGood.current
      if (previous) setAgeMinutes(Math.max(1, Math.round((Date.now() - Date.parse(previous.observedAt)) / 60_000)))
      setStatus(previous ? 'stale' : 'offline')
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), intervalSeconds * 1000)
    const onVisibilityChange = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, intervalSeconds])

  return { snapshot, status, ageMinutes }
}
