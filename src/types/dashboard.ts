import type { LucideIcon } from 'lucide-react'

export interface Quote { content: string; author: string }
export interface Service { name: string; url: string; state: 'online' | 'offline'; icon: LucideIcon; logoUrl?: string }
export interface QuickLink { id: string; label: string; url: string; icon: LucideIcon; logoUrl?: string }
export interface NewLinkDraft { label: string; url: string }
export type GoalCategory = 'reading' | 'movement' | 'learning'
export interface GoalSnapshot { current: number; target: number; recordedAt: string }
export interface HabitGoal { id: string; title: string; description: string; category: GoalCategory; current: number; target: number; unit: string; archived: boolean; history: GoalSnapshot[] }
export interface DashboardConfig { theme: 'soft'; mode: 'light'; quote: 'default' | 'random' | 'fav'; orderServices: string[]; raspberryPiStatsShowcase: 'graph' | 'pbar' }
export type DashboardView = 'home' | 'goals' | 'links'
export type PersistenceStatus = 'loading' | 'online' | 'offline' | 'local'
