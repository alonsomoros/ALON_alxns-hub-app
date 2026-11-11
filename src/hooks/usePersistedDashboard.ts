import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { defaultGoals, defaultLinks } from '../data/dashboardData'
import { mergeAfterConflict, shouldAdoptRemote } from '../domain/persistedState'
import { defaultPreferences, newerPreferences, parsePreferences } from '../domain/preferences'
import { createSaveQueue } from '../domain/saveQueue'
import { loadPersistedState, PersistenceConflictError, persistenceEnabled, savePersistedState, type PersistedLink } from '../infrastructure/persistence'
import type { HabitGoal, PersistenceStatus, QuickLink, UiPreferences } from '../types/dashboard'

const saveDebounceMs = 400

interface Snapshot { goals: HabitGoal[]; links: QuickLink[]; preferences: UiPreferences | null }

const toQuickLink = (link: PersistedLink): QuickLink => ({ ...link, icon: Link2 })

/**
 * Estado de retos, enlaces y preferencias sincronizado con el adaptador de persistencia (REQ-018, REQ-003).
 * - Una base vacía (`version: 0`) no sustituye los datos de ejemplo y no se guarda nada que el usuario no haya cambiado.
 * - Los guardados son de un solo vuelo y siempre envían el estado más reciente.
 * - Ante un conflicto (409) ganan los retos, enlaces y versión del servidor; solo se fusionan las preferencias (la más reciente por `updatedAt`).
 */
export function usePersistedDashboard(preferences: UiPreferences, onRemotePreferences: (preferences: UiPreferences) => void) {
  const [links, setLinks] = useState(defaultLinks)
  const [goals, setGoals] = useState(defaultGoals)
  const [isHydrated, setIsHydrated] = useState(!persistenceEnabled)
  const [status, setStatus] = useState<PersistenceStatus>(persistenceEnabled ? 'loading' : 'local')
  const version = useRef(0)
  const initialPreferences = useRef(preferences)
  const latest = useRef<Snapshot>({ goals, links, preferences })
  const baseline = useRef<Snapshot | null>(null)
  const onRemote = useRef(onRemotePreferences)
  const saveOnce = useRef<() => Promise<void>>(async () => {})
  const queue = useRef<ReturnType<typeof createSaveQueue> | null>(null)

  useEffect(() => { queue.current ??= createSaveQueue(() => saveOnce.current()) }, [])
  useEffect(() => { latest.current = { goals, links, preferences } }, [goals, links, preferences])
  useEffect(() => { onRemote.current = onRemotePreferences }, [onRemotePreferences])

  useEffect(() => {
    if (!persistenceEnabled) return
    loadPersistedState().then(({ state, source }) => {
      setStatus(source === 'remote' ? 'online' : 'offline')
      if (state && shouldAdoptRemote(state)) {
        const adoptedLinks = state.links.map(toQuickLink)
        const local = latest.current.preferences ?? defaultPreferences
        const { preferences: chosen, fromRemote } = newerPreferences(local, state.preferences)
        const localIsNewer = !fromRemote && local.updatedAt > parsePreferences(state.preferences).updatedAt
        version.current = state.version
        baseline.current = { goals: state.goals, links: adoptedLinks, preferences: localIsNewer ? null : chosen }
        setGoals(state.goals)
        setLinks(adoptedLinks)
        if (fromRemote) onRemote.current(chosen)
      }
    }).catch(() => setStatus('offline')).finally(() => {
      baseline.current ??= { goals: defaultGoals, links: defaultLinks, preferences: initialPreferences.current }
      setIsHydrated(true)
    })
  }, [])

  useEffect(() => {
    const toPayload = (snapshot: { goals: HabitGoal[]; links: QuickLink[]; preferences: UiPreferences }) => ({
      version: version.current,
      preferences: { ...snapshot.preferences },
      goals: snapshot.goals,
      links: snapshot.links.map((link, position) => ({ id: link.id, label: link.label, url: link.url, logoUrl: link.logoUrl, position, archived: false })),
    })
    saveOnce.current = async () => {
      const snapshot = { ...latest.current, preferences: latest.current.preferences ?? defaultPreferences }
      try {
        const saved = await savePersistedState(toPayload(snapshot))
        if (saved) { version.current = saved.version; setStatus('online') }
      } catch (error) {
        if (!(error instanceof PersistenceConflictError)) { setStatus('offline'); return }
        try {
          const { state, source } = await loadPersistedState()
          if (source !== 'remote' || !state || !shouldAdoptRemote(state)) { setStatus('offline'); return }
          const merged = mergeAfterConflict({ ...state, links: state.links.map(toQuickLink) }, snapshot.preferences)
          version.current = merged.version
          baseline.current = { goals: merged.goals, links: merged.links, preferences: merged.preferences }
          setGoals(merged.goals)
          setLinks(merged.links)
          if (merged.preferencesFromRemote) { onRemote.current(merged.preferences); setStatus('online'); return }
          const saved = await savePersistedState(toPayload({ goals: merged.goals, links: merged.links, preferences: merged.preferences }))
          if (saved) { version.current = saved.version; setStatus('online') }
        } catch {
          setStatus('offline')
        }
      }
    }
  })

  useEffect(() => {
    if (!isHydrated || !persistenceEnabled) return
    const base = baseline.current
    if (base && goals === base.goals && links === base.links && preferences === base.preferences) return
    const timer = window.setTimeout(() => void queue.current?.request().catch(() => undefined), saveDebounceMs)
    return () => window.clearTimeout(timer)
  }, [goals, isHydrated, links, preferences])

  return { links, setLinks, goals, setGoals, status }
}
