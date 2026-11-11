import { useEffect, useState } from 'react'
import { formatLongDate, msUntilNextDay } from '../utils/date'

/** Fecha larga de hoy que se actualiza sola al cambiar de día (medianoche local) y al volver a la pestaña (REQ-017). */
export function useToday(): string {
  const [today, setToday] = useState(() => formatLongDate())

  useEffect(() => {
    let timer = 0
    const refresh = () => {
      setToday(formatLongDate())
      window.clearTimeout(timer)
      timer = window.setTimeout(refresh, msUntilNextDay(Date.now()))
    }
    timer = window.setTimeout(refresh, msUntilNextDay(Date.now()))
    const onVisibilityChange = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return today
}
