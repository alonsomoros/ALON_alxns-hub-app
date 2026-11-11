import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { createEmptyGoal, goalCategoryConfig, goalProgress, isValidGoal } from '../../domain/goals'
import type { GoalCategory, HabitGoal } from '../../types/dashboard'

export function GoalForm({ goal, onClose, onSave }: { goal: HabitGoal | null; onClose: () => void; onSave: (goal: HabitGoal) => void }) {
  const [draft, setDraft] = useState<HabitGoal>(() => goal ?? createEmptyGoal())
  const category = goalCategoryConfig[draft.category]
  const update = <K extends keyof HabitGoal>(key: K, value: HabitGoal[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = () => {
    if (!isValidGoal(draft)) return
    onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim(), unit: draft.unit.trim() })
  }

  return <div className="goal-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
    <section className="goal-modal" role="dialog" aria-modal="true" aria-labelledby="goal-form-title">
      <div className="form-heading"><strong id="goal-form-title">{goal ? 'Editar reto' : 'Nuevo reto'}</strong><button className="quiet-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={17} /></button></div>
      <label>Título<input value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="Leer 30 páginas" /></label>
      <label>Descripción<textarea value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe el objetivo" /></label>
      <label>Categoría<select value={draft.category} onChange={(event) => update('category', event.target.value as GoalCategory)}>{Object.entries(goalCategoryConfig).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select></label>
      <div className="goal-form-fields">
        <label>Actual<input type="number" min="0" value={draft.current} onChange={(event) => update('current', Number(event.target.value))} /></label>
        <label>Objetivo<input type="number" min="1" value={draft.target} onChange={(event) => update('target', Number(event.target.value))} /></label>
        <label>Unidad<input value={draft.unit} onChange={(event) => update('unit', event.target.value)} placeholder="páginas" /></label>
      </div>
      <span className={`goal-form-preview ${category.color}`}>Progreso: {goalProgress(draft)}%</span>
      <button className="primary-button" type="button" onClick={submit}><Check size={16} /> Guardar reto</button>
    </section>
  </div>
}
