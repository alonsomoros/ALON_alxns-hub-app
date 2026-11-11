import { Archive, Settings2 } from 'lucide-react'
import { goalCategoryConfig, goalProgress } from '../../domain/goals'
import type { HabitGoal } from '../../types/dashboard'
import { ProgressBar } from '../ui/ProgressBar'

export function GoalCard({ goal, onEdit, onArchive }: { goal: HabitGoal; onEdit: (goal: HabitGoal) => void; onArchive: (id: string) => void }) {
  const category = goalCategoryConfig[goal.category]
  const progress = goalProgress(goal)
  return <article className="goal-card">
    <div className={`goal-card-icon ${category.color}`}><category.icon size={20} /></div>
    <div className="goal-card-info">
      <h2>{goal.title}</h2>
      <p>{goal.description}</p>
      <span className="goal-range">{goal.current} / {goal.target} {goal.unit}</span>
      <ProgressBar label={`${progress}%`} progress={progress} color={category.color} />
    </div>
    <button className="quiet-button" type="button" onClick={() => onEdit(goal)} aria-label={`Editar ${goal.title}`}><Settings2 size={16} /></button>
    <button className="quiet-button" type="button" onClick={() => onArchive(goal.id)} aria-label={`Archivar ${goal.title}`}><Archive size={16} /></button>
  </article>
}
