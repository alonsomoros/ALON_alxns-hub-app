import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const allowedOrigin = 'http://allowed.test'

const freePort = () => new Promise<number>((resolve, reject) => {
  const probe = createNetServer()
  probe.once('error', reject)
  probe.listen(0, '127.0.0.1', () => { const { port } = probe.address() as { port: number }; probe.close(() => resolve(port)) })
})

const startFake = (handler: (url: string) => unknown) => new Promise<{ url: string; server: Server }>((resolve) => {
  const server = createServer((request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(handler(request.url ?? ''))) })
  server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${(server.address() as { port: number }).port}`, server }))
})

interface Api { url: string; stop: () => Promise<void> }

async function startApi(env: Record<string, string> = {}): Promise<Api> {
  const port = await freePort()
  const dir = mkdtempSync(join(tmpdir(), 'alxns-api-'))
  const child: ChildProcess = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DB_PATH: join(dir, 'test.sqlite'), ALLOWED_ORIGINS: allowedOrigin, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API did not start')), 10_000)
    child.stdout?.on('data', (chunk: Buffer) => { if (String(chunk).includes('listening')) { clearTimeout(timer); resolve() } })
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`API exited early (${code})`)) })
  })
  return {
    url: `http://127.0.0.1:${port}`,
    stop: async () => {
      const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
      child.kill()
      await exited
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    },
  }
}

const goal = (overrides: Record<string, unknown> = {}) => ({ id: 'g1', title: 'Leer', description: 'Leer cada día', category: 'reading', current: 5, target: 10, unit: 'páginas', archived: false, history: [], ...overrides })
const link = (id: string) => ({ id, label: id, url: `https://${id}.example`, archived: false })
const put = (api: Api, body: unknown) => fetch(`${api.url}/api/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const getState = async (api: Api) => (await fetch(`${api.url}/api/state`)).json() as Promise<{ version: number; preferences: Record<string, unknown> | null; goals: { id: string; title: string; history: unknown[] }[]; links: { id: string; position: number }[] }>

describe('REQ-018 persistence API contract', () => {
  let api: Api
  before(async () => { api = await startApi() })
  after(async () => { await api.stop() })

  it('REQ-018 health endpoint responds ok', async () => {
    const response = await fetch(`${api.url}/health`)
    assert.equal(response.status, 200)
    assert.equal(((await response.json()) as { status: string }).status, 'ok')
  })

  it('REQ-018 an empty database returns version 0 and no data', async () => {
    const state = await getState(api)
    assert.equal(state.version, 0)
    assert.deepEqual([state.goals, state.links, state.preferences], [[], [], null])
  })

  it('REQ-018 PUT then GET round-trips goals, link order and preferences and bumps the version', async () => {
    const response = await put(api, { version: 0, preferences: { theme: 'ocean', updatedAt: '2026-11-11T10:00:00.000Z' }, goals: [goal()], links: [link('b'), link('a')] })
    assert.equal(response.status, 200)
    assert.equal(((await response.json()) as { version: number }).version, 1)
    const state = await getState(api)
    assert.equal(state.version, 1)
    assert.equal(state.preferences?.theme, 'ocean')
    assert.equal(state.preferences?.updatedAt, '2026-11-11T10:00:00.000Z')
    assert.ok(!Number.isNaN(Date.parse(String(state.preferences?.savedAt))))
    assert.deepEqual(state.goals.map((item) => item.id), ['g1'])
    assert.deepEqual(state.links.map((item) => item.id), ['b', 'a'])
    assert.deepEqual(state.links.map((item) => item.position), [0, 1])
  })

  it('REQ-003 the user-set updatedAt of the preferences is preserved, not replaced by the save time', async () => {
    const state = await getState(api)
    assert.equal(state.preferences?.updatedAt, '2026-11-11T10:00:00.000Z')
    assert.notEqual(state.preferences?.savedAt, state.preferences?.updatedAt)
  })

  it('REQ-018 a PUT with a stale version is rejected with 409 and keeps the stored state', async () => {
    const response = await put(api, { version: 0, preferences: null, goals: [goal({ id: 'stale', title: 'Pisa' })], links: [] })
    assert.equal(response.status, 409)
    const state = await getState(api)
    assert.equal(state.version, 1)
    assert.deepEqual(state.goals.map((item) => item.id), ['g1'])
  })

  it('REQ-008 changing progress is kept as history across saves', async () => {
    const response = await put(api, { version: 1, preferences: null, goals: [goal({ current: 9, history: [{ current: 5, target: 10, recordedAt: '2026-11-11T10:00:00.000Z' }] })], links: [link('a')] })
    assert.equal(response.status, 200)
    const state = await getState(api)
    assert.equal(state.goals[0].history.length, 1)
  })

  it('REQ-003 legacy preferences without updatedAt do not get one invented from the save time', async () => {
    const current = await getState(api)
    assert.equal((await put(api, { version: current.version, preferences: { theme: 'soft', mode: 'light' }, goals: [], links: [] })).status, 200)
    const state = await getState(api)
    assert.equal('updatedAt' in (state.preferences ?? {}), false)
    assert.ok(typeof state.preferences?.savedAt === 'string')
  })

  it('REQ-018 invalid payloads are rejected with 400 and nothing is stored', async () => {
    const before = await getState(api)
    for (const body of [
      { version: before.version, preferences: null, goals: [goal({ title: '   ' })], links: [] },
      { version: before.version, preferences: null, goals: [goal({ category: 'cooking' })], links: [] },
      { version: before.version, preferences: null, goals: [goal({ target: 0 })], links: [] },
      { version: before.version, preferences: null, goals: 'nope', links: [] },
      { version: -1, preferences: null, goals: [], links: [] },
    ]) assert.equal((await put(api, body)).status, 400, JSON.stringify(body).slice(0, 80))
    assert.equal((await getState(api)).version, before.version)
  })

  it('REQ-018 at most 10 links are stored', async () => {
    const current = await getState(api)
    const twelve = Array.from({ length: 12 }, (_, index) => link(`l${index}`))
    assert.equal((await put(api, { version: current.version, preferences: null, goals: [], links: twelve })).status, 200)
    assert.equal((await getState(api)).links.length, 10)
  })

  it('REQ-018 CORS: only allowed origins are echoed and the preflight allows PUT', async () => {
    const allowed = await fetch(`${api.url}/api/state`, { headers: { Origin: allowedOrigin } })
    assert.equal(allowed.headers.get('access-control-allow-origin'), allowedOrigin)
    const blocked = await fetch(`${api.url}/api/state`, { headers: { Origin: 'http://evil.test' } })
    assert.equal(blocked.headers.get('access-control-allow-origin'), null)
    const preflight = await fetch(`${api.url}/api/state`, { method: 'OPTIONS', headers: { Origin: allowedOrigin, 'Access-Control-Request-Method': 'PUT' } })
    assert.ok(preflight.status < 300)
    assert.match(preflight.headers.get('access-control-allow-methods') ?? '', /PUT/)
  })
})

describe('REQ-011 Raspberry metrics endpoint', () => {
  it('REQ-011 values from Prometheus are normalized and out-of-range values become null', async () => {
    const prometheus = await startFake(() => ({ status: 'success', data: { result: [{ value: [0, '250'] }] } }))
    const api = await startApi({ PROMETHEUS_URL: prometheus.url })
    try {
      const body = await (await fetch(`${api.url}/api/pi/metrics`)).json() as { schemaVersion: number; metrics: Record<string, number | null>; sources: Record<string, string>; containers: unknown }
      assert.equal(body.schemaVersion, 1)
      assert.deepEqual([body.metrics.cpuBusyPercent, body.metrics.ramUsedPercent, body.metrics.storageUsedPercent], [100, 100, 100])
      assert.equal(body.metrics.temperatureCelsius, null)
      assert.equal(body.metrics.uptimeSeconds, 250)
      assert.deepEqual([body.sources.prometheus, body.sources.docker, body.containers], ['ok', 'disabled', null])
    } finally { await api.stop(); prometheus.server.close() }
  })

  it('REQ-011 an unreachable Prometheus degrades to null metrics with HTTP 200 and independent sources', async () => {
    const dead = await freePort()
    const api = await startApi({ PROMETHEUS_URL: `http://127.0.0.1:${dead}`, DOCKER_PROXY_URL: `http://127.0.0.1:${dead}` })
    try {
      const response = await fetch(`${api.url}/api/pi/metrics`)
      assert.equal(response.status, 200)
      const body = await response.json() as { metrics: Record<string, number | null>; sources: Record<string, string>; containers: unknown }
      assert.ok(Object.values(body.metrics).every((value) => value === null))
      assert.deepEqual([body.sources.prometheus, body.sources.docker, body.containers], ['unreachable', 'unreachable', null])
    } finally { await api.stop() }
  })
})

