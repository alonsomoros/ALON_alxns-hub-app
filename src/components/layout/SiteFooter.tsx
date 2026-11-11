import type { PersistenceStatus } from '../../types/dashboard'

const statusLabel: Record<PersistenceStatus, string> = { online: 'Sincronizado', loading: 'Conectando', local: 'Solo local', offline: 'OFFLINE' }

export function SiteFooter({ persistenceStatus }: { persistenceStatus: PersistenceStatus }) {
  return <footer className="site-footer">
    <span>alXns · tu espacio personal</span>
    <span className="soft-status" aria-live="polite">{statusLabel[persistenceStatus]}</span>
    <span>hecho para ir a tu ritmo</span>
  </footer>
}
