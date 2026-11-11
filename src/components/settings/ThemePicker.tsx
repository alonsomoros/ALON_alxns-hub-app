import { useRef } from 'react'
import { stepTheme, themeIds, themes, type ThemeId } from '../../themes'

/** Selector de tema: un cuadrado por tema, con un triángulo de cada color principal (`swatch`: acento y acento secundario; negro y blanco en el oscuro). */
export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  const group = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: React.KeyboardEvent) => {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const next = stepTheme(value, direction)
    onChange(next)
    group.current?.querySelector<HTMLButtonElement>(`[data-theme-id="${next}"]`)?.focus()
  }

  return <div className="theme-picker" role="radiogroup" aria-label="Tema" ref={group} onKeyDown={onKeyDown}>
    {themeIds.map((id) => {
      const { label, swatch } = themes[id]
      const selected = id === value
      return <button type="button" role="radio" aria-checked={selected} aria-label={label} title={label} tabIndex={selected ? 0 : -1} data-theme-id={id} className={`theme-swatch${selected ? ' selected' : ''}`} onClick={() => onChange(id)} key={id}>
        <span style={{ background: `linear-gradient(135deg, ${swatch[0]} 50%, ${swatch[1]} 50%)` }} />
        <small>{label}</small>
      </button>
    })}
  </div>
}
