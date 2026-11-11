import { defaultPreferences, parsePreferences } from '../domain/preferences.ts'
import type { UiPreferences } from '../types/dashboard'

const storageKey = 'alxns:preferences'
const browserStorage = (): Storage | undefined => { try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined } }

/** Lee las preferencias locales de forma síncrona; ante cualquier fallo devuelve las de por defecto. */
export function readStoredPreferences(storage: Pick<Storage, 'getItem'> | undefined = browserStorage()): UiPreferences {
  try {
    const raw = storage?.getItem(storageKey)
    return raw ? parsePreferences(JSON.parse(raw)) : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

/** Guarda las preferencias en local; un almacenamiento lleno o bloqueado no lanza. */
export function storePreferences(preferences: UiPreferences, storage: Pick<Storage, 'setItem'> | undefined = browserStorage()): void {
  try {
    storage?.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // Sin almacenamiento local la app sigue funcionando con el estado en memoria.
  }
}
