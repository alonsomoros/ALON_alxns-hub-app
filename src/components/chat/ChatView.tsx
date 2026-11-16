import { KeyRound, Trash2 } from 'lucide-react'
import { consentWarning, formatCell, messageForError } from '../../domain/chat'
import type { ChatController } from '../../hooks/useChat'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import { SuggestionChips } from './SuggestionChips'
import { TokenGate } from './TokenGate'

/** Vista «Consultas» (REQ-024): habla directamente con `selfbank`; nada pasa por la API del hub ni por Vercel. */
export function ChatView({ chat }: { chat: ChatController }) {
  const { status, suggestions, loadError, state, needsToken, thinkingSeconds } = chat
  const warning = consentWarning(status?.consentDaysLeft ?? null)
  const pending = state.pending !== null
  return <section className="subview chat-view">
    <div className="subview-heading">
      <div><p className="date-label">Tus cuentas</p><h1>Consultas</h1></div>
      <div className="chat-tools">
        {state.messages.length > 0 && <button className="quiet-text-button" type="button" onClick={chat.clear}><Trash2 size={13} aria-hidden="true" /> Borrar conversación</button>}
        {!needsToken && <button className="quiet-text-button" type="button" onClick={chat.changeToken}><KeyRound size={13} aria-hidden="true" /> Cambiar token</button>}
      </div>
    </div>
    {status && <p className="chat-meta">
      {status.dataThrough && <span>Datos hasta {formatCell(status.dataThrough, 'date')}</span>}
      {status.mode === 'mock' && <span className="chat-badge warn">datos de ejemplo</span>}
    </p>}
    {warning && <p className="chat-notice" role="status">{warning}</p>}
    {loadError && !needsToken && <p className="chat-notice" role="alert">{messageForError(loadError)} <button className="answer-action" type="button" onClick={chat.reload}>Reintentar</button></p>}
    {state.messages.length === 0 && !needsToken
      ? <div className="chat-empty">
        <p>Pregunta en lenguaje normal. Siempre te enseño cómo he entendido la pregunta.</p>
        <SuggestionChips suggestions={suggestions} disabled={pending} onPick={chat.ask} />
      </div>
      : <MessageList state={state} thinkingSeconds={thinkingSeconds} onRetry={chat.retry} onWrong={chat.sendWrong} suggestions={suggestions} onPick={chat.ask} />}
    {needsToken ? <TokenGate onSubmit={chat.saveToken} rejected={chat.tokenRejected} /> : <Composer disabled={pending} onSend={chat.ask} />}
  </section>
}
