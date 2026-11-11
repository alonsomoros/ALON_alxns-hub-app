/**
 * La API devuelve `version: 0` cuando la base de datos está vacía (nunca se ha guardado nada).
 * Solo un estado ya guardado (`version >= 1`) debe sustituir los datos de ejemplo.
 */
export const shouldAdoptRemote = (state: { version: number } | null): boolean => state !== null && state.version >= 1
