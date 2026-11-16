import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  consentWarning, formatCell, messageForError, normalizeQuestion, parseApiErrorCode, parseAskResponse, parseStatus, parseSuggestions,
  type ChatErrorCode,
} from '../src/domain/chat.ts'

const query = { intent: 'aggregate', metric: 'sum', group_by: null, direction: 'out', category: 'restaurantes', text: null, from: '2026-10-01', to: '2026-10-31', compare_from: null, compare_to: null, min_amount: null, max_amount: null, sort: null, limit: null, clarification: null }
const scalarRaw = () => ({
  id: 'ans_3f9c1a7b2d04', question: '¿Cuánto gasté en restaurantes en octubre?', status: 'answered', reason: null, source: 'rules',
  interpretation: { title: 'Gasto total', chips: ['restaurantes', '1 oct – 31 oct 2026'], text: 'Gasto total · restaurantes · 1 oct – 31 oct 2026', query },
  answer: { text: 'Has gastado 1.768,90 € (restaurantes) del 1 oct al 31 oct 2026.', kind: 'scalar', data: { value: 1768.9, unit: 'EUR' } },
  timing_ms: 3, mock: true,
})
const tableRaw = () => ({
  ...scalarRaw(),
  answer: {
    text: 'Estos son tus comercios principales.', kind: 'table',
    data: { columns: [{ key: 'merchant', label: 'Comercio', type: 'text' }, { key: 'amount', label: 'Importe', type: 'money' }], rows: [['SUPERMERCADO DEMO', -42.5]] },
  },
})
const noneRaw = (status: string, reason: string) => ({ ...scalarRaw(), status, reason, answer: { text: 'No puedo hacer eso.', kind: 'none', data: null } })
const flat = (text: string) => text.replace(/\s/g, ' ')

test('REQ-024 parseAskResponse: accepts a scalar answer', () => {
  const answer = parseAskResponse(scalarRaw())
  assert.ok(answer)
  assert.equal(answer.id, 'ans_3f9c1a7b2d04')
  assert.equal(answer.text, 'Has gastado 1.768,90 € (restaurantes) del 1 oct al 31 oct 2026.')
  assert.deepEqual(answer.data, { kind: 'scalar', value: 1768.9, unit: 'EUR' })
  assert.deepEqual(answer.interpretation.chips, ['restaurantes', '1 oct – 31 oct 2026'])
  assert.equal(answer.interpretation.title, 'Gasto total')
  assert.equal(answer.timingMs, 3)
  assert.equal(answer.mock, true)
  assert.equal(answer.source, 'rules')
  assert.equal(answer.status, 'answered')
})

test('REQ-024 parseAskResponse: accepts a table answer', () => {
  const answer = parseAskResponse(tableRaw())
  assert.ok(answer)
  assert.equal(answer.data.kind, 'table')
  if (answer.data.kind === 'table') {
    assert.equal(answer.data.rows.length, 1)
    assert.equal(answer.data.columns[1].type, 'money')
  }
})

test('REQ-024 parseAskResponse: accepts unsupported and clarification answers that carry no data', () => {
  const unsupported = parseAskResponse(noneRaw('unsupported', 'fuera_de_alcance'))
  assert.ok(unsupported)
  assert.deepEqual(unsupported.data, { kind: 'none' })
  assert.equal(unsupported.reason, 'fuera_de_alcance')
  const clarification = parseAskResponse(noneRaw('needs_clarification', 'ambigua'))
  assert.ok(clarification)
  assert.equal(clarification.status, 'needs_clarification')
})

test('REQ-024 parseAskResponse: a missing mock flag means false', () => {
  const raw: Record<string, unknown> = scalarRaw()
  delete raw.mock
  assert.equal(parseAskResponse(raw)?.mock, false)
})

