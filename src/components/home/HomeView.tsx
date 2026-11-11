import { useState } from 'react'
import { useToday } from '../../hooks/useToday'
import { ChevronDown, ChevronRight, CircleCheck, ExternalLink, Server, TriangleAlert, Trophy, Wifi, Zap } from 'lucide-react'
import { prototypePiMetrics, services } from '../../data/dashboardData'
import { goalCategoryConfig, goalProgress } from '../../domain/goals'
import type { ContainerInfo, HabitGoal, HomeCardPref, PiMetrics, PiMetricsStatus, QuickLink, Quote, StatsView } from '../../types/dashboard'
import { BrandLogo } from '../ui/BrandLogo'
import { CardTitle } from '../ui/CardTitle'
import { PiStats } from '../ui/PiStats'
import { ProgressBar } from '../ui/ProgressBar'

interface PiState { pi: PiMetrics | null; status: PiMetricsStatus; ageMinutes: number }

export function HomeView({ quote, links, goals, piState, statsView, cards, onOpenGoals, onOpenLinks }: { quote: Quote; links: QuickLink[]; goals: HabitGoal[]; piState: PiState; statsView: StatsView; cards: HomeCardPref[]; onOpenGoals: () => void; onOpenLinks: () => void }) {
  const today = useToday()
  return <>
    <section className="welcome">
      <p className="date-label">{today}</p>
      <h1>Hola, Alonso.</h1>
      <blockquote>“{quote.content}”<cite>— {quote.author}</cite></blockquote>
    </section>
    <section className="home-grid">
      {cards.filter((card) => card.visible).map((card) => {
        if (card.id === 'pi') return <PiCard {...piState} statsView={statsView} key={card.id} />
        if (card.id === 'goals') return <GoalsSummaryCard goals={goals} onOpenGoals={onOpenGoals} key={card.id} />
        if (card.id === 'services') return <ServicesCard key={card.id} />
        return <LinksSummaryCard links={links} onOpenLinks={onOpenLinks} key={card.id} />
      })}
    </section>
  </>
}

/** Resumen de contenedores: cuántos activos y cuántos con incidencias (reiniciando, muertos o `unhealthy`; los parados a propósito no cuentan). */
function containersSummary(pi: PiMetrics) {
  if (!pi.containers) return null
  const issues = pi.containers.items.filter((item) => item.state === 'restarting' || item.state === 'dead' || item.health === 'unhealthy').length
  return { text: `${pi.containers.running}/${pi.containers.total} contenedores activos`, issues }
}

function piFootNote(pi: PiMetrics | null, status: PiMetricsStatus, ageMinutes: number) {
  if (status === 'prototype') return { text: 'Datos de ejemplo', warn: false }
  if (status === 'loading') return { text: 'Conectando…', warn: false }
  if (status === 'offline') return { text: 'OFFLINE · sin conexión con la API', warn: true }
  if (status === 'stale') return { text: `Último dato hace ${ageMinutes} min`, warn: true }
  if (!pi) return { text: 'Sin datos', warn: true }
  if (pi.sources.prometheus === 'unreachable') return { text: 'Sin datos de Prometheus', warn: true }
  const containers = containersSummary(pi)
  if (!containers) return { text: 'Métricas al día', warn: false }
  return containers.issues > 0 ? { text: `${containers.text} · ${containers.issues} con incidencias`, warn: true } : { text: containers.text, warn: false }
}

const containerStateLabel: Record<string, string> = { running: 'Activo', restarting: 'Reiniciando', exited: 'Parado', dead: 'Caído', paused: 'Pausado', created: 'Creado' }

/** Estado legible de un contenedor y su tono visual (`ok`, `warn` o `off`). */
function containerBadge(item: ContainerInfo) {
  if (item.health === 'unhealthy') return { label: 'No saludable', tone: 'warn' }
  const label = containerStateLabel[item.state] ?? item.state
  const tone = item.state === 'restarting' || item.state === 'dead' ? 'warn' : item.state === 'running' ? 'ok' : 'off'
  return { label: item.health === 'starting' ? `${label} · iniciando` : label, tone }
}

