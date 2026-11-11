/**
 * Métricas de la Raspberry para la PWA (REQ-011).
 * Agrega Prometheus (host) y docker-socket-proxy (contenedores) en un contrato versionado.
 * Cada fuente falla por separado: una caída parcial no oculta la otra.
 */
const trimUrl = (value) => value?.trim().replace(/\/$/, '') || null

const prometheusUrl = trimUrl(process.env.PROMETHEUS_URL) ?? 'http://host.docker.internal:9090'
const dockerProxyUrl = trimUrl(process.env.DOCKER_PROXY_URL)
const prometheusJob = process.env.PROMETHEUS_JOB ?? 'raspberrypi_host'
const deviceId = process.env.DEVICE_ID ?? 'raspberry-pi-5'
const upstreamTimeoutMs = 1000
const cacheTtlMs = 15_000
const maxContainerItems = 50

const jobFilter = `job="${prometheusJob}"`
const queries = {
  cpuBusyPercent: `100-(avg(rate(node_cpu_seconds_total{${jobFilter},mode="idle"}[2m]))*100)`,
  ramUsedPercent: `(1-node_memory_MemAvailable_bytes{${jobFilter}}/node_memory_MemTotal_bytes{${jobFilter}})*100`,
  storageUsedPercent: `(1-node_filesystem_avail_bytes{${jobFilter},mountpoint="/"}/node_filesystem_size_bytes{${jobFilter},mountpoint="/"})*100`,
  temperatureCelsius: `max(node_thermal_zone_temp{${jobFilter},type="cpu-thermal"})`,
  uptimeSeconds: `time()-node_boot_time_seconds{${jobFilter}}`,
  load1: `node_load1{${jobFilter}}`,
}

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const round = (value, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits
const percent = (value) => isFiniteNumber(value) ? round(Math.min(100, Math.max(0, value))) : null
const bounded = (value, min, max) => isFiniteNumber(value) && value >= min && value <= max ? round(value) : null

const normalizers = {
  cpuBusyPercent: percent,
  ramUsedPercent: percent,
  storageUsedPercent: percent,
  temperatureCelsius: (value) => bounded(value, -40, 150),
  uptimeSeconds: (value) => isFiniteNumber(value) && value >= 0 ? Math.round(value) : null,
  load1: (value) => bounded(value, 0, 1000),
}

const fetchJson = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(upstreamTimeoutMs) })
  if (!response.ok) throw new Error(`Upstream responded ${response.status}`)
  return response.json()
}

const queryScalar = async (query) => {
  const body = await fetchJson(`${prometheusUrl}/api/v1/query?${new URLSearchParams({ query })}`)
  if (body?.status !== 'success') throw new Error('Prometheus query failed')
  const sample = body.data?.result?.[0]?.value?.[1]
  return sample === undefined ? null : Number(sample)
}

const readHostMetrics = async () => {
  const names = Object.keys(queries)
  const settled = await Promise.allSettled(names.map((name) => queryScalar(queries[name])))
  const metrics = {}
  names.forEach((name, index) => {
    metrics[name] = settled[index].status === 'fulfilled' ? normalizers[name](settled[index].value) : null
  })
  const reachable = settled.some((result) => result.status === 'fulfilled')
  return { metrics, source: reachable ? 'ok' : 'unreachable' }
}

const healthOf = (status = '') => {
  if (/\(unhealthy\)/.test(status)) return 'unhealthy'
  if (/\(healthy\)/.test(status)) return 'healthy'
  if (/\(health: starting\)/.test(status)) return 'starting'
  return 'none'
}

const readContainers = async () => {
  if (!dockerProxyUrl) return { containers: null, source: 'disabled' }
  try {
    const list = await fetchJson(`${dockerProxyUrl}/containers/json?all=true`)
    if (!Array.isArray(list)) throw new Error('Unexpected Docker response')
    const items = list.map((container) => ({
      name: String(container.Names?.[0] ?? container.Id ?? 'unknown').replace(/^\//, ''),
      state: String(container.State ?? 'unknown'),
      health: healthOf(container.Status),
    })).sort((a, b) => Number(a.state === 'running') - Number(b.state === 'running') || a.name.localeCompare(b.name))
    return {
      containers: {
        running: items.filter((item) => item.state === 'running').length,
        total: items.length,
        unhealthy: items.filter((item) => item.health === 'unhealthy').length,
        items: items.slice(0, maxContainerItems),
      },
      source: 'ok',
    }
  } catch {
    return { containers: null, source: 'unreachable' }
  }
}

const collect = async () => {
  const [host, docker] = await Promise.all([readHostMetrics(), readContainers()])
  return {
    schemaVersion: 1,
    deviceId,
    observedAt: new Date().toISOString(),
    metrics: host.metrics,
    containers: docker.containers,
    sources: { prometheus: host.source, docker: docker.source },
  }
}

let cached = null
let cachedAt = 0
let inflight = null

/** Devuelve el último snapshot si tiene menos de 15 s; las lecturas concurrentes comparten una sola consulta. */
export const getPiMetrics = async () => {
  if (cached && Date.now() - cachedAt < cacheTtlMs) return cached
  inflight ??= collect().then((snapshot) => {
    cached = snapshot
    cachedAt = Date.now()
    return snapshot
  }).finally(() => { inflight = null })
  return inflight
}
