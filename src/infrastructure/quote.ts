import { parseQuote } from '../domain/quote'
import type { Quote } from '../types/dashboard'
import { persistenceUrl } from './persistence'

const requestTimeoutMs = 1500

/** Cita del día en español desde `GET /api/quote` de la API personal (REQ-021). `null` si no hay API, falla, caduca o no es válida. */
export async function fetchQuote(signal?: AbortSignal): Promise<Quote | null> {
  if (!persistenceUrl) return null
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort)
  try {
    const response = await fetch(`${persistenceUrl}/api/quote`, { signal: controller.signal })
    return response.ok ? parseQuote(await response.json()) : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
