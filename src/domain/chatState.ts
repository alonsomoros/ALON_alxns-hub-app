import type { ChatAnswer, ChatError, Result } from './chat.ts'

/** Estado de la conversación (REQ-024). Puro e inmutable; vive solo en memoria: nunca se persiste. */
export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; answer: ChatAnswer; feedback: 'none' | 'wrong' }
  | { id: string; role: 'error'; question: string; error: ChatError }
export interface PendingAsk { id: string; question: string; startedAt: number }
export interface ChatState { messages: ChatMessage[]; pending: PendingAsk | null }

/** Milisegundos hasta mostrar «Pensando…». */
export const thinkingDelayMs = 600

export const emptyChat: ChatState = { messages: [], pending: null }

export const clearChat = (): ChatState => emptyChat

/** Una sola pregunta a la vez: si hay una pendiente, el estado no cambia. */
export const startAsk = (state: ChatState, question: string, id: string, now: number): ChatState => {
  if (state.pending) return state
  return { messages: [...state.messages, { id, role: 'user', text: question }], pending: { id, question, startedAt: now } }
}

/** Cierra la pregunta `id`. Si ya no es la pendiente (conversación borrada o pregunta nueva) el resultado se ignora. */
export const resolveAsk = (state: ChatState, id: string, result: Result<ChatAnswer>): ChatState => {
  const pending = state.pending
  if (!pending || pending.id !== id) return state
  // `'error' in result` y no `result.ok`: el tsconfig no activa `strict`, y sin él `ok` no discrimina la unión.
  const message: ChatMessage = 'error' in result
    ? { id: `e-${id}`, role: 'error', question: pending.question, error: result.error }
    : { id: result.value.id, role: 'assistant', answer: result.value, feedback: 'none' }
  return { messages: [...state.messages, message], pending: null }
}

export const markWrong = (state: ChatState, answerId: string): ChatState => ({
  ...state,
  messages: state.messages.map((message) => message.role === 'assistant' && message.answer.id === answerId ? { ...message, feedback: 'wrong' as const } : message),
})

export const elapsedSeconds = (pending: PendingAsk, now: number): number => Math.max(0, Math.floor((now - pending.startedAt) / 1000))
