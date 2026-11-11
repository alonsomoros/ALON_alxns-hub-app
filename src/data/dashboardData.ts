import { BookOpen, Globe2, Heart, Link2, Sparkles } from 'lucide-react'
import type { HabitGoal, PiMetricValues, QuickLink, Quote, QuoteMode, Service } from '../types/dashboard'

// Datos de prototipo (Issue 014): sustituibles por adaptadores reales sin tocar las vistas.
/** Modo de la cita (REQ-003: editable en una fase futura). */
export const quoteMode: QuoteMode = 'random'

// Métricas de ejemplo: se muestran solo sin API de persistencia configurada (REQ-011).
export const prototypePiMetrics: PiMetricValues = { cpuBusyPercent: 24, ramUsedPercent: 61, storageUsedPercent: 48, temperatureCelsius: 47, uptimeSeconds: null, load1: null }

export const fallbackQuote: Quote = { content: 'La sencillez es la máxima sofisticación.', author: 'Leonardo da Vinci' }

export const services: Service[] = [
  { name: 'Hipoglifo.es', url: 'https://hipoglifo.es', state: 'online', icon: Globe2 },
  { name: 'El Negredo', url: 'https://el-negredo.vercel.app', state: 'online', icon: Sparkles },
  { name: 'Portfolio', url: 'https://alonsomoros.github.io', state: 'online', icon: Link2 },
]

export const defaultLinks: QuickLink[] = [
  { id: 'cubari', label: 'One Piece Cubari', url: 'https://cubari.moe', icon: BookOpen },
  { id: 'merinero', label: 'Autoescuela Merinero', url: 'https://autoescuelamerinero.com', icon: Globe2 },
  { id: 'manhwas', label: 'Manhwas', url: 'https://example.com', icon: Heart },
]

export const defaultGoals: HabitGoal[] = [
  { id: 'reading', title: 'Leer 30 páginas', description: 'Mantener una sesión de lectura diaria.', category: 'reading', current: 18, target: 30, unit: 'páginas', archived: false, history: [] },
  { id: 'movement', title: 'Mover el cuerpo', description: 'Completar sesiones de movimiento esta semana.', category: 'movement', current: 4, target: 5, unit: 'sesiones', archived: false, history: [] },
  { id: 'learning', title: 'Aprender algo nuevo', description: 'Reservar tiempo para aprender.', category: 'learning', current: 0, target: 1, unit: 'sesiones', archived: false, history: [] },
]
