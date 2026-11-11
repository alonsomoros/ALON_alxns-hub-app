import type { ContainerInfo, ContainerSummary, PiMetricValues, PiMetrics } from '../types/dashboard'
import { persistenceUrl } from './persistence'

const requestTimeoutMs = 1500
const metricKeys: (keyof PiMetricValues)[] = ['cpuBusyPercent', 'ramUsedPercent', 'storageUsedPercent', 'temperatureCelsius', 'uptimeSeconds', 'load1']
const healthValues = ['healthy', 'unhealthy', 'starting', 'none']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isNumberOrNull = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))

const parseContainers = (value: unknown): ContainerSummary | null | undefined => {
  if (value === null) return null
  if (!isRecord(value) || !Array.isArray(value.items)) return undefined
  const { running, total, unhealthy } = value
  if (![running, total, unhealthy].every((count) => typeof count === 'number' && Number.isFinite(count))) return undefined
  const items: ContainerInfo[] = []
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.state !== 'string' || typeof item.health !== 'string' || !healthValues.includes(item.health)) return undefined
    items.push({ name: item.name, state: item.state, health: item.health as ContainerInfo['health'] })
  }
  return { running: running as number, total: total as number, unhealthy: unhealthy as number, items }
}

/** Valida el contrato `schemaVersion: 1` de `GET /api/pi/metrics`; devuelve `null` si no es válido. */
export const parsePiMetrics = (raw: unknown): PiMetrics | null => {
  if (!isRecord(raw) || raw.schemaVersion !== 1 || typeof raw.deviceId !== 'string') return null
  if (typeof raw.observedAt !== 'string' || Number.isNaN(Date.parse(raw.observedAt))) return null
  if (!isRecord(raw.metrics) || !metricKeys.every((key) => isNumberOrNull((raw.metrics as Record<string, unknown>)[key]))) return null
  const containers = parseContainers(raw.containers)
  if (containers === undefined) return null
  const sources = raw.sources
  if (!isRecord(sources) || typeof sources.prometheus !== 'string' || typeof sources.docker !== 'string') return null
  return {
    schemaVersion: 1,
    deviceId: raw.deviceId,
    observedAt: raw.observedAt,
    metrics: raw.metrics as unknown as PiMetricValues,
    containers,
    sources: { prometheus: sources.prometheus as PiMetrics['sources']['prometheus'], docker: sources.docker as PiMetrics['sources']['docker'] },
  }
}

export const piMetricsEnabled = Boolean(persistenceUrl)

/** Consulta las métricas con timeout de 1.5 s; `null` si la API no responde o el contrato es inválido. */
export const fetchPiMetrics = async (): Promise<PiMetrics | null> => {
  if (!persistenceUrl) return null
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    const response = await fetch(`${persistenceUrl}/api/pi/metrics`, { signal: controller.signal })
    if (!response.ok) return null
    return parsePiMetrics(await response.json())
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
