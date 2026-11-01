import { useEffect, useRef, useState } from 'react'
import {
  BookOpen, Check, ChevronRight, CircleCheck,
  Archive, ExternalLink, Gauge, Globe2, Heart, Link2, Plus, Server, Settings2,
  Sparkles, Target, Trash2, Trophy, Wifi, X, Zap, GripVertical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import logoApp from './assets/logo.png'
import { loadPersistedState, persistenceEnabled, savePersistedState } from './infrastructure/persistence'

interface Quote { content: string; author: string }
interface Service { name: string; url: string; state: 'online' | 'offline'; icon: LucideIcon; logoUrl?: string }
interface QuickLink { id: string; label: string; url: string; icon: LucideIcon; logoUrl?: string }
type GoalCategory = 'reading' | 'movement' | 'learning'
interface GoalSnapshot { current: number; target: number; recordedAt: string }
interface HabitGoal { id: string; title: string; description: string; category: GoalCategory; current: number; target: number; unit: string; archived: boolean; history: GoalSnapshot[] }
interface DashboardConfig { theme: 'soft'; mode: 'light'; quote: 'default' | 'random' | 'fav'; orderServices: string[]; raspberryPiStatsShowcase: 'graph' | 'pbar' }

const resolveBrandLogo = (url: string, explicitLogoUrl?: string) => {
  if (explicitLogoUrl?.trim()) return explicitLogoUrl.trim()
  try {
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const parsed = new URL(safeUrl)
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(parsed.origin)}`
  } catch {
    return null
  }
}

const dashboardConfig: DashboardConfig = {
  theme: 'soft', mode: 'light', quote: 'random', orderServices: ['Hipoglifo.es', 'El Negredo', 'Portfolio'], raspberryPiStatsShowcase: 'pbar',
}
const fallbackQuote: Quote = { content: 'La sencillez es la máxima sofisticación.', author: 'Leonardo da Vinci' }
const services: Service[] = [
  { name: 'Hipoglifo.es', url: 'https://hipoglifo.es', state: 'online', icon: Globe2 },
  { name: 'El Negredo', url: 'https://el-negredo.vercel.app', state: 'online', icon: Sparkles },
  { name: 'Portfolio', url: 'https://alonsomoros.github.io', state: 'online', icon: Link2 },
]
const defaultLinks: QuickLink[] = [
  { id: 'cubari', label: 'One Piece Cubari', url: 'https://cubari.moe', icon: BookOpen },
  { id: 'merinero', label: 'Autoescuela Merinero', url: 'https://autoescuelamerinero.com', icon: Globe2 },
  { id: 'manhwas', label: 'Manhwas', url: 'https://example.com', icon: Heart },
]
const goalCategoryConfig: Record<GoalCategory, { label: string; color: string; icon: LucideIcon }> = {
  reading: { label: 'Lectura', color: 'green', icon: BookOpen },
  movement: { label: 'Movimiento', color: 'yellow', icon: Gauge },
  learning: { label: 'Aprendizaje', color: 'blue', icon: Target },
}
const defaultGoals: HabitGoal[] = [
  { id: 'reading', title: 'Leer 30 páginas', description: 'Mantener una sesión de lectura diaria.', category: 'reading', current: 18, target: 30, unit: 'páginas', archived: false, history: [] },
  { id: 'movement', title: 'Mover el cuerpo', description: 'Completar sesiones de movimiento esta semana.', category: 'movement', current: 4, target: 5, unit: 'sesiones', archived: false, history: [] },
  { id: 'learning', title: 'Aprender algo nuevo', description: 'Reservar tiempo para aprender.', category: 'learning', current: 0, target: 1, unit: 'sesiones', archived: false, history: [] },
]
const goalProgress = (goal: HabitGoal) => goal.target > 0 ? Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100))) : 0

function App() {
  const [isReady, setIsReady] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setIsReady(true), 700); return () => window.clearTimeout(timer) }, [])
  return isReady ? <Dashboard /> : <SplashScreen />
}

function SplashScreen() {
  return <main className="splash-screen" aria-label="Cargando alXns Central Hub"><div className="splash-content"><img className="brand-mark brand-mark-large" src={logoApp} alt="alXns logo" /><h1>alXns</h1><div className="loading-track"><div className="loading-fill" /></div></div></main>
}

function Dashboard() {
  const [activeView, setActiveView] = useState<'home' | 'goals' | 'links'>('home')
  const [quote, setQuote] = useState<Quote>(fallbackQuote)
  const [links, setLinks] = useState(defaultLinks)
  const [goals, setGoals] = useState(defaultGoals)
  const [editingGoal, setEditingGoal] = useState<HabitGoal | null>(null)
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false)
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [isPersistenceHydrated, setIsPersistenceHydrated] = useState(!persistenceEnabled)
  const [persistenceStatus, setPersistenceStatus] = useState<'loading' | 'online' | 'offline' | 'local'>(persistenceEnabled ? 'loading' : 'local')
  const persistenceVersion = useRef(0)

  useEffect(() => {
    if (!persistenceEnabled) return
    loadPersistedState().then(({ state, source }) => {
      setPersistenceStatus(source === 'remote' ? 'online' : 'offline')
      if (state) {
        persistenceVersion.current = state.version
        setGoals(state.goals)
        setLinks(state.links.map((link) => ({ ...link, icon: Link2 })))
      }
    }).catch(() => setPersistenceStatus('offline')).finally(() => setIsPersistenceHydrated(true))
  }, [])

  useEffect(() => {
    if (!isPersistenceHydrated || !persistenceEnabled) return
    savePersistedState({
      version: persistenceVersion.current,
      preferences: { ...dashboardConfig },
      goals,
      links: links.map((link, position) => ({ id: link.id, label: link.label, url: link.url, logoUrl: link.logoUrl, position, archived: false })),
    }).then((persistedState) => {
      if (persistedState) {
        persistenceVersion.current = persistedState.version
        setPersistenceStatus('online')
      }
    }).catch(() => setPersistenceStatus('offline'))
  }, [goals, isPersistenceHydrated, links])

  useEffect(() => {
    if (dashboardConfig.quote === 'default') return
    const controller = new AbortController()
    fetch('https://api.quotable.io/random?tags=wisdom|inspirational', { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ content: string; author: string }> : Promise.reject())
      .then((result) => setQuote({ content: result.content, author: result.author }))
      .catch(() => setQuote(fallbackQuote))
    return () => controller.abort()
  }, [])

  const addLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return
    const url = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`
    setLinks((current) => [...current, { id: crypto.randomUUID(), label: newLink.label.trim(), url, icon: Link2 }])
    setNewLink({ label: '', url: '' }); setIsAddLinkOpen(false)
  }
  const reorderLinks = (sourceId: string, targetId: string) => setLinks((current) => {
    if (sourceId === targetId) return current
    const sourceIndex = current.findIndex((link) => link.id === sourceId)
    const targetIndex = current.findIndex((link) => link.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return current
    const next = [...current]
    const [movedLink] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, movedLink)
    return next
  })
  const saveGoal = (goal: HabitGoal) => {
    setGoals((current) => current.some((item) => item.id === goal.id) ? current.map((item) => {
      if (item.id !== goal.id) return item
      const changedProgress = item.current !== goal.current || item.target !== goal.target
      const history = changedProgress ? [...item.history, { current: item.current, target: item.target, recordedAt: new Date().toISOString() }] : item.history
      return { ...goal, history }
    }) : [...current, goal])
    setEditingGoal(null); setIsGoalFormOpen(false)
  }
  const archiveGoal = (id: string) => setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, archived: true } : goal))
  const openNewGoal = () => { setEditingGoal(null); setIsGoalFormOpen(true) }
  const openEditGoal = (goal: HabitGoal) => { setEditingGoal(goal); setIsGoalFormOpen(true) }

  return <main className="app-shell">
    <header className="site-header"><button className="brand-lockup" type="button" onClick={() => setActiveView('home')} aria-label="Volver al inicio"><img className="brand-mark" src={logoApp} alt="alXns logo" /><span>alXns</span></button><nav className="main-nav" aria-label="Navegación principal"><button className={activeView === 'home' ? 'active' : ''} type="button" onClick={() => setActiveView('home')}>Inicio</button><button className={activeView === 'goals' ? 'active' : ''} type="button" onClick={() => setActiveView('goals')}>Retos</button><button className={activeView === 'links' ? 'active' : ''} type="button" onClick={() => setActiveView('links')}>Enlaces</button></nav></header>
    {activeView === 'home' && <HomeView quote={quote} links={links} goals={goals} onOpenGoals={() => setActiveView('goals')} onOpenLinks={() => setActiveView('links')} />}
    {activeView === 'goals' && <GoalsView goals={goals} onBack={() => setActiveView('home')} onAdd={openNewGoal} onEdit={openEditGoal} onArchive={archiveGoal} />}
    {activeView === 'links' && <LinksView links={links} isAddLinkOpen={isAddLinkOpen} newLink={newLink} onBack={() => setActiveView('home')} onAdd={() => setIsAddLinkOpen(true)} onDelete={(id) => setLinks((current) => current.filter((link) => link.id !== id))} onReorder={reorderLinks} onCloseAdd={() => setIsAddLinkOpen(false)} onNewLinkChange={setNewLink} onConfirmAdd={addLink} />}
    <footer className="site-footer"><span>alXns · tu espacio personal</span><span className="soft-status" aria-live="polite">{persistenceStatus === 'online' ? 'Sincronizado' : persistenceStatus === 'loading' ? 'Conectando' : persistenceStatus === 'local' ? 'Solo local' : 'OFFLINE'}</span><span>hecho para ir a tu ritmo</span></footer>
    {isGoalFormOpen && <GoalForm goal={editingGoal} onClose={() => { setEditingGoal(null); setIsGoalFormOpen(false) }} onSave={saveGoal} />}
  </main>
}