describe('REQ-021 quote endpoint', () => {
  it('REQ-021 serves the validated quote from the upstream', async () => {
    const upstream = await startFake(() => ({ phrase: '  <i>Hola</i> mundo ', author: 'Ana' }))
    const api = await startApi({ QUOTE_URL: upstream.url })
    try {
      const response = await fetch(`${api.url}/api/quote`)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { content: 'Hola mundo', author: 'Ana' })
    } finally { await api.stop(); upstream.server.close() }
  })

  it('REQ-021 answers 503 when the upstream is unreachable and nothing is cached', async () => {
    const dead = await freePort()
    const api = await startApi({ QUOTE_URL: `http://127.0.0.1:${dead}/api/phrase` })
    try {
      const response = await fetch(`${api.url}/api/quote`)
      assert.equal(response.status, 503)
      assert.deepEqual(await response.json(), { error: 'Quote unavailable' })
    } finally { await api.stop() }
  })
})

describe('REQ-022 sites health endpoint', () => {
  it('REQ-022 reports each configured site as up or down and ignores any URL sent by the client', async () => {
    const up = createServer((_request, response) => { response.statusCode = 200; response.end('ok') })
    const broken = createServer((_request, response) => { response.statusCode = 500; response.end('boom') })
    await Promise.all([up, broken].map((server) => new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))))
    const urlOf = (server: Server) => `http://127.0.0.1:${(server.address() as { port: number }).port}`
    const dead = `http://127.0.0.1:${await freePort()}`
    const api = await startApi({ HEALTHCHECK_URLS: [urlOf(up), urlOf(broken), dead].join(',') })
    try {
      const response = await fetch(`${api.url}/api/sites/health?url=http://169.254.169.254/`, { headers: { Origin: allowedOrigin } })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin)
      const body = await response.json() as { checkedAt: string; sites: { url: string; ok: boolean; status: number | null }[] }
      assert.ok(!Number.isNaN(Date.parse(body.checkedAt)))
      assert.deepEqual(body.sites.map((site) => [site.url, site.ok, site.status]), [[urlOf(up), true, 200], [urlOf(broken), false, 500], [dead, false, null]])
    } finally {
      await api.stop()
      up.close()
      broken.close()
    }
  })
})
