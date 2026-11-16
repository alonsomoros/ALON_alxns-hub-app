import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { createSelfbankClient, type SelfbankClient } from '../src/infrastructure/selfbankClient.ts'

/**
 * Prueba de contrato (REQ-024): arranca el servidor simulado REAL del repositorio `selfbank` y comprueba que nuestros validadores
 * aceptan sus respuestas. Se omite si el repositorio no está disponible (`SELFBANK_REPO`, por defecto `../ALON_centralizedselfbank`).
 */
const repo = resolve(process.env.SELFBANK_REPO ?? '../ALON_centralizedselfbank')
const available = existsSync(resolve(repo, 'selfbank/api/mock.py'))
const skip = available ? false : 'repositorio selfbank no disponible'
const token = 'test-token'

let child: ChildProcess | null = null
let baseUrl = ''
let client: SelfbankClient

const freePort = () => new Promise<number>((done, fail) => {
  const probe = createServer()
  probe.once('error', fail)
  probe.listen(0, '127.0.0.1', () => {
    const { port } = probe.address() as { port: number }
    probe.close(() => done(port))
  })
})

before(async () => {
  if (!available) return
  const port = await freePort()
  baseUrl = `http://127.0.0.1:${port}`
  child = spawn('python', ['-B', '-m', 'selfbank.api.mock', '--port', String(port), '--token', token, '--model-delay', '0.2'], { cwd: repo, stdio: 'ignore' })
  const deadline = Date.now() + 10_000
  for (;;) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) break
    } catch { /* aún arrancando */ }
    if (Date.now() > deadline) throw new Error('el simulado de selfbank no arrancó en 10 s')
    await new Promise((done) => setTimeout(done, 150))
  }
  client = createSelfbankClient({ baseUrl, getToken: () => token, timeouts: { quickMs: 5000, askMs: 10_000 } })
})
after(() => { child?.kill() })

test('REQ-024 contract: the real mock status and suggestions parse', { skip }, async () => {
  const status = await client.status()
  assert.equal(status.ok, true)
  assert.equal(status.ok && status.value.mode, 'mock')
  const suggestions = await client.suggestions()
  assert.equal(suggestions.ok, true)
  assert.ok(suggestions.ok && suggestions.value.length >= 1)
})

test('REQ-024 contract: every suggested question is answered by the rules and parses', { skip }, async () => {
  const suggestions = await client.suggestions()
  assert.ok(suggestions.ok)
  let tables = 0
  for (const suggestion of suggestions.value) {
    const answer = await client.ask(suggestion.question)
    assert.ok(answer.ok, `${suggestion.id}: ${JSON.stringify(!answer.ok && answer.error)}`)
    assert.equal(answer.value.status, 'answered', suggestion.id)
    assert.equal(answer.value.source, 'rules', suggestion.id)
    assert.ok(answer.value.interpretation.chips.length >= 0)
    if (answer.value.data.kind === 'table') tables += 1
  }
  assert.ok(tables >= 1, 'al menos una sugerencia devuelve una tabla')
})

test('REQ-024 contract: an unknown question goes through the model path or is unsupported, never with figures', { skip }, async () => {
  const answer = await client.ask('Explícame la teoría de la relatividad')
  assert.ok(answer.ok, JSON.stringify(!answer.ok && answer.error))
  assert.ok(answer.value.source === 'model' || answer.value.status !== 'answered')
  if (answer.value.status !== 'answered') assert.deepEqual(answer.value.data, { kind: 'none' })
})

test('REQ-024 contract: __busy__ is model_busy with a numeric retryAfterSeconds and __error__ is internal', { skip }, async () => {
  const busy = await client.ask('__busy__')
  assert.ok(!busy.ok && busy.error.code === 'model_busy')
  assert.ok(!busy.ok && typeof busy.error.retryAfterSeconds === 'number' && busy.error.retryAfterSeconds >= 1)
  const broken = await client.ask('__error__')
  assert.deepEqual(broken, { ok: false, error: { code: 'internal' } })
})

test('REQ-024 contract: a wrong token is unauthorized', { skip }, async () => {
  const stranger = createSelfbankClient({ baseUrl, getToken: () => 'otro-token' })
  assert.deepEqual(await stranger.status(), { ok: false, error: { code: 'unauthorized' } })
})

test('REQ-024 contract: feedback is stored for a real answer id and an unknown id is not_found', { skip }, async () => {
  const answer = await client.ask('¿Cuál es mi saldo?')
  assert.ok(answer.ok)
  assert.deepEqual(await client.feedback(answer.value.id, 'wrong'), { ok: true, value: true })
  assert.deepEqual(await client.feedback('ans_000000000000', 'wrong'), { ok: false, error: { code: 'not_found' } })
})
