import type { LucideIcon } from 'lucide-react'
import type { ThemeId } from '../themes'

export interface Quote { content: string; author: string }
export interface Service { name: string; url: string; state: 'online' | 'offline'; icon: LucideIcon; logoUrl?: string }
export interface QuickLink { id: string; label: string; url: string; icon: LucideIcon; logoUrl?: string }
export interface NewLinkDraft { label: string; url: string }
export type GoalCategory = 'reading' | 'movement' | 'learning'
export interface GoalSnapshot { current: number; target: number; recordedAt: string }
export interface HabitGoal { id: string; title: string; description: string; category: GoalCategory; current: number; target: number; unit: string; archived: boolean; history: GoalSnapshot[] }
export type QuoteMode = 'default' | 'random' | 'fav'
export type StatsView = 'bars' | 'rings' | 'gauges'
export type HomeCardId = 'pi' | 'goals' | 'services' | 'links'
export interface HomeCardPref { id: HomeCardId; visible: boolean }
export type PiRefreshSeconds = 30 | 60 | 120
/** Preferencias de interfaz (REQ-003): se guardan en local y se sincronizan con la API de persistencia. */
/** `updatedAt`: instante ISO del último cambio hecho por el usuario (`''` si se desconoce); decide qué copia gana al sincronizar. */
export interface UiPreferences { schemaVersion: 1; theme: ThemeId; statsView: StatsView; piRefreshSeconds: PiRefreshSeconds; homeCards: HomeCardPref[]; updatedAt: string }
export type DashboardView = 'home' | 'goals' | 'links' | 'settings'
export type PersistenceStatus = 'loading' | 'online' | 'offline' | 'local'

export type PiMetricsStatus = 'loading' | 'online' | 'degraded' | 'stale' | 'offline' | 'prototype'
export interface PiMetricValues { cpuBusyPercent: number | null; ramUsedPercent: number | null; storageUsedPercent: number | null; temperatureCelsius: number | null; uptimeSeconds: number | null; load1: number | null }
export interface ContainerInfo { name: string; state: string; health: 'healthy' | 'unhealthy' | 'starting' | 'none' }
export interface ContainerSummary { running: number; total: number; unhealthy: number; items: ContainerInfo[] }
export interface PiMetrics { schemaVersion: 1; deviceId: string; observedAt: string; metrics: PiMetricValues; containers: ContainerSummary | null; sources: { prometheus: 'ok' | 'unreachable'; docker: 'ok' | 'unreachable' | 'disabled' } }