test('REQ-024 parseAskResponse: rejects malformed responses', () => {
  const broken: unknown[] = [
    null, undefined, 'x', 3, [],
    { ...scalarRaw(), id: 'ans_xyz' },
    { ...scalarRaw(), id: 'ans_3F9C1A7B2D04' },
    { ...scalarRaw(), status: 'maybe' },
    { ...scalarRaw(), source: 'oracle' },
    { ...scalarRaw(), reason: 'because' },
    { ...scalarRaw(), timing_ms: -1 },
    { ...scalarRaw(), interpretation: { ...scalarRaw().interpretation, chips: 'restaurantes' } },
    { ...scalarRaw(), interpretation: { ...scalarRaw().interpretation, chips: [1] } },
    { ...scalarRaw(), answer: { text: '', kind: 'scalar', data: { value: 1, unit: 'EUR' } } },
    { ...scalarRaw(), answer: { text: 'x', kind: 'scalar', data: { value: '1', unit: 'EUR' } } },
    { ...scalarRaw(), answer: { text: 'x', kind: 'scalar', data: { value: Number.NaN, unit: 'EUR' } } },
    { ...scalarRaw(), answer: { text: 'x', kind: 'scalar', data: { value: 1, unit: 'USD' } } },
    { ...scalarRaw(), answer: { text: 'x', kind: 'chart', data: {} } },
  ]
  for (const raw of broken) assert.equal(parseAskResponse(raw), null)
})

test('REQ-024 parseAskResponse: rejects a table whose rows do not match its columns, or that has no data', () => {
  const withRows = (rows: unknown) => ({ ...tableRaw(), answer: { text: 'x', kind: 'table', data: { ...tableRaw().answer.data, rows } } })
  assert.equal(parseAskResponse(withRows([['SUPERMERCADO DEMO']])), null)
  assert.equal(parseAskResponse(withRows([['SUPERMERCADO DEMO', -42.5, 'extra']])), null)
  assert.equal(parseAskResponse(withRows([['SUPERMERCADO DEMO', { amount: 1 }]])), null)
  assert.equal(parseAskResponse(withRows('rows')), null)
  assert.equal(parseAskResponse({ ...tableRaw(), answer: { text: 'x', kind: 'table', data: null } }), null)
  assert.equal(parseAskResponse({ ...tableRaw(), answer: { text: 'x', kind: 'table', data: { columns: [{ key: 'a', label: 'A', type: 'tree' }], rows: [] } } }), null)
})

test('REQ-024 parseAskResponse: never accepts figures on unsupported or needs_clarification answers', () => {
  for (const status of ['unsupported', 'needs_clarification']) {
    assert.equal(parseAskResponse({ ...scalarRaw(), status, reason: status === 'unsupported' ? 'operacion' : 'ambigua' }), null)
    assert.equal(parseAskResponse({ ...tableRaw(), status, reason: 'ambigua' }), null)
  }
})

test('REQ-024 parseStatus: accepts a valid status and rejects an invalid one', () => {
  const raw = {
    ok: true, version: '0.1.0', mode: 'mock', model: { name: 'qwen2.5:3b (simulado)', loaded: true },
    data: { last_sync: '2026-11-15T14:47:00+00:00', data_through: '2026-11-14', accounts: 1 },
    consent: { valid_until: '2027-04-15', days_left: 151 },
  }
  assert.deepEqual(parseStatus(raw), {
    mode: 'mock', modelName: 'qwen2.5:3b (simulado)', modelLoaded: true,
    lastSync: '2026-11-15T14:47:00+00:00', dataThrough: '2026-11-14', accounts: 1, consentValidUntil: '2027-04-15', consentDaysLeft: 151,
  })
  const unknownDates = parseStatus({ ...raw, data: { last_sync: null, data_through: null, accounts: 0 }, consent: { valid_until: null, days_left: null } })
  assert.equal(unknownDates?.lastSync, null)
  assert.equal(unknownDates?.consentDaysLeft, null)
  assert.equal(parseStatus({ ...raw, mode: 'demo' }), null)
  assert.equal(parseStatus({ ...raw, ok: false }), null)
  assert.equal(parseStatus({ ...raw, model: { name: 3, loaded: true } }), null)
  assert.equal(parseStatus({ ...raw, consent: { valid_until: null, days_left: 1.5 } }), null)
  assert.equal(parseStatus(null), null)
})

