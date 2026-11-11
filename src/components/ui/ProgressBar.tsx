export function ProgressBar({ label, progress, color }: { label: string; progress: number; color: string }) {
  return <div className="progress-item">
    <div><span>{label}</span><strong>{progress}%</strong></div>
    <div className="progress-track"><i className={color} style={{ width: `${progress}%` }} /></div>
  </div>
}
