export interface PersistedGoalSnapshot { current: number; target: number; recordedAt: string }
export interface PersistedGoal { id: string; title: string; description: string; category: 'reading' | 'movement' | 'learning'; current: number; target: number; unit: string; archived: boolean; history: PersistedGoalSnapshot[] }
export interface PersistedLink { id: string; label: string; url: string; logoUrl?: string; position: number; archived: boolean }
export interface PersistedState { version: number; preferences: Record<string, unknown> | null; goals: PersistedGoal[]; links: PersistedLink[] }
export interface PersistenceLoadResult { state: PersistedState | null; source: 'remote' | 'cache' | 'empty' }

export const persistenceUrl = (import.meta.env.VITE_PERSISTENCE_API_URL as string | undefined)?.replace(/\/$/, '')
const requestTimeoutMs = 1500
const cacheKey = 'alxns:persistence-state'

export const persistenceEnabled = Boolean(persistenceUrl)

/** La API rechazó el guardado porque el estado cambió desde otro dispositivo (HTTP 409). */
export class PersistenceConflictError extends Error {}

const readCachedState = (): PersistedState | null => {
  try {
    const cached = window.localStorage.getItem(cacheKey)
    return cached ? JSON.parse(cached) as PersistedState : null
  } catch {
    return null
  }
}
const cacheState = (state: PersistedState) => {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(state))
  } catch {
  }
}

export const loadPersistedState = async (): Promise<PersistenceLoadResult> => {
  const cachedState = readCachedState()
  if (!persistenceUrl) return { state: cachedState, source: cachedState ? 'cache' : 'empty' }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    const response = await fetch(`${persistenceUrl}/api/state`, { signal: controller.signal })
    if (!response.ok) throw new Error(`Persistence request failed: ${response.status}`)
    const state = await response.json() as PersistedState
    cacheState(state)
    return { state, source: 'remote' }
  } catch {
    return { state: cachedState, source: cachedState ? 'cache' : 'empty' }
  } finally {
    window.clearTimeout(timeout)
  }
}

export const savePersistedState = async (state: PersistedState): Promise<PersistedState | null> => {
  cacheState(state)
  if (!persistenceUrl) return null
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    const response = await fetch(`${persistenceUrl}/api/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
      signal: controller.signal,
    })
    if (response.status === 409) throw new PersistenceConflictError('State version conflict')
    if (!response.ok) throw new Error(`Persistence request failed: ${response.status}`)
    const persistedState = await response.json() as PersistedState
    cacheState(persistedState)
    return persistedState
  } finally {
    window.clearTimeout(timeout)
  }
}
