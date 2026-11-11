import type { StatsView, UiPreferences } from '../../types/dashboard'
import { BackButton } from '../ui/BackButton'
import { ThemePicker } from './ThemePicker'

const statsViewOptions: { value: StatsView; label: string }[] = [
  { value: 'bars', label: 'Barras' },
  { value: 'rings', label: 'Anillos' },
  { value: 'gauges', label: 'Medidores' },
]

export function SettingsView({ preferences, onChange, onReset, onBack }: { preferences: UiPreferences; onChange: (next: UiPreferences) => void; onReset: () => void; onBack: () => void }) {
  return <section className="subview settings-view">
    <BackButton onClick={onBack} />
    <div className="subview-heading">
      <div><p className="date-label">Personaliza tu panel</p><h1>Ajustes</h1></div>
      <button className="quiet-text-button" type="button" onClick={onReset}>Restablecer</button>
    </div>
    <article className="card settings-card">
      <h2>Apariencia</h2>
      <div className="settings-field">
        <span id="theme-label">Tema</span>
        <ThemePicker value={preferences.theme} onChange={(theme) => onChange({ ...preferences, theme })} />
      </div>
      <label className="settings-field">
        <span>Vista de estadísticas</span>
        <select value={preferences.statsView} onChange={(event) => onChange({ ...preferences, statsView: event.target.value as StatsView })}>
          {statsViewOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </label>
    </article>
  </section>
}
