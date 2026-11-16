import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Guardas de privacidad del chat (REQ-024): se leen las fuentes como texto. Los archivos que aún no existan se omiten. */
const chatFiles = (): string[] => {
  const files = [
    'src/domain/chat.ts', 'src/domain/chatState.ts', 'src/hooks/useChat.ts',
    'src/infrastructure/selfbankClient.ts', 'src/infrastructure/selfbankToken.ts', 'src/infrastructure/selfbankConfig.ts',
  ]
  if (existsSync('src/components/chat')) {
    for (const name of readdirSync('src/components/chat')) if (/\.tsx?$/.test(name)) files.push(join('src/components/chat', name).replaceAll('\\', '/'))
  }
  return files.filter((file) => existsSync(file))
}
/** Código sin comentarios: un comentario puede nombrar `localStorage` para prohibirlo. */
const read = (file: string) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')

test('REQ-024 privacy: the chat modules exist and are being checked', () => {
  assert.ok(chatFiles().length >= 3)
})

test('REQ-024 privacy: no chat module uses localStorage', () => {
  for (const file of chatFiles()) assert.doesNotMatch(read(file), /localStorage/, file)
})

test('REQ-024 privacy: no chat module writes to the console', () => {
  for (const file of chatFiles()) assert.doesNotMatch(read(file), /\bconsole\./, file)
})

test('REQ-024 privacy: no chat module puts the token in a URL', () => {
  for (const file of chatFiles()) assert.doesNotMatch(read(file), /[?&](token|access_token|auth)=/i, file)
})

test('REQ-024 privacy: vite.config.ts has no runtimeCaching, so the service worker never caches selfbank', () => {
  assert.doesNotMatch(read('vite.config.ts'), /runtimeCaching/)
})

test('REQ-024 privacy: the token storage key is only used by the token store', () => {
  const key = 'alxns:selfbank-token'
  const users = chatFiles().filter((file) => read(file).includes(key))
  assert.deepEqual(users, ['src/infrastructure/selfbankToken.ts'])
})
