import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMetric, metricPercent } from '../src/domain/piStats.ts'

test('metricPercent: clamps to 0-100 and treats missing or invalid values as 0', () => {
  assert.equal(metricPercent(NaN), 0)
  assert.equal(metricPercent(null), 0)
  assert.equal(metricPercent(undefined), 0)
  assert.equal(metricPercent(-5), 0)
  assert.equal(metricPercent(140), 100)
  assert.equal(metricPercent(42.5), 42.5)
  assert.equal(metricPercent(Infinity), 0)
})

test('formatMetric: loading, missing, integer and decimal values', () => {
  assert.equal(formatMetric(5, true), '…')
  assert.equal(formatMetric(null, false), '—')
  assert.equal(formatMetric(undefined, false), '—')
  assert.equal(formatMetric(NaN, false), '—')
  assert.equal(formatMetric(1.44, false), '1.4')
  assert.equal(formatMetric(30, false), '30')
})
