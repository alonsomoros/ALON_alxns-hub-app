import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'

/** Pide el token de `selfbank`. `autoComplete="current-password"` deja que el gestor de contraseñas del móvil lo rellene. */
export function TokenGate({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [token, setToken] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!token.trim()) return
    onSubmit(token)
    setToken('')
  }
  return <form className="card token-gate" onSubmit={submit}>
    <label htmlFor="selfbank-token"><KeyRound size={15} aria-hidden="true" /> Token de selfbank</label>
    <p className="settings-hint">Se guarda solo mientras dure esta sesión del navegador.</p>
    <div className="token-gate-row">
      <input id="selfbank-token" name="selfbank-token" type="password" autoComplete="current-password" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} />
      <button className="chat-primary" type="submit" disabled={!token.trim()}>Entrar</button>
    </div>
  </form>
}
