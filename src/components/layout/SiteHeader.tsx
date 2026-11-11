import { Settings } from 'lucide-react'
import logoApp from '../../assets/logo.png'
import type { DashboardView } from '../../types/dashboard'

const navItems: { view: DashboardView; label: string }[] = [
  { view: 'home', label: 'Inicio' },
  { view: 'goals', label: 'Retos' },
  { view: 'links', label: 'Enlaces' },
]

export function SiteHeader({ activeView, onNavigate, onOpenSettings }: { activeView: DashboardView; onNavigate: (view: DashboardView) => void; onOpenSettings: () => void }) {
  return <header className="site-header">
    <button className="brand-lockup" type="button" onClick={() => onNavigate('home')} aria-label="Volver al inicio"><img className="brand-mark" src={logoApp} alt="alXns logo" /><span>alXns</span></button>
    <div className="header-tools">
      <nav className="main-nav" aria-label="Navegación principal">
        {navItems.map(({ view, label }) => <button className={activeView === view ? 'active' : ''} type="button" onClick={() => onNavigate(view)} key={view}>{label}</button>)}
      </nav>
      <button className={`settings-button${activeView === 'settings' ? ' active' : ''}`} type="button" onClick={onOpenSettings} aria-label="Ajustes" aria-current={activeView === 'settings' ? 'page' : undefined}><Settings size={17} /></button>
    </div>
  </header>
}
