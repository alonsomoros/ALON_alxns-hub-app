import type { HomeCardId, HomeCardPref, PiRefreshSeconds, StatsView, UiPreferences } from '../types/dashboard'
import { themeIds, type ThemeId } from '../themes.ts'

const cardIds: HomeCardId[] = ['pi', 'goals', 'services', 'links']
const statsViews: StatsView[] = ['bars', 'rings', 'gauges']
export const refreshOptions: PiRefreshSeconds[] = [30, 60, 120]

export const defaultPreferences: UiPreferences = {
  schemaVersion: 1,
  theme: 'soft',
  statsView: 'bars',
  piRefreshSeconds: 60,
  homeCards: cardIds.map((id) => ({ id, visible: true })),
  updatedAt: '',
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function parseCards(raw: unknown): HomeCardPref[] {
  const seen = new Set<HomeCardId>()
  const cards: HomeCardPref[] = []
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isRecord(item) || !cardIds.includes(item.id as HomeCardId) || seen.has(item.id as HomeCardId)) continue
    seen.add(item.id as HomeCardId)
    cards.push({ id: item.id as HomeCardId, visible: item.visible !== false })
  }
  for (const id of cardIds) if (!seen.has(id)) cards.push({ id, visible: true })
  return cards.some((card) => card.visible) ? cards : cards.map((card, index) => ({ ...card, visible: index === 0 }))
}

/** Valida preferencias de origen desconocido (API, almacenamiento local): cada campo inválido recurre a su valor por defecto. */
export function parsePreferences(raw: unknown): UiPreferences {
  const source = isRecord(raw) ? raw : {}
  return {
    schemaVersion: 1,
    theme: themeIds.includes(source.theme as ThemeId) ? source.theme as ThemeId : defaultPreferences.theme,
    statsView: statsViews.includes(source.statsView as StatsView) ? source.statsView as StatsView : defaultPreferences.statsView,
    piRefreshSeconds: refreshOptions.includes(source.piRefreshSeconds as PiRefreshSeconds) ? source.piRefreshSeconds as PiRefreshSeconds : defaultPreferences.piRefreshSeconds,
    homeCards: parseCards(source.homeCards),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : '',
  }
}

/** Elige entre las preferencias locales y las remotas: gana la copia estrictamente más reciente (`updatedAt`); en empate o si la remota no es válida, la local. */
export function newerPreferences(local: UiPreferences, remoteRaw: unknown): { preferences: UiPreferences; fromRemote: boolean } {
  if (!isRecord(remoteRaw)) return { preferences: local, fromRemote: false }
  const remote = parsePreferences(remoteRaw)
  return remote.updatedAt > local.updatedAt ? { preferences: remote, fromRemote: true } : { preferences: local, fromRemote: false }
}

/** Mueve una tarjeta una posición; en los extremos devuelve el mismo orden. */
export function moveCard(cards: HomeCardPref[], id: HomeCardId, direction: -1 | 1): HomeCardPref[] {
  const from = cards.findIndex((card) => card.id === id)
  const to = from + direction
  if (from < 0 || to < 0 || to >= cards.length) return cards
  const next = [...cards]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

/** Cambia la visibilidad de una tarjeta; nunca deja todas ocultas. */
export function setCardVisible(cards: HomeCardPref[], id: HomeCardId, visible: boolean): HomeCardPref[] {
  if (!visible && cards.filter((card) => card.visible && card.id !== id).length === 0) return cards
  return cards.map((card) => card.id === id ? { ...card, visible } : card)
}
