import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSiteHealth, defaultSiteUrls, normalizeSiteUrl, parseSiteUrls } from '../server/health.js'

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const minute = 60_000
const respond = (status: number) => ({ status })

test('REQ-022 normalizeSiteUrl: lowercases host, drops the trailing slash and keeps the path', () => {
  assert.equal(normalizeSiteUrl('https://Example.COM/'), 'https://example.com')
  assert.equal(normalizeSiteUrl('https://example.com/app/'), 'https://example.com/app')
  assert.equal(normalizeSiteUrl('http://example.com:8080'), 'http://example.com:8080')
})

test('REQ-022 normalizeSiteUrl: rejects invalid URLs and anything that is not http or https', () => {
  for (const value of ['', 'nope', 'ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)', 'https://']) assert.equal(normalizeSiteUrl(value), null)
})

test('REQ-022 parseSiteUrls: parses a comma list, drops invalid entries and duplicates, keeps the order', () => {
  assert.deepEqual(parseSiteUrls('https://a.test, https://b.test/ ,nope,https://A.test'), ['https://a.test', 'https://b.test'])
})

test('REQ-022 parseSiteUrls: falls back to the default sites when empty or unset and caps the list at 10', () => {
  assert.deepEqual(parseSiteUrls(undefined), defaultSiteUrls)
  assert.deepEqual(parseSiteUrls('  '), defaultSiteUrls)
  assert.deepEqual(parseSiteUrls('nope,also-nope'), defaultSiteUrls)
  assert.equal(parseSiteUrls(Array.from({ length: 15 }, (_, index) => `https://s${index}.test`).join(',')).length, 10)
})

test('REQ-022 site health: 2xx and 3xx are up, 4xx and 5xx are down, with the status code', async () => {
  const statuses: Record<string, number> = { 'https://ok.test': 200, 'https://redirect.test': 301, 'https://missing.test': 404, 'https://broken.test': 503 }
  const service = createSiteHealth({ urls: Object.keys(statuses), fetchImpl: async (url: string) => respond(statuses[url]) })
  const { sites } = await service.getHealth()
  assert.deepEqual(sites.map((site: { url: string; ok: boolean; status: number | null }) => [site.url, site.ok, site.status]), [['https://ok.test', true, 200], ['https://redirect.test', true, 301], ['https://missing.test', false, 404], ['https://broken.test', false, 503]])
})

test('REQ-022 site health: an unreachable site is down with no status and does not affect the others', async () => {
  const service = createSiteHealth({ urls: ['https://down.test', 'https://up.test'], fetchImpl: async (url: string) => { if (url.includes('down')) throw new Error('ECONNREFUSED'); return respond(200) } })
  const { sites } = await service.getHealth()
  assert.deepEqual([sites[0].ok, sites[0].status, sites[0].ms], [false, null, null])
  assert.deepEqual([sites[1].ok, sites[1].status], [true, 200])
})

test('REQ-022 site health: falls back to GET when the site does not support HEAD', async () => {
  const methods: string[] = []
  const service = createSiteHealth({ urls: ['https://nohead.test'], fetchImpl: async (_url: string, options: { method: string }) => { methods.push(options.method); return respond(options.method === 'HEAD' ? 405 : 200) } })
  const { sites } = await service.getHealth()
  assert.deepEqual(methods, ['HEAD', 'GET'])
  assert.equal(sites[0].ok, true)
})

test('REQ-022 site health: reports the response time and an ISO checkedAt', async () => {
  const service = createSiteHealth({ urls: ['https://ok.test'], fetchImpl: async () => respond(200) })
  const result = await service.getHealth()
  assert.ok(Number.isFinite(result.sites[0].ms) && result.sites[0].ms >= 0)
  assert.ok(!Number.isNaN(Date.parse(result.checkedAt)))
})

test('REQ-022 site health: serves the cache within the TTL (one round of checks)', async () => {
  let calls = 0
  let time = 0
  const service = createSiteHealth({ urls: ['https://ok.test'], ttlMs: minute, now: () => time, fetchImpl: async () => { calls += 1; return respond(200) } })
  await service.getHealth()
  time = minute - 1
  await service.getHealth()
  assert.equal(calls, 1)
})

test('REQ-022 site health: after the TTL it answers with the previous result at once and renews it in the background', async () => {
  let status = 200
  let time = 0
  const service = createSiteHealth({ urls: ['https://flaky.test'], ttlMs: minute, now: () => time, fetchImpl: async () => respond(status) })
  assert.equal((await service.getHealth()).sites[0].ok, true)
  status = 500
  time = minute
  assert.equal((await service.getHealth()).sites[0].ok, true)
  await tick()
  assert.equal((await service.getHealth()).sites[0].ok, false)
})

test('REQ-022 site health: parallel requests share one round of checks', async () => {
  let calls = 0
  const service = createSiteHealth({ urls: ['https://ok.test'], fetchImpl: async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return respond(200) } })
  await Promise.all([service.getHealth(), service.getHealth(), service.getHealth()])
  assert.equal(calls, 1)
})
