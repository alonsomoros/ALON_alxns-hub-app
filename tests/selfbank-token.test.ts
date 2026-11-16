import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTokenStore, type TokenStorage } from '../src/infrastructure/selfbankToken.ts'

const memoryStorage = (): TokenStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

test('REQ-024 token store: set trims the token and keeps it under its own key', () => {
  const storage = memoryStorage()
  const store = createTokenStore(storage)
  assert.equal(store.get(), null)
  store.set('  abc123  ')
  assert.equal(store.get(), 'abc123')
  assert.deepEqual([...storage.data.keys()], ['alxns:selfbank-token'])
})

test('REQ-024 token store: an empty token clears it and clear leaves other keys alone', () => {
  const storage = memoryStorage()
  storage.setItem('otra', 'cosa')
  const store = createTokenStore(storage)
  store.set('abc')
  store.set('   ')
  assert.equal(store.get(), null)
  store.set('abc')
  store.clear()
  assert.equal(store.get(), null)
  assert.equal(storage.getItem('otra'), 'cosa')
})

test('REQ-024 token store: a storage that throws still works in memory', () => {
  const broken: TokenStorage = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
    removeItem: () => { throw new Error('blocked') },
  }
  const store = createTokenStore(broken)
  store.set('abc')
  assert.equal(store.get(), 'abc')
  store.clear()
  assert.equal(store.get(), null)
})

test('REQ-024 token store: without storage it works in memory only', () => {
  const store = createTokenStore(null)
  store.set('abc')
  assert.equal(store.get(), 'abc')
  store.clear()
  assert.equal(store.get(), null)
})
