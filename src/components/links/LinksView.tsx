import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { NewLinkDraft, QuickLink } from '../../types/dashboard'
import { BackButton } from '../ui/BackButton'
import { AddLinkForm } from './AddLinkForm'
import { EditableLinkRow } from './EditableLinkRow'

interface LinksViewProps {
  links: QuickLink[]
  isAddLinkOpen: boolean
  newLink: NewLinkDraft
  onBack: () => void
  onAdd: () => void
  onDelete: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  onCloseAdd: () => void
  onNewLinkChange: (value: NewLinkDraft) => void
  onConfirmAdd: () => void
}

export function LinksView({ links, isAddLinkOpen, newLink, onBack, onAdd, onDelete, onReorder, onCloseAdd, onNewLinkChange, onConfirmAdd }: LinksViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const moveLink = (sourceId: string, direction: -1 | 1) => {
    const sourceIndex = links.findIndex((link) => link.id === sourceId)
    const targetIndex = sourceIndex + direction
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= links.length) return
    onReorder(sourceId, links[targetIndex].id)
  }

  return <section className="subview">
    <BackButton onClick={onBack} />
    <div className="subview-heading">
      <div><p className="date-label">Tu colección</p><h1>Enlaces</h1></div>
      <button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Añadir enlace</button>
    </div>
    {links.length === 0 && !isAddLinkOpen && <div className="empty-state empty-state-large"><p>Todavía no hay enlaces.</p><button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Añadir tu primer enlace</button></div>}
    <div className="editable-links">
      {links.map((link, index) => <EditableLinkRow
        link={link}
        key={link.id}
        isDragging={draggedId === link.id}
        onMove={(direction) => moveLink(link.id, direction)}
        onHandleClick={() => moveLink(link.id, index > 0 ? -1 : 1)}
        onDragStart={() => setDraggedId(link.id)}
        onDrop={() => { if (draggedId) onReorder(draggedId, link.id); setDraggedId(null) }}
        onDragEnd={() => setDraggedId(null)}
        onDelete={() => onDelete(link.id)}
      />)}
    </div>
    {isAddLinkOpen && <AddLinkForm value={newLink} onChange={onNewLinkChange} onClose={onCloseAdd} onConfirm={onConfirmAdd} />}
  </section>
}
