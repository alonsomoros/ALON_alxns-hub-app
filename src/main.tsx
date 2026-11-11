import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { readStoredPreferences } from './infrastructure/preferencesStore'
import { applyTheme } from './themes'

registerSW({ immediate: true })

// Aplica el tema guardado antes de pintar para evitar el parpadeo del tema por defecto.
applyTheme(readStoredPreferences().theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
