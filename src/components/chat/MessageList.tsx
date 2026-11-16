import { useEffect, useRef } from 'react'
import { messageForError } from '../../domain/chat'
import type { ChatState } from '../../domain/chatState'
import type { Suggestion } from '../../domain/chat'
import { AnswerCard } from './AnswerCard'
import { SuggestionChips } from './SuggestionChips'
import { ThinkingBubble } from './ThinkingBubble'

interface MessageListProps {
  state: ChatState
  thinkingSeconds: number | null
  onRetry: (question: string) => void
  onWrong: (answerId: string) => void
  /** Sugerencias para seguir cuando la última respuesta no se resolvió (`needs_clarification` o `unsupported`). */
  suggestions: Suggestion[]
  onPick: (question: string) => void
}

export function MessageList({ state, thinkingSeconds, onRetry, onWrong, suggestions, onPick }: MessageListProps) {
  const end = useRef<HTMLDivElement>(null)
  const showThinking = state.pending !== null && thinkingSeconds !== null
  const last = state.messages[state.messages.length - 1]
  const followUps = last?.role === 'assistant' && last.answer.status !== 'answered' && state.pending === null ? suggestions.slice(0, 3) : []
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' }) }, [state.messages.length, showThinking])
  return <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación">
    {state.messages.map((message) => {
      if (message.role === 'user') return <div className="chat-bubble user" key={message.id}>{message.text}</div>
      if (message.role === 'assistant') return <AnswerCard answer={message.answer} feedback={message.feedback} onWrong={() => onWrong(message.answer.id)} key={message.id} />
      return <div className="chat-bubble error" role="alert" key={message.id}>
        <p className="answer-text">{messageForError(message.error)}</p>
        <div className="answer-actions"><button className="answer-action" type="button" disabled={state.pending !== null} onClick={() => onRetry(message.question)}>Reintentar</button></div>
      </div>
    })}
    {followUps.length > 0 && <div className="chat-followups"><SuggestionChips suggestions={followUps} disabled={false} onPick={onPick} /></div>}
    {showThinking && <ThinkingBubble seconds={thinkingSeconds} />}
    <div className="chat-end" ref={end} />
  </div>
}
