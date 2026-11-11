import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { defaultGoals, defaultLinks } from '../data/dashboardData'
import { loadPersistedState, persistenceEnabled, savePersistedState } from '../infrastructure/persistence'
import type { PersistenceStatus } from '../types/dashboard'

/** Estado de retos y enlaces sincronizado con el adaptador de persistencia (REQ-018). */
export function usePersistedDashboard() {
  const [links, setLinks] = useState(defaultLinks)
  const [goals, setGoals] = useState(defaultGoals)
  const [isHydrated, setIsHydrated] = useState(!persistenceEnabled)
  const [status, setStatus] = useState<PersistenceStatus>(persistenceEnabled ? 'loading' : 'local')
  const version = useRef(0)

  useEffect(() => {
    if (!persistenceEnabled) return
    loadPersistedState().then(({ state, source }) => {
      setStatus(source === 'remote' ? 'online' : 'offline')
      if (state) {
        version.current = state.version
        setGoals(state.goals)
        setLinks(state.links.map((link) => ({ ...link, icon: Link2 })))
      }
    }).catch(() => setStatus('offline')).finally(() => setIsHydrated(true))
  }, [])

  useEffect(() => {
    if (!isHydrated || !persistenceEnabled) return
    savePersistedState({
      version: version.current,
      preferences: null, // Se sustituye por las preferencias reales en la tarea de sincronización (REQ-003).
      goals,
      links: links.map((link, position) => ({ id: link.id, label: link.label, url: link.url, logoUrl: link.logoUrl, position, archived: false })),
    }).then((persistedState) => {
      if (persistedState) {
        version.current = persistedState.version
        setStatus('online')
      }
    }).catch(() => setStatus('offline'))
  }, [goals, isHydrated, links])

  return { links, setLinks, goals, setGoals, status }
}
