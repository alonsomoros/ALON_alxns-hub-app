import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contrastRatio } from '../src/domain/contrast.ts'
import { applyTheme, stepTheme, themeIds, themes, tokenVarName, type ThemeTokenKey } from '../src/themes.ts'

const tokenKeys: ThemeTokenKey[] = ['bg', 'surface', 'text', 'textMuted', 'border', 'accent', 'accent2', 'accentStrong', 'onAccentStrong', 'warn', 'danger', 'info']

test('REQ-003 contrastRatio: black on white is 21 and a colour on itself is 1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01)
  assert.equal(contrastRatio('#336699', '#336699'), 1)
})

test('REQ-003 themeIds has six unique ids', () => {
  assert.equal(themeIds.length, 6)
  assert.equal(new Set(themeIds).size, 6)
  assert.deepEqual(themeIds, ['soft', 'ocean', 'sunset', 'lavender', 'graphite', 'dark'])
})

test('REQ-003 every theme defines the 12 tokens as #rrggbb', () => {
  for (const id of themeIds) {
    assert.deepEqual(Object.keys(themes[id].tokens).sort(), [...tokenKeys].sort(), id)
    for (const key of tokenKeys) assert.match(themes[id].tokens[key], /^#[0-9a-f]{6}$/, `${id}.${key}`)
  }
})

test('REQ-003 every theme meets WCAG AA for text, muted text and the strong accent', () => {
  for (const id of themeIds) {
    const t = themes[id].tokens
    const pairs: [string, string, string][] = [['text/bg', t.text, t.bg], ['text/surface', t.text, t.surface], ['textMuted/bg', t.textMuted, t.bg], ['textMuted/surface', t.textMuted, t.surface], ['onAccentStrong/accentStrong', t.onAccentStrong, t.accentStrong]]
    for (const [name, fg, bg] of pairs) assert.ok(contrastRatio(fg, bg) >= 4.5, `${id} ${name} = ${contrastRatio(fg, bg).toFixed(2)}`)
  }
})

test('REQ-003 tokenVarName converts camelCase keys to CSS variable names', () => {
  assert.equal(tokenVarName('onAccentStrong'), '--on-accent-strong')
  assert.equal(tokenVarName('bg'), '--bg')
  assert.equal(tokenVarName('accent2'), '--accent-2')
})

test('REQ-003 applyTheme writes every token as a CSS variable without needing a document', () => {
  const written: Record<string, string> = {}
  applyTheme('ocean', { style: { setProperty: (name: string, value: string) => { written[name] = value } } })
  assert.equal(Object.keys(written).length, 12)
  assert.equal(written['--accent'], '#3b82a0')
  assert.equal(written['--bg'], '#f3f8fa')
})

test('REQ-003 stepTheme: moves to the next or previous theme and wraps around', () => {
  assert.equal(stepTheme('soft', 1), 'ocean')
  assert.equal(stepTheme('soft', -1), 'dark')
  assert.equal(stepTheme('dark', 1), 'soft')
})

test('REQ-003 every theme has a two-colour swatch and the dark one is black and white', () => {
  for (const id of themeIds) {
    assert.equal(themes[id].swatch.length, 2, id)
    for (const colour of themes[id].swatch) assert.match(colour, /^#[0-9a-f]{6}$/, id)
  }
  assert.deepEqual(themes.dark.swatch, ['#0b0c0e', '#f2f3f5'])
  assert.deepEqual(themes.ocean.swatch, [themes.ocean.tokens.accent, themes.ocean.tokens.accent2])
})