function HomeView({ quote, links, goals, onOpenGoals, onOpenLinks }: { quote: Quote; links: QuickLink[]; goals: HabitGoal[]; onOpenGoals: () => void; onOpenLinks: () => void }) {
  return <><section className="welcome"><p className="date-label">27 de octubre de 2026</p><h1>Hola, Alonso.</h1><blockquote>“{quote.content}”<cite>— {quote.author}</cite></blockquote></section><section className="home-grid">
    <article className="card pi-card"><CardTitle icon={<Server size={18} />} title="Raspberry Pi 5" meta="Tu pequeño nodo" status="online" /><div className="pi-metrics"><Metric label="CPU" value="24" unit="%" progress={24} /><Metric label="Memoria" value="61" unit="%" progress={61} /><Metric label="Temperatura" value="47" unit="°C" progress={47} /></div><div className="card-foot"><span className="soft-status"><CircleCheck size={14} /> Todo bien</span><button type="button">Ver detalle <ChevronRight size={14} /></button></div></article>
    <article className="card goals-card"><CardTitle icon={<Trophy size={18} />} title="Tus retos" meta="Esta semana" badge="12 días seguidos" /><div className="goal-bars">{goals.filter((goal) => !goal.archived).slice(0, 2).map((goal) => <ProgressBar label={goal.title} progress={goalProgress(goal)} color={goalCategoryConfig[goal.category].color} key={goal.id} />)}</div><button className="card-action" type="button" onClick={onOpenGoals}>Ver mis retos <ChevronRight size={15} /></button></article>
    <article className="card services-card"><CardTitle icon={<Wifi size={18} />} title="Tus sitios" meta="Ahora mismo" /><div className="service-icons">{services.map((service) => <a className={`service-tile ${service.state}`} href={service.url} target="_blank" rel="noreferrer" key={service.name} aria-label={`${service.name}: ${service.state === 'online' ? 'online' : 'offline'}`}><BrandLogo url={service.url} explicitUrl={service.logoUrl} fallback={service.icon} className="service-logo" /><strong>{service.name}</strong><i /></a>)}</div></article>
    <article className="card links-card"><CardTitle icon={<Zap size={18} />} title="Accesos" meta="Tus enlaces" /><div className="link-buttons">{links.slice(0, 3).map((link) => <a className="link-button" href={link.url} target="_blank" rel="noreferrer" key={link.id}><BrandLogo url={link.url} explicitUrl={link.logoUrl} fallback={link.icon} className="link-button-logo" /><span>{link.label}</span><ExternalLink size={13} /></a>)}</div><button className="card-action" type="button" onClick={onOpenLinks}>Editar accesos <ChevronRight size={15} /></button></article>
  </section></>
}

