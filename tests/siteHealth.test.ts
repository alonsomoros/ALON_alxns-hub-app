import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSiteUrl as serverNormalize } from '../server/health.js'
import { normalizeSiteUrl, parseSiteHealth, serviceStateFor } from '../src/domain/siteHealth.ts'

const health = { checkedAt: '2026-11-11T18:00:00.000Z', sites: [{ url: 'https://up.test', ok: true, status: 200, ms: 40 }, { url: 'https://down.test', ok: false, status: 503, ms: 90 }, { url: 'https://dead.test', ok: false, status: null, ms: null }] }

test('REQ-022 client normalizeSiteUrl matches the server for every case', () => {
  for (const value of ['https://Example.COM/', 'https://example.com/app/', 'http://example.com:8080', '', 'nope', 'ftp://example.com', 'https://']) {
    assert.equal(normalizeSiteUrl(value), serverNormalize(value), value)
  }
})

test('REQ-022 parseSiteHealth: accepts the endpoint contract', () => {
  assert.deepEqual(parseSiteHealth(health), health)
})

test('REQ-022 parseSiteHealth: rejects anything that is not the contract', () => {
  for (const raw of [null, undefined, 4, 'x', [], {}, { checkedAt: 'x', sites: [] }, { checkedAt: health.checkedAt }, { checkedAt: health.checkedAt, sites: 'nope' },
    { checkedAt: health.checkedAt, sites: [{ url: 'https://a.test', ok: 'yes', status: 200, ms: 1 }] },
    { checkedAt: health.checkedAt, sites: [{ url: 5, ok: true, status: 200, ms: 1 }] },
    { checkedAt: health.checkedAt, sites: [{ url: 'https://a.test', ok: true, status: 'x', ms: 1 }] }]) {
    assert.equal(parseSiteHealth(raw), null)
  }
})

test('REQ-022 serviceStateFor: up, down and unreachable sites map to online or offline', () => {
  assert.equal(serviceStateFor('https://up.test', health), 'online')
  assert.equal(serviceStateFor('https://down.test', health), 'offline')
  assert.equal(serviceStateFor('https://dead.test', health), 'offline')
})

test('REQ-022 serviceStateFor: matches regardless of case or trailing slash', () => {
  assert.equal(serviceStateFor('https://UP.test/', health), 'online')
})

test('REQ-022 serviceStateFor: no data or a site that was not checked is unknown, never assumed online', () => {
  assert.equal(serviceStateFor('https://up.test', null), 'unknown')
  assert.equal(serviceStateFor('https://other.test', health), 'unknown')
  assert.equal(serviceStateFor('not a url', health), 'unknown')
})
