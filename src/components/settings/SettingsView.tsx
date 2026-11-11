import { greetingFor, maxDisplayNameLength, refreshOptions } from '../../domain/preferences'
import type { PiRefreshSeconds, StatsView, UiPreferences } from '../../types/dashboard'
import { BackButton } from '../ui/BackButton'
import { HomeCardsEditor } from './HomeCardsEditor'
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
    <article className="card settings-card">
      <h2>Personal</h2>
      <label className="settings-field">
        <span>Tu nombre en el saludo</span>
        <input type="text" value={preferences.displayName} maxLength={maxDisplayNameLength} autoComplete="off" onChange={(event) => onChange({ ...preferences, displayName: event.target.value })} />
        <small className="settings-hint">Vista previa: {greetingFor(preferences.displayName)}</small>
      </label>
    </article>
    <article className="card settings-card">
      <h2>Datos</h2>
      <label className="settings-field">
        <span>Actualizar métricas de la Raspberry cada</span>
        <select value={preferences.piRefreshSeconds} onChange={(event) => onChange({ ...preferences, piRefreshSeconds: Number(event.target.value) as PiRefreshSeconds })}>
          {refreshOptions.map((seconds) => <option value={seconds} key={seconds}>{seconds} s</option>)}
        </select>
      </label>
    </article>
    <article className="card settings-card">
      <h2>Inicio</h2>
      <HomeCardsEditor cards={preferences.homeCards} onChange={(homeCards) => onChange({ ...preferences, homeCards })} />
    </article>
  </section>
}
