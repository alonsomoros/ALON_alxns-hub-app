import { useCallback, useEffect, useState } from 'react'
import { defaultPreferences } from '../domain/preferences'
import { readStoredPreferences, storePreferences } from '../infrastructure/preferencesStore'
import { applyTheme } from '../themes'
import type { UiPreferences } from '../types/dashboard'

/**
 * Preferencias de interfaz (REQ-003): lectura local síncrona, persistencia local y aplicación del tema en cada cambio.
 * - `updatePreferences` y `resetPreferences` son cambios del usuario y marcan `updatedAt`.
 * - `applyRemotePreferences` adopta las preferencias de la API tal cual (conservan su `updatedAt`).
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<UiPreferences>(readStoredPreferences)

  useEffect(() => {
    storePreferences(preferences)
    applyTheme(preferences.theme)
  }, [preferences])

  const updatePreferences = useCallback((next: UiPreferences) => setPreferences({ ...next, updatedAt: new Date().toISOString() }), [])
  const resetPreferences = useCallback(() => setPreferences({ ...defaultPreferences, updatedAt: new Date().toISOString() }), [])

  return { preferences, updatePreferences, applyRemotePreferences: setPreferences, resetPreferences }
}
