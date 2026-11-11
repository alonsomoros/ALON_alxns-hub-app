import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultPreferences, greetingFor, moveCard, newerPreferences, parsePreferences, setCardVisible } from '../src/domain/preferences.ts'
import { shouldAdoptRemote } from '../src/domain/persistedState.ts'
import { readStoredPreferences, storePreferences } from '../src/infrastructure/preferencesStore.ts'

const ids = (cards: { id: string }[]) => cards.map((card) => card.id)

test('REQ-003 defaults: soft theme, bars, 60 s and four visible cards in order', () => {
  assert.deepEqual(defaultPreferences, {
    schemaVersion: 1, theme: 'soft', statsView: 'bars', piRefreshSeconds: 60, displayName: 'Alonso', updatedAt: '',
    homeCards: [{ id: 'pi', visible: true }, { id: 'goals', visible: true }, { id: 'services', visible: true }, { id: 'links', visible: true }],
  })
})

test('REQ-003 parsePreferences: non-object input falls back to defaults', () => {
  for (const raw of [null, undefined, 42, 'x', [], {}]) assert.deepEqual(parsePreferences(raw), defaultPreferences)
})

test('REQ-003 parsePreferences: unknown values fall back field by field', () => {
  const result = parsePreferences({ theme: 'neon', statsView: 'pie', piRefreshSeconds: 45 })
  assert.equal(result.theme, 'soft')
  assert.equal(result.statsView, 'bars')
  assert.equal(result.piRefreshSeconds, 60)
})

test('REQ-003 parsePreferences: keeps valid values', () => {
  const result = parsePreferences({ theme: 'dark', statsView: 'gauges', piRefreshSeconds: 30 })
  assert.deepEqual([result.theme, result.statsView, result.piRefreshSeconds], ['dark', 'gauges', 30])
})

test('REQ-003 parsePreferences: legacy API payload yields defaults without extra keys', () => {
  const legacy = { theme: 'soft', mode: 'light', quote: 'random', orderServices: ['a'], raspberryPiStatsShowcase: 'pbar' }
  assert.deepEqual(parsePreferences(legacy), defaultPreferences)
})

test('REQ-003 parsePreferences: homeCards drops duplicates and unknown ids and appends missing ones', () => {
  const result = parsePreferences({ homeCards: [{ id: 'goals', visible: true }, { id: 'goals', visible: false }, { id: 'nope', visible: true }] })
  assert.deepEqual(ids(result.homeCards), ['goals', 'pi', 'services', 'links'])
  assert.equal(result.homeCards[0].visible, true)
})

test('REQ-003 parsePreferences: all cards hidden forces the first one visible', () => {
  const hidden = defaultPreferences.homeCards.map((card) => ({ ...card, visible: false }))
  const result = parsePreferences({ homeCards: hidden })
  assert.deepEqual(result.homeCards.map((card) => card.visible), [true, false, false, false])
})

test('REQ-003 moveCard: moves within bounds and ignores moves past the ends', () => {
  const cards = defaultPreferences.homeCards
  assert.deepEqual(ids(moveCard(cards, 'goals', -1)), ['goals', 'pi', 'services', 'links'])
  assert.deepEqual(ids(moveCard(cards, 'pi', -1)), ['pi', 'goals', 'services', 'links'])
  assert.deepEqual(ids(moveCard(cards, 'links', 1)), ['pi', 'goals', 'services', 'links'])
})

test('REQ-003 setCardVisible: hides a card but refuses to hide the last visible one', () => {
  const cards = defaultPreferences.homeCards
  assert.equal(setCardVisible(cards, 'goals', false).find((card) => card.id === 'goals')?.visible, false)
  const onlyPi = cards.map((card) => ({ ...card, visible: card.id === 'pi' }))
  assert.deepEqual(setCardVisible(onlyPi, 'pi', false), onlyPi)
})

