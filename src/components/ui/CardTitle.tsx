import type { ReactNode } from 'react'

export function CardTitle({ icon, title, meta, status, badge }: { icon: ReactNode; title: string; meta: string; status?: 'online' | 'offline'; badge?: string }) {
  return <div className="card-title">
    <div className="title-icon">{icon}</div>
    <div><h2>{title}</h2><span>{meta}</span></div>
    {badge && <span className="card-title-badge">{badge}</span>}
    {status && <span className={`tiny-status ${status}`}><i /> {status === 'online' ? 'Activo' : 'No disponible'}</span>}
  </div>
}
