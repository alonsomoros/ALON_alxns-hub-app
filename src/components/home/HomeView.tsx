import { useState } from 'react'
import { ChevronRight, CircleCheck, ExternalLink, Server, Trophy, Wifi, Zap } from 'lucide-react'
import { services } from '../../data/dashboardData'
import { goalCategoryConfig, goalProgress } from '../../domain/goals'
import type { HabitGoal, QuickLink, Quote } from '../../types/dashboard'
import { formatLongDate } from '../../utils/date'
import { BrandLogo } from '../ui/BrandLogo'
import { CardTitle } from '../ui/CardTitle'
import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'

export function HomeView({ quote, links, goals, onOpenGoals, onOpenLinks }: { quote: Quote; links: QuickLink[]; goals: HabitGoal[]; onOpenGoals: () => void; onOpenLinks: () => void }) {
  const [today] = useState(() => formatLongDate(Date.now()))
  return <>
    <section className="welcome">
      <p className="date-label">{today}</p>
      <h1>Hola, Alonso.</h1>
      <blockquote>“{quote.content}”<cite>— {quote.author}</cite></blockquote>
    </section>
    <section className="home-grid">
      <PiCard />
      <GoalsSummaryCard goals={goals} onOpenGoals={onOpenGoals} />
      <ServicesCard />
      <LinksSummaryCard links={links} onOpenLinks={onOpenLinks} />
    </section>
  </>
}

function PiCard() {
  return <article className="card pi-card">
    <CardTitle icon={<Server size={18} />} title="Raspberry Pi 5" meta="Tu pequeño nodo" status="online" />
    <div className="pi-metrics">
      <Metric label="CPU" value="24" unit="%" progress={24} />
      <Metric label="Memoria" value="61" unit="%" progress={61} />
      <Metric label="Temperatura" value="47" unit="°C" progress={47} />
    </div>
    <div className="card-foot"><span className="soft-status"><CircleCheck size={14} /> Todo bien</span><button type="button">Ver detalle <ChevronRight size={14} /></button></div>
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
    <div className="link-buttons">{links.slice(0, 3).map((link) => <a className="link-button" href={link.url} target="_blank" rel="noreferrer" key={link.id}><BrandLogo url={link.url} explicitUrl={link.logoUrl} fallback={link.icon} className="link-button-logo" /><span>{link.label}</span><ExternalLink size={13} /></a>)}</div>
    <button className="card-action" type="button" onClick={onOpenLinks}>Editar accesos <ChevronRight size={15} /></button>
  </article>
}
