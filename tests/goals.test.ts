import { test } from 'node:test'
import assert from 'node:assert/strict'
import { archiveGoalById, createEmptyGoal, goalProgress, isValidGoal, upsertGoal } from '../src/domain/goals.ts'
import type { HabitGoal } from '../src/types/dashboard.ts'

const goal = (overrides: Partial<HabitGoal> = {}): HabitGoal => ({ id: 'g1', title: 'Leer', description: 'Leer cada día', category: 'reading', current: 5, target: 10, unit: 'páginas', archived: false, history: [], ...overrides })

test('REQ-008 goalProgress: derives the percentage from current / target and rounds it', () => {
  assert.equal(goalProgress(goal({ current: 5, target: 10 })), 50)
  assert.equal(goalProgress(goal({ current: 1, target: 3 })), 33)
})

test('REQ-008 goalProgress: is clamped to 0-100 and a zero or negative target gives 0', () => {
  assert.equal(goalProgress(goal({ current: 25, target: 10 })), 100)
  assert.equal(goalProgress(goal({ current: -4, target: 10 })), 0)
  assert.equal(goalProgress(goal({ current: 5, target: 0 })), 0)
  assert.equal(goalProgress(goal({ current: 5, target: -2 })), 0)
})

test('REQ-008 isValidGoal: requires title, description, unit, a positive target and a non-negative current', () => {
  assert.equal(isValidGoal(goal()), true)
  assert.equal(isValidGoal(goal({ title: '  ' })), false)
  assert.equal(isValidGoal(goal({ description: '' })), false)
  assert.equal(isValidGoal(goal({ unit: ' ' })), false)
  assert.equal(isValidGoal(goal({ target: 0 })), false)
  assert.equal(isValidGoal(goal({ current: -1 })), false)
  assert.equal(isValidGoal(goal({ current: 0 })), true)
})

test('REQ-008 createEmptyGoal: starts invalid (blank title) with a unique id and no history', () => {
  const a = createEmptyGoal()
  const b = createEmptyGoal()
  assert.notEqual(a.id, b.id)
  assert.equal(isValidGoal(a), false)
  assert.deepEqual(a.history, [])
  assert.equal(a.archived, false)
})

test('REQ-008 upsertGoal: appends a new goal and keeps the others untouched', () => {
  const existing = goal()
  const added = upsertGoal([existing], goal({ id: 'g2', title: 'Correr' }))
  assert.deepEqual(added.map((item) => item.id), ['g1', 'g2'])
  assert.equal(added[0], existing)
})

test('REQ-008 upsertGoal: changing the progress stores a snapshot of the previous values', () => {
  const [updated] = upsertGoal([goal({ current: 5, target: 10 })], goal({ current: 8, target: 10 }))
  assert.equal(updated.current, 8)
  assert.equal(updated.history.length, 1)
  assert.deepEqual([updated.history[0].current, updated.history[0].target], [5, 10])
  assert.ok(!Number.isNaN(Date.parse(updated.history[0].recordedAt)))
})

test('REQ-008 upsertGoal: changing the target also stores a snapshot, other edits do not', () => {
  const [retargeted] = upsertGoal([goal()], goal({ target: 20 }))
  assert.equal(retargeted.history.length, 1)
  const [renamed] = upsertGoal([goal()], goal({ title: 'Leer más' }))
  assert.equal(renamed.history.length, 0)
  assert.equal(renamed.title, 'Leer más')
})

test('REQ-008 upsertGoal: keeps the existing history and appends to it', () => {
  const past = { current: 1, target: 10, recordedAt: '2026-01-01T00:00:00.000Z' }
  const [updated] = upsertGoal([goal({ history: [past] })], goal({ current: 9, history: [] }))
  assert.equal(updated.history.length, 2)
  assert.deepEqual(updated.history[0], past)
})

test('REQ-008 archiveGoalById: archives only the matching goal and never deletes', () => {
  const result = archiveGoalById([goal(), goal({ id: 'g2' })], 'g2')
  assert.deepEqual(result.map((item) => [item.id, item.archived]), [['g1', false], ['g2', true]])
  assert.deepEqual(archiveGoalById([goal()], 'missing').map((item) => item.archived), [false])
})
