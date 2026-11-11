import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createQuoteService, parseUpstreamQuote } from '../server/quote.js'

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

const ok = (body: unknown) => ({ ok: true, json: async () => body })
const hour = 60 * 60 * 1000

test('parseUpstreamQuote: maps phrase/author and also accepts content/author', () => {
  assert.deepEqual(parseUpstreamQuote({ phrase: 'El cobarde sólo amenaza cuando está a salvo.', author: 'Goethe' }), { content: 'El cobarde sólo amenaza cuando está a salvo.', author: 'Goethe' })
  assert.deepEqual(parseUpstreamQuote({ content: 'Hola', author: 'Ana' }), { content: 'Hola', author: 'Ana' })
})

test('parseUpstreamQuote: strips HTML, collapses whitespace and defaults a missing author', () => {
  assert.deepEqual(parseUpstreamQuote({ phrase: '  <b>Hola</b>\n   mundo  ' }), { content: 'Hola mundo', author: 'Anónimo' })
})

test('parseUpstreamQuote: accepts a double-encoded JSON string, which the upstream returns for some Accept headers', () => {
  assert.deepEqual(parseUpstreamQuote(JSON.stringify({ phrase: 'Hola', author: 'Ana' })), { content: 'Hola', author: 'Ana' })
  assert.equal(parseUpstreamQuote('esto no es json'), null)
  assert.equal(parseUpstreamQuote(JSON.stringify('otro string')), null)
})

test('parseUpstreamQuote: rejects empty, non-string or oversized content', () => {
  for (const raw of [null, undefined, 5, [], {}, { phrase: '   ' }, { phrase: 7 }, { phrase: 'x'.repeat(401) }]) assert.equal(parseUpstreamQuote(raw), null)
})

test('quote service: serves from the cache within the TTL (one upstream call)', async () => {
  let calls = 0
  let time = 0
  const service = createQuoteService({ url: 'http://x', ttlMs: hour, now: () => time, fetchImpl: async () => { calls += 1; return ok({ phrase: 'Frase', author: 'Autor' }) } })
  assert.deepEqual(await service.getQuote(), { content: 'Frase', author: 'Autor' })
  time = hour - 1
  await service.getQuote()
  assert.equal(calls, 1)
})

test('quote service: after the TTL it answers with the old quote at once and renews it in the background', async () => {
  let calls = 0
  let time = 0
  const service = createQuoteService({ url: 'http://x', ttlMs: hour, now: () => time, fetchImpl: async () => { calls += 1; return ok({ phrase: `Frase ${calls}`, author: 'A' }) } })
  assert.equal((await service.getQuote())?.content, 'Frase 1')
  time = hour
  assert.equal((await service.getQuote())?.content, 'Frase 1')
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(calls, 2)
  assert.equal((await service.getQuote())?.content, 'Frase 2')
})

test('quote service: serves the stale quote when the upstream fails after the TTL', async () => {
  let fail = false
  let time = 0
  const service = createQuoteService({ url: 'http://x', ttlMs: hour, now: () => time, fetchImpl: async () => { if (fail) throw new Error('down'); return ok({ phrase: 'Vieja', author: 'A' }) } })
  await service.getQuote()
  fail = true
  time = 5 * hour
  assert.equal((await service.getQuote())?.content, 'Vieja')
  await tick()
  assert.equal((await service.getQuote())?.content, 'Vieja')
})

test('quote service: returns null when the upstream fails and nothing is cached', async () => {
  const failing = createQuoteService({ url: 'http://x', fetchImpl: async () => { throw new Error('down') } })
  assert.equal(await failing.getQuote(), null)
  const badStatus = createQuoteService({ url: 'http://x', fetchImpl: async () => ({ ok: false, json: async () => ({}) }) })
  assert.equal(await badStatus.getQuote(), null)
  const badJson = createQuoteService({ url: 'http://x', fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('not json') } }) })
  assert.equal(await badJson.getQuote(), null)
  const badShape = createQuoteService({ url: 'http://x', fetchImpl: async () => ok({ nope: true }) })
  assert.equal(await badShape.getQuote(), null)
})

test('quote service: parallel requests share one upstream call', async () => {
  let calls = 0
  const service = createQuoteService({ url: 'http://x', fetchImpl: async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return ok({ phrase: 'Frase', author: 'A' }) } })
  const results = await Promise.all([service.getQuote(), service.getQuote(), service.getQuote()])
  assert.equal(calls, 1)
  assert.equal(results.every((quote) => quote?.content === 'Frase'), true)
})
