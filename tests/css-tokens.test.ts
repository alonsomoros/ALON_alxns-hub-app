import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { themes, tokenVarName, type ThemeTokenKey } from '../src/themes.ts'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf-8')
const tokenBlock = /\/\* tokens:start \*\/([\s\S]*?)\/\* tokens:end \*\//.exec(css)?.[1] ?? ''
const rest = css.replace(/\/\* tokens:start \*\/[\s\S]*?\/\* tokens:end \*\//, '')

test('REQ-003 index.css has a tokens block delimited by tokens:start / tokens:end', () => {
  assert.ok(tokenBlock.includes('--bg:'), 'token block missing')
})

test('REQ-003 index.css has no fixed colours outside the tokens block', () => {
  const colours = rest.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []
  assert.deepEqual(colours, [])
})

test('REQ-003 every var(--x) used in index.css is declared in the tokens block', () => {
  const used = new Set([...rest.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]))
  const declared = new Set([...tokenBlock.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]))
  const missing = [...used].filter((name) => !declared.has(name))
  assert.deepEqual(missing, [])
})

test('REQ-003 the fallback base tokens in index.css match the soft theme', () => {
  for (const key of Object.keys(themes.soft.tokens) as ThemeTokenKey[]) {
    const match = new RegExp(`${tokenVarName(key)}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(tokenBlock)
    assert.equal(match?.[1].toLowerCase(), themes.soft.tokens[key], tokenVarName(key))
  }
})
