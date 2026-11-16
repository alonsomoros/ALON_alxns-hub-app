import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeQuestion, type ChatError, type ChatStatus, type Result, type Suggestion } from '../domain/chat'
import { clearChat, elapsedSeconds, emptyChat, markWrong, resolveAsk, startAsk, thinkingDelayMs, type ChatState } from '../domain/chatState'
import type { SelfbankClient } from '../infrastructure/selfbankClient'
import type { TokenStore } from '../infrastructure/selfbankToken'

export interface ChatController {
  needsToken: boolean
  /** `true` si selfbank acaba de rechazar el token (401): la interfaz lo avisa al pedirlo de nuevo. */
  tokenRejected: boolean
  saveToken(token: string): void
  status: ChatStatus | null
  suggestions: Suggestion[]
  /** Fallo al cargar el estado o las sugerencias (no de una pregunta). */
  loadError: ChatError | null
  state: ChatState
  /** Segundos de espera de la pregunta en curso; `null` si no hay ninguna o aún no pasó el retardo de «Pensando…». */
  thinkingSeconds: number | null
  ask(question: string): void
  /** Vuelve a preguntar lo mismo tras un error. */
  retry(question: string): void
  sendWrong(answerId: string): void
  /** Reintenta cargar el estado y las sugerencias. */
  reload(): void
  clear(): void
}

const isUnauthorized = <T,>(result: Result<T>) => 'error' in result && result.error.code === 'unauthorized'

/**
 * Chat de consultas (REQ-024). El estado vive en memoria y se llama desde `Dashboard`, así que la conversación y la petición en curso
 * sobreviven al cambio de vista. Un `401` borra el token y deja la conversación intacta.
 */
export function useChat(client: SelfbankClient | null, tokens: TokenStore, active: boolean): ChatController {
  const [hasToken, setHasToken] = useState(() => Boolean(tokens.get()))
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadError, setLoadError] = useState<ChatError | null>(null)
  const [state, setState] = useState<ChatState>(emptyChat)
  const [now, setNow] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [tokenRejected, setTokenRejected] = useState(false)
  const stateRef = useRef<ChatState>(emptyChat)
  const counterRef = useRef(0)

  const commit = useCallback((update: (current: ChatState) => ChatState) => {
    stateRef.current = update(stateRef.current)
    setState(stateRef.current)
  }, [])

  const dropToken = useCallback(() => { tokens.clear(); setHasToken(false); setTokenRejected(true) }, [tokens])

  useEffect(() => {
    if (!client || !active || !hasToken) return
    let cancelled = false
    const load = async () => {
      const [statusResult, suggestionsResult] = await Promise.all([client.status(), client.suggestions()])
      if (cancelled) return
      if (isUnauthorized(statusResult) || isUnauthorized(suggestionsResult)) return dropToken()
      if ('value' in statusResult) setStatus(statusResult.value)
      if ('value' in suggestionsResult) setSuggestions(suggestionsResult.value)
      const failed = 'error' in statusResult ? statusResult : 'error' in suggestionsResult ? suggestionsResult : null
      setLoadError(failed ? failed.error : null)
    }
    void load()
    return () => { cancelled = true }
  }, [client, active, hasToken, reloadKey, dropToken])

  const pendingId = state.pending?.id
  useEffect(() => {
    if (!pendingId) return
    const first = window.setTimeout(() => setNow(Date.now()), thinkingDelayMs)
    const ticker = window.setInterval(() => setNow(Date.now()), 1000)
    return () => { window.clearTimeout(first); window.clearInterval(ticker) }
  }, [pendingId])

  const ask = useCallback((question: string) => {
    const normalized = normalizeQuestion(question)
    if (!client || !normalized || stateRef.current.pending) return
    counterRef.current += 1
    const id = `q${counterRef.current}`
    commit((current) => startAsk(current, normalized, id, Date.now()))
    void client.ask(normalized).then((result) => {
      if (isUnauthorized(result)) dropToken()
      commit((current) => resolveAsk(current, id, result))
    })
  }, [client, commit, dropToken])

  const sendWrong = useCallback((answerId: string) => {
    if (!client) return
    void client.feedback(answerId, 'wrong').then((result) => {
      if (isUnauthorized(result)) return dropToken()
      if ('value' in result) commit((current) => markWrong(current, answerId))
    })
  }, [client, commit, dropToken])

  const saveToken = useCallback((token: string) => {
    tokens.set(token)
    setLoadError(null)
    setTokenRejected(false)
    setHasToken(Boolean(tokens.get()))
  }, [tokens])

  const clear = useCallback(() => commit(() => clearChat()), [commit])
  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const pending = state.pending
  const thinkingSeconds = pending && now - pending.startedAt >= thinkingDelayMs ? elapsedSeconds(pending, now) : null

  return { needsToken: client !== null && !hasToken, tokenRejected, saveToken, status, suggestions, loadError, state, thinkingSeconds, ask, retry: ask, sendWrong, reload, clear }
}
