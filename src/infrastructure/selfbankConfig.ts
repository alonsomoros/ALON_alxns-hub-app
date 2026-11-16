import { createSelfbankClient } from './selfbankClient'
import { createTokenStore, type TokenStorage } from './selfbankToken'

/** Configuración del chat de consultas (REQ-024). `VITE_SELFBANK_URL` es una URL pública (no un secreto) que se incrusta al compilar. */
export const selfbankUrl = (import.meta.env.VITE_SELFBANK_URL as string | undefined)?.trim().replace(/\/+$/, '')
export const selfbankEnabled = Boolean(selfbankUrl)

const sessionStorageOrNull = (): TokenStorage | null => {
  try { return window.sessionStorage } catch { return null }
}

/** El token vive solo en `sessionStorage` (o en memoria si el navegador lo bloquea). */
export const selfbankTokens = createTokenStore(sessionStorageOrNull())
export const selfbankClient = selfbankUrl ? createSelfbankClient({ baseUrl: selfbankUrl, getToken: () => selfbankTokens.get() }) : null
