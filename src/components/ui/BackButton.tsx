import { ChevronRight } from 'lucide-react'

// El chevron se rota por CSS (.back-button) para apuntar hacia atrás.
export function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="back-button" type="button" onClick={onClick}><ChevronRight size={16} /> Volver</button>
}
