import { newerPreferences } from './preferences.ts'
import type { UiPreferences } from '../types/dashboard'

/**
 * La API devuelve `version: 0` cuando la base de datos está vacía (nunca se ha guardado nada).
 * Solo un estado ya guardado (`version >= 1`) debe sustituir los datos de ejemplo.
 */
export const shouldAdoptRemote = (state: { version: number } | null): boolean => state !== null && state.version >= 1

/**
 * Resultado de un conflicto de versión (409): los retos, enlaces y la versión del servidor siempre ganan (un cliente
 * desfasado nunca debe pisar datos reales con datos de ejemplo o de caché) y solo se fusionan las preferencias, con
 * la copia más reciente por `updatedAt`.
 */
export function mergeAfterConflict<G, L>(remote: { version: number; goals: G[]; links: L[]; preferences: unknown }, local: UiPreferences) {
  const { preferences, fromRemote } = newerPreferences(local, remote.preferences)
  return { version: remote.version, goals: remote.goals, links: remote.links, preferences, preferencesFromRemote: fromRemote }
}
