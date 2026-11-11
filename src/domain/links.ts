import { Link2 } from 'lucide-react'
import type { NewLinkDraft, QuickLink } from '../types/dashboard'

export const normalizeLinkUrl = (url: string) => url.startsWith('http') ? url : `https://${url}`

export const createLink = (draft: NewLinkDraft): QuickLink | null => {
  if (!draft.label.trim() || !draft.url.trim()) return null
  return { id: crypto.randomUUID(), label: draft.label.trim(), url: normalizeLinkUrl(draft.url), icon: Link2 }
}

/** Mueve `sourceId` a la posición de `targetId`; devuelve la misma referencia si no hay cambio. */
export const reorderLinks = (links: QuickLink[], sourceId: string, targetId: string): QuickLink[] => {
  if (sourceId === targetId) return links
  const sourceIndex = links.findIndex((link) => link.id === sourceId)
  const targetIndex = links.findIndex((link) => link.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return links
  const next = [...links]
  const [movedLink] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, movedLink)
  return next
}
