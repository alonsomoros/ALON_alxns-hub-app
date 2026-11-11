import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLink, normalizeLinkUrl, reorderLinks } from '../src/domain/links.ts'
import { resolveBrandLogo } from '../src/utils/brandLogo.ts'
import type { QuickLink } from '../src/types/dashboard.ts'

const link = (id: string): QuickLink => ({ id, label: id, url: `https://${id}.example`, icon: (() => null) as unknown as QuickLink['icon'] })
const ids = (links: QuickLink[]) => links.map((item) => item.id)

test('REQ-009 normalizeLinkUrl: adds https:// unless the URL already starts with http', () => {
  assert.equal(normalizeLinkUrl('example.com'), 'https://example.com')
  assert.equal(normalizeLinkUrl('https://example.com'), 'https://example.com')
  assert.equal(normalizeLinkUrl('http://example.com'), 'http://example.com')
})

test('REQ-009 createLink: trims the label, normalizes the URL and generates an id', () => {
  const created = createLink({ label: '  Mi sitio ', url: 'example.com' })
  assert.equal(created?.label, 'Mi sitio')
  assert.equal(created?.url, 'https://example.com')
  assert.ok(created?.id)
})

test('REQ-009 createLink: a blank label or URL creates nothing', () => {
  assert.equal(createLink({ label: '  ', url: 'example.com' }), null)
  assert.equal(createLink({ label: 'Sitio', url: '   ' }), null)
  assert.equal(createLink({ label: '', url: '' }), null)
})

test('REQ-009 reorderLinks: moves a link to the position of the target, forwards and backwards', () => {
  const links = [link('a'), link('b'), link('c'), link('d')]
  assert.deepEqual(ids(reorderLinks(links, 'a', 'c')), ['b', 'c', 'a', 'd'])
  assert.deepEqual(ids(reorderLinks(links, 'd', 'b')), ['a', 'd', 'b', 'c'])
})

test('REQ-009 reorderLinks: returns the same reference when nothing changes and never mutates the input', () => {
  const links = [link('a'), link('b')]
  assert.equal(reorderLinks(links, 'a', 'a'), links)
  assert.equal(reorderLinks(links, 'a', 'missing'), links)
  assert.equal(reorderLinks(links, 'missing', 'a'), links)
  reorderLinks(links, 'a', 'b')
  assert.deepEqual(ids(links), ['a', 'b'])
})

test('REQ-015 resolveBrandLogo: an explicit logo wins and is trimmed', () => {
  assert.equal(resolveBrandLogo('https://example.com', '  https://cdn.example/logo.png '), 'https://cdn.example/logo.png')
})

test('REQ-015 resolveBrandLogo: without an explicit logo it falls back to the favicon of the origin', () => {
  const logo = resolveBrandLogo('https://example.com/a/b?x=1')
  assert.equal(logo, `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent('https://example.com')}`)
  assert.equal(resolveBrandLogo('example.com', '   '), `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent('https://example.com')}`)
})

test('REQ-015 resolveBrandLogo: an unparseable URL gives null so the view shows its icon fallback', () => {
  assert.equal(resolveBrandLogo('http://'), null)
  assert.equal(resolveBrandLogo('https://exa mple.com'), null)
})
