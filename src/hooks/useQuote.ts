import { useEffect, useState } from 'react'
import { fallbackQuote, quoteMode } from '../data/dashboardData'
import type { Quote } from '../types/dashboard'

export function useQuote(): Quote {
  const [quote, setQuote] = useState<Quote>(fallbackQuote)

  useEffect(() => {
    if (quoteMode === 'default') return
    const controller = new AbortController()
    fetch('https://api.quotable.io/random?tags=wisdom|inspirational', { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ content: string; author: string }> : Promise.reject())
      .then((result) => setQuote({ content: result.content, author: result.author }))
      .catch(() => setQuote(fallbackQuote))
    return () => controller.abort()
  }, [])

  return quote
}
