import { ExternalLink, GripVertical, Trash2 } from 'lucide-react'
import type { QuickLink } from '../../types/dashboard'
import { BrandLogo } from '../ui/BrandLogo'

interface EditableLinkRowProps {
  link: QuickLink
  isDragging: boolean
  onMove: (direction: -1 | 1) => void
  onHandleClick: () => void
  onDragStart: () => void
  onDrop: () => void
  onDragEnd: () => void
  onDelete: () => void
}

export function EditableLinkRow({ link, isDragging, onMove, onHandleClick, onDragStart, onDrop, onDragEnd, onDelete }: EditableLinkRowProps) {
  return <div
    className={`editable-link ${isDragging ? 'is-dragging' : ''}`}
    draggable={true}
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === 'ArrowUp') { event.preventDefault(); onMove(-1) }
      if (event.key === 'ArrowDown') { event.preventDefault(); onMove(1) }
    }}
    onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', link.id); onDragStart() }}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => { event.preventDefault(); onDrop() }}
    onDragEnd={onDragEnd}
  >
    <button className="drag-handle" type="button" aria-label={`Mover ${link.label} arriba o abajo`} title="Mover enlace" onClick={onHandleClick}><GripVertical size={18} /></button>
    <BrandLogo url={link.url} explicitUrl={link.logoUrl} fallback={link.icon} className="editable-link-icon" />
    <span className="editable-link-text"><strong>{link.label}</strong><small>{link.url}</small></span>
    <a className="quiet-button" href={link.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${link.label}`}><ExternalLink size={16} /></a>
    <button className="delete-button" type="button" onClick={onDelete} aria-label={`Borrar ${link.label}`}><Trash2 size={16} /></button>
  </div>
}
