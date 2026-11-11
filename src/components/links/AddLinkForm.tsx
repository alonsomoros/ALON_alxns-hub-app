import { Check, X } from 'lucide-react'
import type { NewLinkDraft } from '../../types/dashboard'

export function AddLinkForm({ value, onChange, onClose, onConfirm }: { value: NewLinkDraft; onChange: (value: NewLinkDraft) => void; onClose: () => void; onConfirm: () => void }) {
  return <div className="add-link-form">
    <div className="form-heading"><strong>Nuevo enlace</strong><button className="quiet-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={17} /></button></div>
    <label>Nombre<input value={value.label} onChange={(event) => onChange({ ...value, label: event.target.value })} placeholder="Mi sitio" /></label>
    <label>Dirección<input value={value.url} onChange={(event) => onChange({ ...value, url: event.target.value })} placeholder="https://..." /></label>
    <button className="primary-button" type="button" onClick={onConfirm}><Check size={16} /> Guardar enlace</button>
  </div>
}
