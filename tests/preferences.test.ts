import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultPreferences, moveCard, parsePreferences, setCardVisible } from '../src/domain/preferences.ts'
import { shouldAdoptRemote } from '../src/domain/persistedState.ts'
import { readStoredPreferences, storePreferences } from '../src/infrastructure/preferencesStore.ts'

const ids = (cards: { id: string }[]) => cards.map((card) => card.id)

test('defaults: soft theme, bars, 60 s and four visible cards in order', () => {
  assert.deepEqual(defaultPreferences, {
    schemaVersion: 1, theme: 'soft', statsView: 'bars', piRefreshSeconds: 60,
    homeCards: [{ id: 'pi', visible: true }, { id: 'goals', visible: true }, { id: 'services', visible: true }, { id: 'links', visible: true }],
  })
})

test('parsePreferences: non-object input falls back to defaults', () => {
  for (const raw of [null, undefined, 42, 'x', [], {}]) assert.deepEqual(parsePreferences(raw), defaultPreferences)
})

test('parsePreferences: unknown values fall back field by field', () => {
  const result = parsePreferences({ theme: 'neon', statsView: 'pie', piRefreshSeconds: 45 })
  assert.equal(result.theme, 'soft')
  assert.equal(result.statsView, 'bars')
  assert.equal(result.piRefreshSeconds, 60)
})

test('parsePreferences: keeps valid values', () => {
  const result = parsePreferences({ theme: 'dark', statsView: 'gauges', piRefreshSeconds: 30 })
  assert.deepEqual([result.theme, result.statsView, result.piRefreshSeconds], ['dark', 'gauges', 30])
})

test('parsePreferences: legacy API payload yields defaults without extra keys', () => {
  const legacy = { theme: 'soft', mode: 'light', quote: 'random', orderServices: ['a'], raspberryPiStatsShowcase: 'pbar' }
  assert.deepEqual(parsePreferences(legacy), defaultPreferences)
})

test('parsePreferences: homeCards drops duplicates and unknown ids and appends missing ones', () => {
  const result = parsePreferences({ homeCards: [{ id: 'goals', visible: true }, { id: 'goals', visible: false }, { id: 'nope', visible: true }] })
  assert.deepEqual(ids(result.homeCards), ['goals', 'pi', 'services', 'links'])
  assert.equal(result.homeCards[0].visible, true)
})

test('parsePreferences: all cards hidden forces the first one visible', () => {
  const hidden = defaultPreferences.homeCards.map((card) => ({ ...card, visible: false }))
  const result = parsePreferences({ homeCards: hidden })
  assert.deepEqual(result.homeCards.map((card) => card.visible), [true, false, false, false])
})

test('moveCard: moves within bounds and ignores moves past the ends', () => {
  const cards = defaultPreferences.homeCards
  assert.deepEqual(ids(moveCard(cards, 'goals', -1)), ['goals', 'pi', 'services', 'links'])
  assert.deepEqual(ids(moveCard(cards, 'pi', -1)), ['pi', 'goals', 'services', 'links'])
  assert.deepEqual(ids(moveCard(cards, 'links', 1)), ['pi', 'goals', 'services', 'links'])
})

test('setCardVisible: hides a card but refuses to hide the last visible one', () => {
  const cards = defaultPreferences.homeCards
  assert.equal(setCardVisible(cards, 'goals', false).find((card) => card.id === 'goals')?.visible, false)
  const onlyPi = cards.map((card) => ({ ...card, visible: card.id === 'pi' }))
  assert.deepEqual(setCardVisible(onlyPi, 'pi', false), onlyPi)
})

test('shouldAdoptRemote: only a saved state (version >= 1) replaces the defaults', () => {
  assert.equal(shouldAdoptRemote(null), false)
  assert.equal(shouldAdoptRemote({ version: 0 }), false)
  assert.equal(shouldAdoptRemote({ version: 3 }), true)
})

test('readStoredPreferences: blocked or corrupt storage yields defaults', () => {
  assert.deepEqual(readStoredPreferences({ getItem() { throw new Error('blocked') } }), defaultPreferences)
  assert.deepEqual(readStoredPreferences({ getItem: () => '{nope' }), defaultPreferences)
  assert.deepEqual(readStoredPreferences({ getItem: () => null }), defaultPreferences)
})

test('readStoredPreferences: reads what storePreferences wrote', () => {
  const memory = new Map<string, string>()
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) } }
  storePreferences({ ...defaultPreferences, theme: 'ocean' }, storage)
  assert.equal(readStoredPreferences(storage).theme, 'ocean')
})

test('storePreferences: a full or blocked storage does not throw', () => {
  assert.doesNotThrow(() => storePreferences(defaultPreferences, { setItem() { throw new Error('quota') } }))
})
