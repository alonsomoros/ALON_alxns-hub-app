/** Almacén del token de `selfbank` (REQ-024). El almacenamiento se inyecta (`sessionStorage` en la app): nunca `localStorage`, la URL ni el bundle. */
export interface TokenStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface TokenStore { get(): string | null; set(token: string): void; clear(): void }

const tokenKey = 'alxns:selfbank-token'

/** Si el almacenamiento falla o no existe, el token se conserva solo en memoria durante la sesión. */
export const createTokenStore = (storage: TokenStorage | null): TokenStore => {
  let memory: string | null = null
  const clear = () => {
    memory = null
    try { storage?.removeItem(tokenKey) } catch { /* el almacenamiento puede estar bloqueado */ }
  }
  return {
    get() {
      if (memory) return memory
      try { return storage?.getItem(tokenKey) ?? null } catch { return null }
    },
    set(token) {
      const value = token.trim()
      if (!value) return clear()
      memory = value
      try { storage?.setItem(tokenKey, value) } catch { /* se queda en memoria */ }
    },
    clear,
  }
}
