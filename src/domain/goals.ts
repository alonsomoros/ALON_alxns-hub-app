import { BookOpen, Gauge, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { GoalCategory, HabitGoal } from '../types/dashboard'

export const goalCategoryConfig: Record<GoalCategory, { label: string; color: string; icon: LucideIcon }> = {
  reading: { label: 'Lectura', color: 'green', icon: BookOpen },
  movement: { label: 'Movimiento', color: 'yellow', icon: Gauge },
  learning: { label: 'Aprendizaje', color: 'blue', icon: Target },
}

export const goalProgress = (goal: HabitGoal) => goal.target > 0 ? Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100))) : 0

export const createEmptyGoal = (): HabitGoal => ({ id: crypto.randomUUID(), title: '', description: '', category: 'reading', current: 0, target: 1, unit: 'páginas', archived: false, history: [] })

export const isValidGoal = (goal: HabitGoal) => Boolean(goal.title.trim() && goal.description.trim() && goal.unit.trim()) && goal.target > 0 && goal.current >= 0

/** Inserta o actualiza un reto; al cambiar el progreso guarda un snapshot del valor anterior (FR-13). */
export const upsertGoal = (goals: HabitGoal[], goal: HabitGoal): HabitGoal[] => {
  if (!goals.some((item) => item.id === goal.id)) return [...goals, goal]
  return goals.map((item) => {
    if (item.id !== goal.id) return item
    const changedProgress = item.current !== goal.current || item.target !== goal.target
    const history = changedProgress ? [...item.history, { current: item.current, target: item.target, recordedAt: new Date().toISOString() }] : item.history
    return { ...goal, history }
  })
}

export const archiveGoalById = (goals: HabitGoal[], id: string) => goals.map((goal) => goal.id === id ? { ...goal, archived: true } : goal)
