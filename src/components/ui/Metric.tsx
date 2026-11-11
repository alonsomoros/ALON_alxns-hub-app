export function Metric({ label, value, unit, progress }: { label: string; value: string; unit: string; progress: number }) {
  return <div className="metric">
    <div><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>
    <div className="metric-bar"><i style={{ width: `${progress}%` }} /></div>
  </div>
}