function GoalsView({ goals, onBack, onAdd, onEdit, onArchive }: { goals: HabitGoal[]; onBack: () => void; onAdd: () => void; onEdit: (goal: HabitGoal) => void; onArchive: (id: string) => void }) { return <section className="subview"><button className="back-button" type="button" onClick={onBack}><ChevronRight size={16} /> Volver</button><div className="subview-heading"><div><p className="date-label">Tu progreso</p><h1>Retos y hábitos</h1></div><button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Nuevo reto</button></div><div className="goals-board">{goals.filter((goal) => !goal.archived).map((goal) => <GoalCard goal={goal} key={goal.id} onEdit={onEdit} onArchive={onArchive} />)}</div></section> }
function GoalCard({ goal, onEdit, onArchive }: { goal: HabitGoal; onEdit: (goal: HabitGoal) => void; onArchive: (id: string) => void }) { const category = goalCategoryConfig[goal.category]; const progress = goalProgress(goal); return <article className="goal-card"><div className={`goal-card-icon ${category.color}`}><category.icon size={20} /></div><div className="goal-card-info"><h2>{goal.title}</h2><p>{goal.description}</p><span className="goal-range">{goal.current} / {goal.target} {goal.unit}</span><ProgressBar label={`${progress}%`} progress={progress} color={category.color} /></div><button className="quiet-button" type="button" onClick={() => onEdit(goal)} aria-label={`Editar ${goal.title}`}><Settings2 size={16} /></button><button className="quiet-button" type="button" onClick={() => onArchive(goal.id)} aria-label={`Archivar ${goal.title}`}><Archive size={16} /></button></article> }

