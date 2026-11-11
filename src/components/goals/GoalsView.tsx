import { Plus } from 'lucide-react'
import type { HabitGoal } from '../../types/dashboard'
import { BackButton } from '../ui/BackButton'
import { GoalCard } from './GoalCard'

export function GoalsView({ goals, onBack, onAdd, onEdit, onArchive }: { goals: HabitGoal[]; onBack: () => void; onAdd: () => void; onEdit: (goal: HabitGoal) => void; onArchive: (id: string) => void }) {
  return <section className="subview">
    <BackButton onClick={onBack} />
    <div className="subview-heading">
      <div><p className="date-label">Tu progreso</p><h1>Retos y hábitos</h1></div>
      <button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Nuevo reto</button>
    </div>
    <div className="goals-board">{goals.filter((goal) => !goal.archived).map((goal) => <GoalCard goal={goal} key={goal.id} onEdit={onEdit} onArchive={onArchive} />)}</div>
  </section>
}
