import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatLongDate, msUntilNextDay } from '../src/utils/date.ts'

const local = (hours: number, minutes = 0, seconds = 0) => new Date(2026, 10, 11, hours, minutes, seconds).getTime()

test('REQ-017 msUntilNextDay: counts the milliseconds to the next local midnight', () => {
  assert.equal(msUntilNextDay(local(23, 59, 0)), 60_000)
  assert.equal(msUntilNextDay(local(12)), 12 * 60 * 60 * 1000)
})

test('REQ-017 msUntilNextDay: at exactly midnight the next change is a full day away', () => {
  assert.equal(msUntilNextDay(local(0)), 24 * 60 * 60 * 1000)
})

test('REQ-017 msUntilNextDay: is never zero or negative, so a timer cannot spin', () => {
  for (const hours of [0, 1, 6, 12, 18, 23]) assert.ok(msUntilNextDay(local(hours, 59, 59)) > 0)
})

test('REQ-017 formatLongDate: Spanish long date in the local time zone', () => {
  assert.equal(formatLongDate(local(12)), '11 de noviembre de 2026')
})
