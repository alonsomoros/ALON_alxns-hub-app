import { useCallback, useEffect, useState } from 'react'
import { defaultPreferences } from '../domain/preferences'
import { readStoredPreferences, storePreferences } from '../infrastructure/preferencesStore'
import { applyTheme } from '../themes'
import type { UiPreferences } from '../types/dashboard'

/** Preferencias de interfaz (REQ-003): lectura local síncrona, persistencia local y aplicación del tema en cada cambio. */
export function usePreferences() {
  const [preferences, setPreferences] = useState<UiPreferences>(readStoredPreferences)

  useEffect(() => {
    storePreferences(preferences)
    applyTheme(preferences.theme)
  }, [preferences])

  const resetPreferences = useCallback(() => setPreferences(defaultPreferences), [])

  return { preferences, setPreferences, resetPreferences }
}
