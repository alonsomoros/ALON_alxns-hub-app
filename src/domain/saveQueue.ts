/**
 * Cola de guardado de un solo vuelo: nunca ejecuta dos guardados a la vez y los avisos que llegan mientras uno
 * está en curso se agrupan en una única ejecución posterior (que lee el estado más reciente al empezar).
 */
export function createSaveQueue(run: () => Promise<void>) {
  let current: Promise<void> | null = null
  let pending = false

  const loop = async () => {
    try {
      do {
        pending = false
        await run()
      } while (pending)
    } finally {
      current = null
    }
  }

  return {
    request(): Promise<void> {
      if (current) {
        pending = true
        return current
      }
      current = loop()
      return current
    },
  }
}
