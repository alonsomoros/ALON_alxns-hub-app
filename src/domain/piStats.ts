export interface PiStatRow { label: string; value: number | null | undefined; unit: string }

const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)

/** Valor de la métrica para mostrar: `…` mientras carga, `—` sin dato, entero o un decimal. */
export const formatMetric = (value: number | null | undefined, loading: boolean): string =>
  loading ? '…' : !isNumber(value) ? '—' : value.toFixed(value % 1 === 0 ? 0 : 1)

/** Porcentaje acotado a 0-100 para dibujar barras, anillos y medidores; un dato ausente o inválido cuenta como 0. */
export const metricPercent = (value: number | null | undefined): number => !isNumber(value) ? 0 : Math.min(100, Math.max(0, value))
