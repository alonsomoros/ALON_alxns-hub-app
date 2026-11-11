import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { defaultGoals, defaultLinks } from '../data/dashboardData'
import { parsePreferences } from '../domain/preferences'
import { shouldAdoptRemote } from '../domain/persistedState'
import { loadPersistedState, PersistenceConflictError, persistenceEnabled, savePersistedState } from '../infrastructure/persistence'
import type { PersistenceStatus, UiPreferences } from '../types/dashboard'

const saveDebounceMs = 400

/**
 * Estado de retos, enlaces y preferencias sincronizado con el adaptador de persistencia (REQ-018, REQ-003).
 * Una base vacía (`version: 0`) no sustituye los datos de ejemplo; ante un conflicto (409) se recarga la versión y se reintenta una vez (gana el último cambio local).
 */
export function usePersistedDashboard(preferences: UiPreferences, onRemotePreferences: (preferences: UiPreferences) => void) {
  const [links, setLinks] = useState(defaultLinks)
  const [goals, setGoals] = useState(defaultGoals)
  const [isHydrated, setIsHydrated] = useState(!persistenceEnabled)
  const [status, setStatus] = useState<PersistenceStatus>(persistenceEnabled ? 'loading' : 'local')
  const version = useRef(0)
  const onRemote = useRef(onRemotePreferences)
  useEffect(() => { onRemote.current = onRemotePreferences }, [onRemotePreferences])

  useEffect(() => {
    if (!persistenceEnabled) return
    loadPersistedState().then(({ state, source }) => {
      setStatus(source === 'remote' ? 'online' : 'offline')
      if (state && shouldAdoptRemote(state)) {
        version.current = state.version
        setGoals(state.goals)
        setLinks(state.links.map((link) => ({ ...link, icon: Link2 })))
        if (state.preferences) onRemote.current(parsePreferences(state.preferences))
      }
    }).catch(() => setStatus('offline')).finally(() => setIsHydrated(true))
  }, [])

  useEffect(() => {
    if (!isHydrated || !persistenceEnabled) return
    const snapshot = () => ({
      version: version.current,
      preferences: { ...preferences },
      goals,
      links: links.map((link, position) => ({ id: link.id, label: link.label, url: link.url, logoUrl: link.logoUrl, position, archived: false })),
    })
    const persist = async () => {
      try {
        const saved = await savePersistedState(snapshot())
        if (saved) { version.current = saved.version; setStatus('online') }
      } catch (error) {
        if (!(error instanceof PersistenceConflictError)) { setStatus('offline'); return }
        try {
          const { state, source } = await loadPersistedState()
          if (source !== 'remote' || !state) { setStatus('offline'); return }
          version.current = state.version
          const saved = await savePersistedState(snapshot())
          if (saved) { version.current = saved.version; setStatus('online') }
        } catch {
          setStatus('offline')
        }
      }
    }
    const timer = window.setTimeout(() => void persist(), saveDebounceMs)
    return () => window.clearTimeout(timer)
  }, [goals, isHydrated, links, preferences])

  return { links, setLinks, goals, setGoals, status }
}
