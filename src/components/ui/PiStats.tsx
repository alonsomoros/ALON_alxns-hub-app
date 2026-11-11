import { formatMetric, metricPercent, type PiStatRow } from '../../domain/piStats'
import type { StatsView } from '../../types/dashboard'
import { Metric } from './Metric'

const describe = (row: PiStatRow, loading: boolean) => loading ? `${row.label}: cargando` : formatMetric(row.value, false) === '—' ? `${row.label}: sin dato` : `${row.label}: ${formatMetric(row.value, false)} ${row.unit}`.trim()
const unitOf = (row: PiStatRow, loading: boolean) => loading || formatMetric(row.value, false) === '—' ? '' : row.unit

function Ring({ row, loading }: { row: PiStatRow; loading: boolean }) {
  const percent = metricPercent(row.value)
  return <figure className="stat-ring" role="img" aria-label={describe(row, loading)}>
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle className="stat-track" cx="18" cy="18" r="15.9155" pathLength={100} />
      <circle className="stat-value" cx="18" cy="18" r="15.9155" pathLength={100} strokeDasharray={`${percent} ${100 - percent}`} transform="rotate(-90 18 18)" />
    </svg>
    <strong>{formatMetric(row.value, loading)}<small>{unitOf(row, loading)}</small></strong>
    <figcaption>{row.label}</figcaption>
  </figure>
}

function Gauge({ row, loading }: { row: PiStatRow; loading: boolean }) {
  const percent = metricPercent(row.value)
  return <figure className="stat-gauge" role="img" aria-label={describe(row, loading)}>
    <svg viewBox="0 0 100 56" aria-hidden="true">
      <path className="stat-track" d="M 10 50 A 40 40 0 0 1 90 50" pathLength={100} />
      <path className="stat-value" d="M 10 50 A 40 40 0 0 1 90 50" pathLength={100} strokeDasharray={`${percent} 100`} />
    </svg>
    <strong>{formatMetric(row.value, loading)}<small>{unitOf(row, loading)}</small></strong>
    <figcaption>{row.label}</figcaption>
  </figure>
}

/** Estadísticas de la Raspberry en la vista elegida: barras, anillos o medidores (REQ-003). */
export function PiStats({ view, rows, loading }: { view: StatsView; rows: PiStatRow[]; loading: boolean }) {
  if (view === 'rings') return <div className="pi-rings">{rows.map((row) => <Ring key={row.label} row={row} loading={loading} />)}</div>
  if (view === 'gauges') return <div className="pi-gauges">{rows.map((row) => <Gauge key={row.label} row={row} loading={loading} />)}</div>
  return <div className="pi-metrics">{rows.map((row) => <Metric key={row.label} label={row.label} value={formatMetric(row.value, loading)} unit={unitOf(row, loading)} progress={metricPercent(row.value)} />)}</div>
}
