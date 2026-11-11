import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

/** Comprobación mínima de XML bien formado (etiquetas anidadas y cerradas, atributos entrecomillados); devuelve el error o `null`. */
function wellFormedError(xml: string): string | null {
  const body = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[^>]*>/gi, '')
  const stack: string[] = []
  let sawRoot = false
  for (const match of body.matchAll(/<(\/?)([A-Za-z_][\w:.-]*)([^<>]*?)(\/?)>/g)) {
    const [, closing, name, attributes, selfClosing] = match
    if (!closing) {
      const stripped = attributes.replace(/\s+[\w:.-]+\s*=\s*("[^"]*"|'[^']*')/g, '')
      if (stripped.trim() !== '') return `atributos mal formados en <${name}>: ${stripped.trim().slice(0, 40)}`
    }
    if (closing) {
      if (stack.pop() !== name) return `etiqueta de cierre inesperada </${name}>`
    } else if (!selfClosing) {
      if (stack.length === 0 && sawRoot) return 'más de un elemento raíz'
      stack.push(name)
      sawRoot = true
    } else if (stack.length === 0) {
      if (sawRoot) return 'más de un elemento raíz'
      sawRoot = true
    }
  }
  if (stack.length) return `sin cerrar: <${stack[stack.length - 1]}>`
  if (!sawRoot) return 'sin elemento raíz'
  return null
}

test('REQ-006 wellFormedError: accepts balanced XML with comments, self-closing tags and quoted attributes', () => {
  assert.equal(wellFormedError('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><!-- c --><g id=\'a\'><rect width="1"/></g></svg>'), null)
})

test('REQ-006 wellFormedError: rejects unclosed, badly nested and unquoted markup', () => {
  assert.match(wellFormedError('<svg><g></svg>') ?? '', /cierre inesperada|sin cerrar/)
  assert.match(wellFormedError('<svg><g></svg></g>') ?? '', /cierre inesperada/)
  assert.match(wellFormedError('<svg><rect width=1/></svg>') ?? '', /atributos mal formados/)
  assert.match(wellFormedError('<svg><g>') ?? '', /sin cerrar/)
  assert.match(wellFormedError('<svg/><svg/>') ?? '', /raíz/)
  assert.match(wellFormedError('') ?? '', /raíz/)
})

const diagrams = readdirSync(new URL('../docs/diagramas/', import.meta.url)).filter((name) => name.endsWith('.svg'))

test('REQ-006 there are diagrams to validate', () => {
  assert.ok(diagrams.length >= 4)
})

for (const name of diagrams) {
  test(`REQ-006 docs/diagramas/${name} is well-formed XML`, () => {
    const xml = readFileSync(new URL(`../docs/diagramas/${name}`, import.meta.url), 'utf-8')
    assert.equal(wellFormedError(xml), null)
    assert.match(xml, /<svg[\s>]/)
  })
}
