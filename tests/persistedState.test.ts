import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeAfterConflict } from '../src/domain/persistedState.ts'
import { defaultPreferences } from '../src/domain/preferences.ts'

const remoteGoals = [{ id: 'real-goal' }]
const remoteLinks = [{ id: 'real-link' }]
const remote = (preferences: unknown) => ({ version: 7, goals: remoteGoals, links: remoteLinks, preferences })

test('REQ-003 mergeAfterConflict: remote goals, links and version always win, never local data', () => {
  const merged = mergeAfterConflict(remote(null), defaultPreferences)
  assert.equal(merged.goals, remoteGoals)
  assert.equal(merged.links, remoteLinks)
  assert.equal(merged.version, 7)
})

test('REQ-003 mergeAfterConflict: newer local preferences are kept and flagged as not coming from the remote', () => {
  const local = { ...defaultPreferences, theme: 'dark' as const, updatedAt: '2026-11-11T10:00:00.000Z' }
  const merged = mergeAfterConflict(remote({ ...defaultPreferences, theme: 'ocean', updatedAt: '2026-11-11T09:00:00.000Z' }), local)
  assert.equal(merged.preferences.theme, 'dark')
  assert.equal(merged.preferencesFromRemote, false)
})

test('REQ-003 mergeAfterConflict: newer remote preferences replace the local ones', () => {
  const local = { ...defaultPreferences, theme: 'dark' as const, updatedAt: '2026-11-11T09:00:00.000Z' }
  const merged = mergeAfterConflict(remote({ ...defaultPreferences, theme: 'ocean', updatedAt: '2026-11-11T10:00:00.000Z' }), local)
  assert.equal(merged.preferences.theme, 'ocean')
  assert.equal(merged.preferencesFromRemote, true)
})
