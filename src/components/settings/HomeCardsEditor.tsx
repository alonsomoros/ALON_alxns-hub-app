import { ChevronDown, ChevronUp } from 'lucide-react'
import { moveCard, setCardVisible } from '../../domain/preferences'
import type { HomeCardId, HomeCardPref } from '../../types/dashboard'

const cardNames: Record<HomeCardId, string> = { pi: 'Raspberry Pi', goals: 'Tus retos', services: 'Tus sitios', links: 'Accesos' }

/** Orden y visibilidad de las tarjetas de Inicio: interruptor por tarjeta y botones subir/bajar (sin arrastrar). */
export function HomeCardsEditor({ cards, onChange }: { cards: HomeCardPref[]; onChange: (cards: HomeCardPref[]) => void }) {
  const visibleCount = cards.filter((card) => card.visible).length
  return <ul className="home-cards-editor" aria-label="Tarjetas de Inicio">
    {cards.map((card, index) => {
      const name = cardNames[card.id]
      return <li key={card.id}>
        <button type="button" role="switch" aria-checked={card.visible} aria-label={`Mostrar ${name}`} disabled={card.visible && visibleCount === 1} className="switch" onClick={() => onChange(setCardVisible(cards, card.id, !card.visible))}><i /></button>
        <span className={card.visible ? '' : 'muted'}>{name}</span>
        <button type="button" className="icon-step" aria-label={`Subir ${name}`} disabled={index === 0} onClick={() => onChange(moveCard(cards, card.id, -1))}><ChevronUp size={15} /></button>
        <button type="button" className="icon-step" aria-label={`Bajar ${name}`} disabled={index === cards.length - 1} onClick={() => onChange(moveCard(cards, card.id, 1))}><ChevronDown size={15} /></button>
      </li>
    })}
  </ul>
}