function GoalForm({ goal, onClose, onSave }: { goal: HabitGoal | null; onClose: () => void; onSave: (goal: HabitGoal) => void }) {
  const [draft, setDraft] = useState<HabitGoal>(goal ?? { id: crypto.randomUUID(), title: '', description: '', category: 'reading', current: 0, target: 1, unit: 'páginas', archived: false, history: [] })
  const category = goalCategoryConfig[draft.category]
  const update = <K extends keyof HabitGoal>(key: K, value: HabitGoal[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = () => { if (!draft.title.trim() || !draft.description.trim() || draft.target <= 0 || draft.current < 0 || !draft.unit.trim()) return; onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim(), unit: draft.unit.trim() }) }
  return <div className="goal-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className="goal-modal" role="dialog" aria-modal="true" aria-labelledby="goal-form-title"><div className="form-heading"><strong id="goal-form-title">{goal ? 'Editar reto' : 'Nuevo reto'}</strong><button className="quiet-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={17} /></button></div><label>Título<input value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="Leer 30 páginas" /></label><label>Descripción<textarea value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe el objetivo" /></label><label>Categoría<select value={draft.category} onChange={(event) => update('category', event.target.value as GoalCategory)}>{Object.entries(goalCategoryConfig).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select></label><div className="goal-form-fields"><label>Actual<input type="number" min="0" value={draft.current} onChange={(event) => update('current', Number(event.target.value))} /></label><label>Objetivo<input type="number" min="1" value={draft.target} onChange={(event) => update('target', Number(event.target.value))} /></label><label>Unidad<input value={draft.unit} onChange={(event) => update('unit', event.target.value)} placeholder="páginas" /></label></div><span className={`goal-form-preview ${category.color}`}>Progreso: {goalProgress(draft)}%</span><button className="primary-button" type="button" onClick={submit}><Check size={16} /> Guardar reto</button></section></div>
}

function BrandLogo({ url, explicitUrl, fallback: Icon, className }: { url: string; explicitUrl?: string; fallback: LucideIcon; className: string }) {
  const logoUrl = resolveBrandLogo(url, explicitUrl)
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'fallback'>(() => logoUrl ? 'loading' : 'fallback')

  if (!logoUrl || imageState === 'fallback') {
    return <span className={`${className} brand-fallback`} aria-hidden="true"><Icon size={18} /></span>
  }

  return <span className={`${className} brand-icon`} aria-hidden="true"><img key={logoUrl} src={logoUrl} alt="" onLoad={() => setImageState('ready')} onError={() => setImageState('fallback')} /><span className={`brand-sheen ${imageState === 'loading' ? 'active' : ''}`} /></span>
}

