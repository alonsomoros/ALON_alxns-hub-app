import logoApp from '../../assets/logo.png'
import type { DashboardView } from '../../types/dashboard'

const navItems: { view: DashboardView; label: string }[] = [
  { view: 'home', label: 'Inicio' },
  { view: 'goals', label: 'Retos' },
  { view: 'links', label: 'Enlaces' },
]

export function SiteHeader({ activeView, onNavigate }: { activeView: DashboardView; onNavigate: (view: DashboardView) => void }) {
  return <header className="site-header">
    <button className="brand-lockup" type="button" onClick={() => onNavigate('home')} aria-label="Volver al inicio"><img className="brand-mark" src={logoApp} alt="alXns logo" /><span>alXns</span></button>
    <nav className="main-nav" aria-label="Navegación principal">
      {navItems.map(({ view, label }) => <button className={activeView === view ? 'active' : ''} type="button" onClick={() => onNavigate(view)} key={view}>{label}</button>)}
    </nav>
  </header>
}