function PiCard({ pi, status, ageMinutes, statsView }: PiState & { statsView: StatsView }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const loading = status === 'loading'
  const metrics = status === 'prototype' ? prototypePiMetrics : pi?.metrics
  const titleStatus = status === 'online' || status === 'degraded' ? 'online' : status === 'stale' || status === 'offline' ? 'offline' : undefined
  const note = piFootNote(pi, status, ageMinutes)
  const items = pi?.containers?.items ?? []
  const rows = [
    { label: 'CPU', value: metrics?.cpuBusyPercent, unit: '%' },
    { label: 'Memoria', value: metrics?.ramUsedPercent, unit: '%' },
    { label: 'Disco', value: metrics?.storageUsedPercent, unit: '%' },
    { label: 'Temperatura', value: metrics?.temperatureCelsius, unit: '°C' },
  ]
  return <article className="card pi-card">
    <CardTitle icon={<Server size={18} />} title="Raspberry Pi 5" meta="Tu pequeño nodo" status={titleStatus} />
    <PiStats view={statsView} rows={rows} loading={loading} />
    {detailOpen && items.length > 0 && <ul className="container-list" id="pi-containers" aria-label="Contenedores de la Raspberry">
      {items.map((item) => { const badge = containerBadge(item); return <li key={item.name}><span className="container-name">{item.name}</span><span className={`container-state ${badge.tone}`}>{badge.label}</span></li> })}
    </ul>}
    <div className="card-foot"><span className="soft-status" aria-live="polite">{note.warn ? <TriangleAlert size={14} /> : <CircleCheck size={14} />} {note.text}</span>{items.length > 0 && <button type="button" aria-expanded={detailOpen} aria-controls="pi-containers" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? 'Ocultar detalle' : 'Ver detalle'} {detailOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>}</div>
  </article>
}

function GoalsSummaryCard({ goals, onOpenGoals }: { goals: HabitGoal[]; onOpenGoals: () => void }) {
  return <article className="card goals-card">
    <CardTitle icon={<Trophy size={18} />} title="Tus retos" meta="Esta semana" badge="12 días seguidos" />
    <div className="goal-bars">{goals.filter((goal) => !goal.archived).slice(0, 2).map((goal) => <ProgressBar label={goal.title} progress={goalProgress(goal)} color={goalCategoryConfig[goal.category].color} key={goal.id} />)}</div>
    <button className="card-action" type="button" onClick={onOpenGoals}>Ver mis retos <ChevronRight size={15} /></button>
  </article>
}

function ServicesCard() {
  return <article className="card services-card">
    <CardTitle icon={<Wifi size={18} />} title="Tus sitios" meta="Ahora mismo" />
    <div className="service-icons">{services.map((service) => <a className={`service-tile ${service.state}`} href={service.url} target="_blank" rel="noreferrer" key={service.name} aria-label={`${service.name}: ${service.state === 'online' ? 'online' : 'offline'}`}><BrandLogo url={service.url} explicitUrl={service.logoUrl} fallback={service.icon} className="service-logo" /><strong>{service.name}</strong><i /></a>)}</div>
  </article>
}

function LinksSummaryCard({ links, onOpenLinks }: { links: QuickLink[]; onOpenLinks: () => void }) {
  return <article className="card links-card">
    <CardTitle icon={<Zap size={18} />} title="Accesos" meta="Tus enlaces" />
    {links.length === 0 && <p className="empty-state">Aún no tienes accesos. Añade los enlaces que más usas.</p>}
    <div className="link-buttons">{links.slice(0, 3).map((link) => <a className="link-button" href={link.url} target="_blank" rel="noreferrer" key={link.id}><BrandLogo url={link.url} explicitUrl={link.logoUrl} fallback={link.icon} className="link-button-logo" /><span>{link.label}</span><ExternalLink size={13} /></a>)}</div>
    <button className="card-action" type="button" onClick={onOpenLinks}>{links.length === 0 ? 'Añadir accesos' : 'Editar accesos'} <ChevronRight size={15} /></button>
  </article>
}
