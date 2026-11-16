import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAskResponse, type ChatAnswer, type Result } from '../src/domain/chat.ts'
import { clearChat, elapsedSeconds, emptyChat, markWrong, resolveAsk, startAsk, thinkingDelayMs } from '../src/domain/chatState.ts'

const answerFor = (id: string): ChatAnswer => {
  const answer = parseAskResponse({
    id, question: '¿Saldo?', status: 'answered', reason: null, source: 'rules',
    interpretation: { title: 'Saldo', chips: ['saldo'], text: 'Saldo', query: {} },
    answer: { text: 'Tu saldo es 100,00 €.', kind: 'scalar', data: { value: 100, unit: 'EUR' } }, timing_ms: 1,
  })
  assert.ok(answer)
  return answer
}
const ok = (id: string): Result<ChatAnswer> => ({ ok: true, value: answerFor(id) })

test('REQ-024 chatState: startAsk appends the user message and sets pending', () => {
  const state = startAsk(emptyChat, '¿Saldo?', 'q1', 1000)
  assert.deepEqual(state.messages, [{ id: 'q1', role: 'user', text: '¿Saldo?' }])
  assert.deepEqual(state.pending, { id: 'q1', question: '¿Saldo?', startedAt: 1000 })
  assert.equal(emptyChat.messages.length, 0, 'no muta el estado anterior')
})

test('REQ-024 chatState: startAsk is ignored while another question is pending', () => {
  const state = startAsk(emptyChat, '¿Saldo?', 'q1', 1000)
  assert.equal(startAsk(state, 'otra', 'q2', 2000), state)
})

test('REQ-024 chatState: resolveAsk with an answer clears pending and appends an assistant message with feedback none', () => {
  const state = resolveAsk(startAsk(emptyChat, '¿Saldo?', 'q1', 1000), 'q1', ok('ans_3f9c1a7b2d04'))
  assert.equal(state.pending, null)
  assert.equal(state.messages.length, 2)
  const last = state.messages[1]
  assert.equal(last.role, 'assistant')
  assert.equal(last.role === 'assistant' && last.feedback, 'none')
  assert.equal(last.id, 'ans_3f9c1a7b2d04')
})

test('REQ-024 chatState: resolveAsk with an error clears pending and appends an error message carrying the question', () => {
  for (const code of ['unauthorized', 'model_busy', 'timeout'] as const) {
    const state = resolveAsk(startAsk(emptyChat, '¿Saldo?', 'q1', 1000), 'q1', { ok: false, error: { code, retryAfterSeconds: 7 } })
    assert.equal(state.pending, null)
    assert.deepEqual(state.messages[1], { id: 'e-q1', role: 'error', question: '¿Saldo?', error: { code, retryAfterSeconds: 7 } })
  }
})

test('REQ-024 chatState: a late resolution after clearChat is ignored', () => {
  const asking = startAsk(emptyChat, '¿Saldo?', 'q1', 1000)
  const cleared = clearChat()
  assert.deepEqual(cleared, emptyChat)
  assert.equal(resolveAsk(cleared, 'q1', ok('ans_3f9c1a7b2d04')), cleared)
  const another = startAsk(cleared, 'otra', 'q2', 5000)
  assert.equal(resolveAsk(another, 'q1', ok('ans_3f9c1a7b2d04')), another, 'la respuesta de una pregunta anterior no se mezcla con la nueva')
  assert.equal(asking.pending?.id, 'q1')
})

test('REQ-024 chatState: markWrong flags only the matching assistant message', () => {
  let state = resolveAsk(startAsk(emptyChat, 'a', 'q1', 0), 'q1', ok('ans_aaaaaaaaaaaa'))
  state = resolveAsk(startAsk(state, 'b', 'q2', 0), 'q2', ok('ans_bbbbbbbbbbbb'))
  const marked = markWrong(state, 'ans_bbbbbbbbbbbb')
  const flags = marked.messages.filter((message) => message.role === 'assistant').map((message) => message.role === 'assistant' && message.feedback)
  assert.deepEqual(flags, ['none', 'wrong'])
  assert.equal(markWrong(state, 'ans_cccccccccccc').messages.length, state.messages.length)
})

test('REQ-024 chatState: elapsedSeconds floors the seconds since startedAt and never goes negative', () => {
  const pending = { id: 'q1', question: 'x', startedAt: 10_000 }
  assert.equal(elapsedSeconds(pending, 10_000), 0)
  assert.equal(elapsedSeconds(pending, 10_999), 0)
  assert.equal(elapsedSeconds(pending, 17_400), 7)
  assert.equal(elapsedSeconds(pending, 5_000), 0)
  assert.equal(thinkingDelayMs, 600)
})

test('REQ-024 chatState: messages keep their order across several asks', () => {
  let state = emptyChat
  for (const [index, question] of ['uno', 'dos', 'tres'].entries()) {
    state = startAsk(state, question, `q${index}`, index)
    state = resolveAsk(state, `q${index}`, ok(`ans_00000000000${index}`))
  }
  assert.deepEqual(state.messages.map((message) => message.role), ['user', 'assistant', 'user', 'assistant', 'user', 'assistant'])
  assert.deepEqual(state.messages.filter((message) => message.role === 'user').map((message) => message.role === 'user' && message.text), ['uno', 'dos', 'tres'])
})
