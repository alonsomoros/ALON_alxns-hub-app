import type { Quote } from '../types/dashboard'

const maxContentLength = 400
const maxAuthorLength = 120

/** Valida la respuesta de `GET /api/quote`: solo una cita completa (`content` y `author` no vacíos) llega al `blockquote`. */
export function parseQuote(raw: unknown): Quote | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const { content, author } = raw as Record<string, unknown>
  if (typeof content !== 'string' || typeof author !== 'string') return null
  const cleanContent = content.trim()
  const cleanAuthor = author.trim()
  if (!cleanContent || !cleanAuthor || cleanContent.length > maxContentLength || cleanAuthor.length > maxAuthorLength) return null
  return { content: cleanContent, author: cleanAuthor }
}