test('REQ-003 shouldAdoptRemote: only a saved state (version >= 1) replaces the defaults', () => {
  assert.equal(shouldAdoptRemote(null), false)
  assert.equal(shouldAdoptRemote({ version: 0 }), false)
  assert.equal(shouldAdoptRemote({ version: 3 }), true)
})

test('REQ-003 readStoredPreferences: blocked or corrupt storage yields defaults', () => {
  assert.deepEqual(readStoredPreferences({ getItem() { throw new Error('blocked') } }), defaultPreferences)
  assert.deepEqual(readStoredPreferences({ getItem: () => '{nope' }), defaultPreferences)
  assert.deepEqual(readStoredPreferences({ getItem: () => null }), defaultPreferences)
})

test('REQ-003 readStoredPreferences: reads what storePreferences wrote', () => {
  const memory = new Map<string, string>()
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) } }
  storePreferences({ ...defaultPreferences, theme: 'ocean' }, storage)
  assert.equal(readStoredPreferences(storage).theme, 'ocean')
})

test('REQ-003 storePreferences: a full or blocked storage does not throw', () => {
  assert.doesNotThrow(() => storePreferences(defaultPreferences, { setItem() { throw new Error('quota') } }))
})

test('REQ-003 parsePreferences: keeps a string updatedAt and ignores other types', () => {
  assert.equal(parsePreferences({ updatedAt: '2026-11-11T10:00:00.000Z' }).updatedAt, '2026-11-11T10:00:00.000Z')
  assert.equal(parsePreferences({ updatedAt: 123 }).updatedAt, '')
})

test('REQ-003 newerPreferences: the strictly newer copy wins and ties keep the local one', () => {
  const local = { ...defaultPreferences, theme: 'dark' as const, updatedAt: '2026-11-11T10:00:00.000Z' }
  const older = { ...defaultPreferences, theme: 'ocean' as const, updatedAt: '2026-11-11T09:00:00.000Z' }
  const newer = { ...older, updatedAt: '2026-11-11T11:00:00.000Z' }
  assert.deepEqual([newerPreferences(local, older).preferences.theme, newerPreferences(local, older).fromRemote], ['dark', false])
  assert.deepEqual([newerPreferences(local, newer).preferences.theme, newerPreferences(local, newer).fromRemote], ['ocean', true])
  assert.equal(newerPreferences(local, { ...older, updatedAt: local.updatedAt }).fromRemote, false)
})

test('REQ-003 newerPreferences: missing, invalid or legacy remote preferences never override local ones', () => {
  const local = { ...defaultPreferences, theme: 'dark' as const, updatedAt: '2026-11-11T10:00:00.000Z' }
  for (const remote of [null, undefined, 5, [], { theme: 'soft', mode: 'light', raspberryPiStatsShowcase: 'pbar' }]) {
    const result = newerPreferences(local, remote)
    assert.equal(result.preferences, local)
    assert.equal(result.fromRemote, false)
  }
})

test('REQ-003 parsePreferences: displayName is trimmed, limited to 40 characters and falls back to the default for non-strings', () => {
  assert.equal(parsePreferences({ displayName: '  Ana María ' }).displayName, 'Ana María')
  assert.equal(parsePreferences({ displayName: 'x'.repeat(60) }).displayName, 'x'.repeat(40))
  for (const value of [undefined, null, 5, [], {}]) assert.equal(parsePreferences({ displayName: value }).displayName, 'Alonso')
})

test('REQ-003 parsePreferences: an empty displayName is a valid choice (no name in the greeting)', () => {
  assert.equal(parsePreferences({ displayName: '' }).displayName, '')
  assert.equal(parsePreferences({ displayName: '   ' }).displayName, '')
})

test('REQ-003 greetingFor: builds the greeting with the trimmed name or none', () => {
  assert.equal(greetingFor('Alonso'), 'Hola, Alonso.')
  assert.equal(greetingFor('  Ana '), 'Hola, Ana.')
  assert.equal(greetingFor(''), 'Hola.')
  assert.equal(greetingFor('   '), 'Hola.')
})