test('REQ-024 parseSuggestions: accepts a list, rejects an empty list and a question longer than 500', () => {
  const item = { id: 'balance', label: 'Saldo', question: '¿Cuál es mi saldo?' }
  assert.deepEqual(parseSuggestions({ suggestions: [item] }), [item])
  assert.equal(parseSuggestions({ suggestions: [] }), null)
  assert.equal(parseSuggestions({ suggestions: [{ ...item, question: 'x'.repeat(501) }] }), null)
  assert.equal(parseSuggestions({ suggestions: [{ ...item, label: '' }] }), null)
  assert.equal(parseSuggestions({ suggestions: 'no' }), null)
  assert.equal(parseSuggestions(null), null)
})

test('REQ-024 parseApiErrorCode: reads error.code from the error envelope and ignores anything else', () => {
  assert.equal(parseApiErrorCode({ error: { code: 'model_busy', message: 'x' } }), 'model_busy')
  for (const raw of [null, 'x', {}, { error: 'x' }, { error: {} }, { error: { code: 4 } }]) assert.equal(parseApiErrorCode(raw), null)
})

test('REQ-024 normalizeQuestion: trims, rejects empty and over-long input', () => {
  assert.equal(normalizeQuestion('  ¿Saldo?  '), '¿Saldo?')
  assert.equal(normalizeQuestion(''), null)
  assert.equal(normalizeQuestion('   \n '), null)
  assert.equal(normalizeQuestion('x'.repeat(500)), 'x'.repeat(500))
  assert.equal(normalizeQuestion('x'.repeat(501)), null)
})

test('REQ-024 consentWarning: warns only from 14 days and speaks of expiry at zero', () => {
  assert.equal(consentWarning(null), null)
  assert.equal(consentWarning(151), null)
  assert.equal(consentWarning(15), null)
  assert.equal(consentWarning(14), 'El consentimiento bancario caduca en 14 días: reautoriza pronto.')
  assert.equal(consentWarning(1), 'El consentimiento bancario caduca en 1 día: reautoriza pronto.')
  assert.equal(consentWarning(0), 'El consentimiento bancario ha caducado: reautoriza el acceso.')
  assert.equal(consentWarning(-3), 'El consentimiento bancario ha caducado: reautoriza el acceso.')
})

test('REQ-024 messageForError: every code has a clear Spanish message with no leaked internals', () => {
  const codes: ChatErrorCode[] = ['unauthorized', 'model_busy', 'timeout', 'network', 'invalid_response', 'invalid_request', 'not_found', 'internal']
  for (const code of codes) {
    const message = messageForError({ code })
    assert.ok(message.length > 10, code)
    assert.doesNotMatch(message, /undefined|NaN|\[object/, code)
  }
  assert.match(messageForError({ code: 'unauthorized' }), /token/i)
  assert.match(messageForError({ code: 'model_busy', retryAfterSeconds: 7 }), /7/)
  assert.doesNotMatch(messageForError({ code: 'model_busy' }), /undefined|NaN/)
})

test('REQ-024 formatCell: formats money, counts, dates and text in es-ES', () => {
  const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
  assert.equal(flat(formatCell(-42.5, 'money')), flat(money.format(-42.5)))
  assert.equal(flat(formatCell(1768.9, 'money')), flat(money.format(1768.9)))
  assert.equal(formatCell(1234567, 'count'), new Intl.NumberFormat('es-ES').format(1234567))
  const date = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  assert.equal(formatCell('2026-10-31', 'date'), date.format(new Date('2026-10-31T00:00:00Z')))
  assert.equal(formatCell('SUPERMERCADO DEMO', 'text'), 'SUPERMERCADO DEMO')
  assert.equal(formatCell(7, 'text'), '7')
  assert.equal(formatCell(null, 'money'), '—')
  assert.equal(formatCell('n/d', 'money'), 'n/d')
  assert.equal(formatCell('no es fecha', 'date'), 'no es fecha')
})
