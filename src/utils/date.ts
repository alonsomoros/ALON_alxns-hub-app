const longDateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

/** Fecha larga en español en la zona horaria local, p. ej. "11 de noviembre de 2026" (REQ-017). */
export const formatLongDate = (timestamp: number = Date.now()) => longDateFormatter.format(timestamp)
