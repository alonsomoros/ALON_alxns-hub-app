import { useEffect, useRef } from 'react'
import { messageForError } from '../../domain/chat'
import type { ChatState } from '../../domain/chatState'
import { AnswerCard } from './AnswerCard'
import { ThinkingBubble } from './ThinkingBubble'

interface MessageListProps {
  state: ChatState
  thinkingSeconds: number | null
  onRetry: (question: string) => void
  onWrong: (answerId: string) => void
}

export function MessageList({ state, thinkingSeconds, onRetry, onWrong }: MessageListProps) {
  const end = useRef<HTMLDivElement>(null)
  const showThinking = state.pending !== null && thinkingSeconds !== null
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
    {showThinking && <ThinkingBubble seconds={thinkingSeconds} />}
    <div ref={end} />
  </div>
}
