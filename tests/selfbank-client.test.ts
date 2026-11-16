import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createSelfbankClient } from '../src/infrastructure/selfbankClient.ts'

interface Seen { method: string; url: string; headers: IncomingMessage['headers']; body: string }
type Reply = (request: IncomingMessage, response: ServerResponse) => void

const answerId = 'ans_3f9c1a7b2d04'
const answerBody = {
  id: answerId, question: '¿Cuál es mi saldo?', status: 'answered', reason: null, source: 'rules',
  interpretation: { title: 'Saldo', chips: ['saldo'], text: 'Saldo', query: {} },
  answer: { text: 'Tu saldo es 100,00 €.', kind: 'scalar', data: { value: 100, unit: 'EUR' } },
  timing_ms: 2,
}
const statusBody = {
  ok: true, version: '0.1.0', mode: 'mock', model: { name: 'qwen', loaded: true },
  data: { last_sync: null, data_through: null, accounts: 1 }, consent: { valid_until: null, days_left: 151 },
}
const json = (response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  response.end(JSON.stringify(body))
}

let server: Server
let baseUrl = ''
let seen: Seen[] = []
let reply: Reply = (_request, response) => json(response, 200, {})

before(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      seen.push({ method: request.method ?? '', url: request.url ?? '', headers: request.headers, body: Buffer.concat(chunks).toString('utf8') })
      reply(request, response)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()) }))
beforeEach(() => { seen = []; reply = (_request, response) => json(response, 200, {}) })

const client = (overrides: Partial<Parameters<typeof createSelfbankClient>[0]> = {}) =>
  createSelfbankClient({ baseUrl, getToken: () => 'tok', ...overrides })

test('REQ-024 client: ask sends a POST with the bearer token and the question in the JSON body, and nothing in the URL', async () => {
  reply = (_request, response) => json(response, 200, answerBody)
  const result = await client().ask('  ¿Cuál es mi saldo?  ')
  assert.equal(result.ok, true)
  assert.equal(result.ok && result.value.text, 'Tu saldo es 100,00 €.')
  assert.equal(seen.length, 1)
  assert.equal(seen[0].method, 'POST')
  assert.equal(seen[0].url, '/api/ask')
  assert.equal(seen[0].headers.authorization, 'Bearer tok')
  assert.match(String(seen[0].headers['content-type']), /^application\/json/)
  assert.deepEqual(JSON.parse(seen[0].body), { question: '¿Cuál es mi saldo?' })
})

test('REQ-024 client: status and suggestions are GET requests with the token', async () => {
  reply = (request, response) => json(response, 200, request.url === '/api/status' ? statusBody : { suggestions: [{ id: 'a', label: 'Saldo', question: '¿Saldo?' }] })
  const status = await client().status()
  const suggestions = await client().suggestions()
  assert.equal(status.ok && status.value.consentDaysLeft, 151)
  assert.equal(suggestions.ok && suggestions.value[0].label, 'Saldo')
  assert.deepEqual(seen.map((item) => `${item.method} ${item.url}`), ['GET /api/status', 'GET /api/suggestions'])
  assert.ok(seen.every((item) => item.headers.authorization === 'Bearer tok'))
})

test('REQ-024 client: without a token it fails with unauthorized and does not touch the network', async () => {
  const result = await client({ getToken: () => null }).ask('¿Saldo?')
  assert.deepEqual(result, { ok: false, error: { code: 'unauthorized' } })
  assert.equal((await client({ getToken: () => null }).status()).ok, false)
  assert.equal(seen.length, 0)
})

test('REQ-024 client: an invalid question is rejected without a request', async () => {
  for (const question of ['', '   ', 'x'.repeat(501)]) {
    assert.deepEqual(await client().ask(question), { ok: false, error: { code: 'invalid_request' } })
  }
  assert.equal(seen.length, 0)
})

test('REQ-024 client: a baseUrl with a trailing slash still works', async () => {
  reply = (_request, response) => json(response, 200, statusBody)
  assert.equal((await client({ baseUrl: `${baseUrl}/` }).status()).ok, true)
  assert.equal(seen[0].url, '/api/status')
})

test('REQ-024 client: maps error envelopes by code', async () => {
  const cases: [number, string, string][] = [
    [401, 'unauthorized', 'unauthorized'], [400, 'invalid_request', 'invalid_request'], [404, 'not_found', 'not_found'],
    [500, 'internal', 'internal'], [418, 'teapot', 'internal'], [413, 'payload_too_large', 'internal'],
  ]
  for (const [status, code, expected] of cases) {
    reply = (_request, response) => json(response, status, { error: { code, message: 'detalle interno' } })
    const result = await client().ask('¿Saldo?')
    assert.deepEqual(result, { ok: false, error: { code: expected } }, `${status} ${code}`)
  }
})

