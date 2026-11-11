import { useEffect, useState } from 'react'
import { fallbackQuote, quoteMode } from '../data/dashboardData'
import { fetchQuote } from '../infrastructure/quote'
import type { Quote } from '../types/dashboard'

/** Cita de Inicio: la frase del día en español de la API personal; si no hay API o falla, la frase de reserva local (REQ-021). */
export function useQuote(): Quote {
  const [quote, setQuote] = useState<Quote>(fallbackQuote)

  useEffect(() => {
    if (quoteMode === 'default') return
    const controller = new AbortController()
    void fetchQuote(controller.signal).then((result) => { if (result && !controller.signal.aborted) setQuote(result) })
    return () => controller.abort()
  }, [])

  return quote
}
