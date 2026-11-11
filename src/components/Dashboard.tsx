import { useState } from 'react'
import { archiveGoalById, upsertGoal } from '../domain/goals'
import { createLink, reorderLinks } from '../domain/links'
import { usePersistedDashboard } from '../hooks/usePersistedDashboard'
import { usePreferences } from '../hooks/usePreferences'
import { usePiMetrics } from '../hooks/usePiMetrics'
import { useQuote } from '../hooks/useQuote'
import type { DashboardView, HabitGoal, NewLinkDraft } from '../types/dashboard'
import { GoalForm } from './goals/GoalForm'
import { GoalsView } from './goals/GoalsView'
import { HomeView } from './home/HomeView'
import { SettingsView } from './settings/SettingsView'
import { SiteFooter } from './layout/SiteFooter'
import { SiteHeader } from './layout/SiteHeader'
import { LinksView } from './links/LinksView'

const emptyLinkDraft: NewLinkDraft = { label: '', url: '' }

export function Dashboard() {
  const [activeView, setActiveView] = useState<DashboardView>('home')
  const quote = useQuote()
  const { preferences, setPreferences, resetPreferences } = usePreferences()
  const { snapshot: pi, status: piStatus, ageMinutes: piAgeMinutes } = usePiMetrics(activeView === 'home')
  const { links, setLinks, goals, setGoals, status } = usePersistedDashboard()
  const [editingGoal, setEditingGoal] = useState<HabitGoal | null>(null)
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false)
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
  const [newLink, setNewLink] = useState<NewLinkDraft>(emptyLinkDraft)

  const addLink = () => {
    const link = createLink(newLink)
    if (!link) return
    setLinks((current) => [...current, link])
    setNewLink(emptyLinkDraft); setIsAddLinkOpen(false)
  }
  const closeGoalForm = () => { setEditingGoal(null); setIsGoalFormOpen(false) }
  const saveGoal = (goal: HabitGoal) => { setGoals((current) => upsertGoal(current, goal)); closeGoalForm() }
  const openGoalForm = (goal: HabitGoal | null) => { setEditingGoal(goal); setIsGoalFormOpen(true) }
  const goHome = () => setActiveView('home')

  return <main className="app-shell">
    <SiteHeader activeView={activeView} onNavigate={setActiveView} onOpenSettings={() => setActiveView('settings')} />
    {activeView === 'home' && <HomeView quote={quote} links={links} goals={goals} piState={{ pi, status: piStatus, ageMinutes: piAgeMinutes }} statsView={preferences.statsView} onOpenGoals={() => setActiveView('goals')} onOpenLinks={() => setActiveView('links')} />}
    {activeView === 'goals' && <GoalsView goals={goals} onBack={goHome} onAdd={() => openGoalForm(null)} onEdit={openGoalForm} onArchive={(id) => setGoals((current) => archiveGoalById(current, id))} />}
    {activeView === 'links' && <LinksView links={links} isAddLinkOpen={isAddLinkOpen} newLink={newLink} onBack={goHome} onAdd={() => setIsAddLinkOpen(true)} onDelete={(id) => setLinks((current) => current.filter((link) => link.id !== id))} onReorder={(sourceId, targetId) => setLinks((current) => reorderLinks(current, sourceId, targetId))} onCloseAdd={() => setIsAddLinkOpen(false)} onNewLinkChange={setNewLink} onConfirmAdd={addLink} />}
    {activeView === 'settings' && <SettingsView preferences={preferences} onChange={setPreferences} onReset={resetPreferences} onBack={goHome} />}
    <SiteFooter persistenceStatus={status} />
    {isGoalFormOpen && <GoalForm goal={editingGoal} onClose={closeGoalForm} onSave={saveGoal} />}
  </main>
}