function LinksView({ links, isAddLinkOpen, newLink, onBack, onAdd, onDelete, onReorder, onCloseAdd, onNewLinkChange, onConfirmAdd }: { links: QuickLink[]; isAddLinkOpen: boolean; newLink: { label: string; url: string }; onBack: () => void; onAdd: () => void; onDelete: (id: string) => void; onReorder: (sourceId: string, targetId: string) => void; onCloseAdd: () => void; onNewLinkChange: (value: { label: string; url: string }) => void; onConfirmAdd: () => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const moveLink = (sourceId: string, direction: -1 | 1) => {
    const sourceIndex = links.findIndex((link) => link.id === sourceId)
    const targetIndex = sourceIndex + direction
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= links.length) return
    onReorder(sourceId, links[targetIndex].id)
  }

  return <section className="subview"><button className="back-button" type="button" onClick={onBack}><ChevronRight size={16} /> Volver</button><div className="subview-heading"><div><p className="date-label">Tu colección</p><h1>Enlaces</h1></div><button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Añadir enlace</button></div><div className="editable-links">{links.map((link, index) => <div className={`editable-link ${draggedId === link.id ? 'is-dragging' : ''}`} draggable={true} key={link.id} tabIndex={0} onKeyDown={(event) => {
          if (event.key === 'ArrowUp') { event.preventDefault(); moveLink(link.id, -1) }
          if (event.key === 'ArrowDown') { event.preventDefault(); moveLink(link.id, 1) }
        }} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', link.id); setDraggedId(link.id) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedId) onReorder(draggedId, link.id); setDraggedId(null) }} onDragEnd={() => setDraggedId(null)}><button className="drag-handle" type="button" aria-label={`Mover ${link.label} arriba o abajo`} title="Mover enlace" onClick={() => moveLink(link.id, index > 0 ? -1 : 1)}><GripVertical size={18} /></button><BrandLogo url={link.url} explicitUrl={link.logoUrl} fallback={link.icon} className="editable-link-icon" /><span className="editable-link-text"><strong>{link.label}</strong><small>{link.url}</small></span><a className="quiet-button" href={link.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${link.label}`}><ExternalLink size={16} /></a><button className="delete-button" type="button" onClick={() => onDelete(link.id)} aria-label={`Borrar ${link.label}`}><Trash2 size={16} /></button></div>)}</div>{isAddLinkOpen && <div className="add-link-form"><div className="form-heading"><strong>Nuevo enlace</strong><button className="quiet-button" type="button" onClick={onCloseAdd} aria-label="Cerrar"><X size={17} /></button></div><label>Nombre<input value={newLink.label} onChange={(event) => onNewLinkChange({ ...newLink, label: event.target.value })} placeholder="Mi sitio" /></label><label>Dirección<input value={newLink.url} onChange={(event) => onNewLinkChange({ ...newLink, url: event.target.value })} placeholder="https://..." /></label><button className="primary-button" type="button" onClick={onConfirmAdd}><Check size={16} /> Guardar enlace</button></div>}</section>
}

function CardTitle({ icon, title, meta, status, badge }: { icon: React.ReactNode; title: string; meta: string; status?: 'online' | 'offline'; badge?: string }) { return <div className="card-title"><div className="title-icon">{icon}</div><div><h2>{title}</h2><span>{meta}</span></div>{badge && <span className="card-title-badge">{badge}</span>}{status && <span className={`tiny-status ${status}`}><i /> {status === 'online' ? 'Activo' : 'No disponible'}</span>}</div> }
function Metric({ label, value, unit, progress }: { label: string; value: string; unit: string; progress: number }) { return <div className="metric"><div><span>{label}</span><strong>{value}<small>{unit}</small></strong></div><div className="metric-bar"><i style={{ width: `${progress}%` }} /></div></div> }
function ProgressBar({ label, progress, color }: { label: string; progress: number; color: string }) { return <div className="progress-item"><div><span>{label}</span><strong>{progress}%</strong></div><div className="progress-track"><i className={color} style={{ width: `${progress}%` }} /></div></div> }

export default App