test('REQ-024 client: model_busy reads Retry-After in seconds and defaults to 10 when it is missing or not numeric', async () => {
  const cases: [Record<string, string>, number][] = [[{ 'Retry-After': '7' }, 7], [{}, 10], [{ 'Retry-After': 'abc' }, 10], [{ 'Retry-After': '-4' }, 10]]
  for (const [headers, seconds] of cases) {
    reply = (_request, response) => json(response, 503, { error: { code: 'model_busy', message: 'ocupado' } }, headers)
    assert.deepEqual(await client().ask('¿Saldo?'), { ok: false, error: { code: 'model_busy', retryAfterSeconds: seconds } })
  }
})

test('REQ-024 client: an HTML error body (a 502 from the proxy) is a network error and the body is not leaked', async () => {
  reply = (_request, response) => { response.writeHead(502, { 'Content-Type': 'text/html' }); response.end('<html><body>Bad Gateway secreto-interno</body></html>') }
  const result = await client().ask('¿Saldo?')
  assert.deepEqual(result, { ok: false, error: { code: 'network' } })
  assert.doesNotMatch(JSON.stringify(result), /secreto-interno|html/i)
})

test('REQ-024 client: a 200 with an invalid shape or a body that is not JSON is invalid_response', async () => {
  reply = (_request, response) => json(response, 200, { ...answerBody, id: 'nope' })
  assert.deepEqual(await client().ask('¿Saldo?'), { ok: false, error: { code: 'invalid_response' } })
  reply = (_request, response) => { response.writeHead(200, { 'Content-Type': 'text/plain' }); response.end('hola') }
  assert.deepEqual(await client().status(), { ok: false, error: { code: 'invalid_response' } })
})

test('REQ-024 client: ask times out with the injected askMs and quick routes use quickMs', async () => {
  reply = (_request, response) => { setTimeout(() => json(response, 200, answerBody), 300) }
  assert.deepEqual(await client({ timeouts: { quickMs: 5000, askMs: 50 } }).ask('¿Saldo?'), { ok: false, error: { code: 'timeout' } })
  assert.deepEqual(await client({ timeouts: { quickMs: 50, askMs: 5000 } }).status(), { ok: false, error: { code: 'timeout' } })
  assert.deepEqual(await client({ timeouts: { quickMs: 50, askMs: 5000 } }).suggestions(), { ok: false, error: { code: 'timeout' } })
})

test('REQ-024 client: a refused connection is a network error', async () => {
  const closed = createServer()
  await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve))
  const port = (closed.address() as AddressInfo).port
  await new Promise<void>((resolve) => closed.close(() => resolve()))
  const result = await createSelfbankClient({ baseUrl: `http://127.0.0.1:${port}`, getToken: () => 'tok' }).status()
  assert.deepEqual(result, { ok: false, error: { code: 'network' } })
})

test('REQ-024 client: feedback posts answer_id and verdict, omits an undefined correction and maps 404 to not_found', async () => {
  reply = (_request, response) => json(response, 200, { stored: true })
  assert.deepEqual(await client().feedback(answerId, 'wrong'), { ok: true, value: true })
  assert.deepEqual(JSON.parse(seen[0].body), { answer_id: answerId, verdict: 'wrong' })
  assert.equal(seen[0].url, '/api/feedback')
  await client().feedback(answerId, 'ok', 'quería el mes pasado')
  assert.deepEqual(JSON.parse(seen[1].body), { answer_id: answerId, verdict: 'ok', correction: 'quería el mes pasado' })
  reply = (_request, response) => json(response, 404, { error: { code: 'not_found', message: 'no' } })
  assert.deepEqual(await client().feedback(answerId, 'wrong'), { ok: false, error: { code: 'not_found' } })
  reply = (_request, response) => json(response, 200, { stored: false })
  assert.deepEqual(await client().feedback(answerId, 'wrong'), { ok: false, error: { code: 'invalid_response' } })
})

test('REQ-024 client: a token a header cannot carry is unauthorized and never reaches the network', async () => {
  for (const token of ['abc\u200bdef', 'ñandú', 'con espacio']) {
    assert.deepEqual(await client({ getToken: () => token }).ask('¿Saldo?'), { ok: false, error: { code: 'unauthorized' } }, JSON.stringify(token))
    assert.deepEqual(await client({ getToken: () => token }).status(), { ok: false, error: { code: 'unauthorized' } })
  }
  assert.equal(seen.length, 0)
})
