import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseQuote } from '../src/domain/quote.ts'

test('REQ-021 parseQuote: accepts content and author and trims them', () => {
  assert.deepEqual(parseQuote({ content: '  Hola mundo ', author: ' Ana ' }), { content: 'Hola mundo', author: 'Ana' })
})

test('REQ-021 parseQuote: rejects anything that is not a complete quote', () => {
  for (const raw of [null, undefined, 3, 'x', [], {}, { content: 'Hola' }, { author: 'Ana' }, { content: '', author: 'Ana' }, { content: 'Hola', author: '  ' }, { content: 7, author: 'Ana' }, { content: 'x'.repeat(401), author: 'Ana' }]) {
    assert.equal(parseQuote(raw), null)
  }
})
