import { useState, type KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { maxQuestionLength } from '../../domain/chat'

/** Enter envía y Mayús+Enter salta de línea. Queda deshabilitado mientras haya una pregunta en curso. */
export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (question: string) => void }) {
  const [value, setValue] = useState('')
  const send = () => {
    if (disabled || !value.trim()) return
    onSend(value)
    setValue('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }
  return <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send() }}>
    <textarea aria-label="Escribe tu pregunta" placeholder="Pregunta por tus gastos, ingresos o saldo…" rows={1} maxLength={maxQuestionLength} value={value}
      onChange={(event) => { setValue(event.target.value); event.target.style.height = 'auto'; event.target.style.height = `${event.target.scrollHeight}px` }} onKeyDown={onKeyDown} />
    <button className="chat-send" type="submit" aria-label="Enviar pregunta" disabled={disabled || !value.trim()}><SendHorizontal size={18} aria-hidden="true" /></button>
  </form>
}
