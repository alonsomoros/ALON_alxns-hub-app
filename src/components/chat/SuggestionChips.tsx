import type { Suggestion } from '../../domain/chat'

export function SuggestionChips({ suggestions, disabled, onPick }: { suggestions: Suggestion[]; disabled: boolean; onPick: (question: string) => void }) {
  if (suggestions.length === 0) return null
  return <div className="suggestion-chips" role="group" aria-label="Preguntas frecuentes">
    {suggestions.map((suggestion) => <button type="button" disabled={disabled} onClick={() => onPick(suggestion.question)} key={suggestion.id}>{suggestion.label}</button>)}
  </div>
}
