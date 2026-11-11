import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { getPiMetrics } from './metrics.js'
import { getSiteHealth } from './health.js'
import { getQuote } from './quote.js'

const host = process.env.HOST ?? '0.0.0.0'
const port = Number(process.env.PORT ?? 8787)
const databasePath = resolve(process.env.DB_PATH ?? './data/alon-hub.sqlite')
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean))

mkdirSync(dirname(databasePath), { recursive: true })
const database = new DatabaseSync(databasePath)
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('reading', 'movement', 'learning')),
    current REAL NOT NULL CHECK (current >= 0),
    target REAL NOT NULL CHECK (target > 0),
    unit TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS goal_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    current REAL NOT NULL CHECK (current >= 0),
    target REAL NOT NULL CHECK (target > 0),
    recorded_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    position INTEGER NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
    updated_at TEXT NOT NULL
  );
`)

class ConflictError extends Error {}

const sendJson = (request, response, status, payload) => {
  const origin = request.headers.origin
  if (origin && allowedOrigins.has(origin)) response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Vary', 'Origin')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.writeHead(status)
  response.end(JSON.stringify(payload))
}

const readBody = async (request) => {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 128 * 1024) throw new Error('Payload too large')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const requireString = (value, field, maxLength = 500) => {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) throw new Error(`Invalid ${field}`)
  return value.trim()
}
const requireNumber = (value, field, minimum, exclusive = false) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || (exclusive ? value <= minimum : value < minimum)) throw new Error(`Invalid ${field}`)
  return value
}
const requireSnapshot = (value) => ({
  current: requireNumber(value.current, 'history.current', 0),
  target: requireNumber(value.target, 'history.target', 0, true),
  recordedAt: requireString(value.recordedAt, 'history.recordedAt', 40),
})
const requireGoal = (value) => {
  const goal = {
    id: requireString(value.id, 'id', 100),
    title: requireString(value.title, 'title', 120),
    description: requireString(value.description, 'description', 1000),
    category: requireString(value.category, 'category', 20),
    current: requireNumber(value.current, 'current', 0),
    target: requireNumber(value.target, 'target', 0, true),
    unit: requireString(value.unit, 'unit', 40),
    archived: Boolean(value.archived),
    history: Array.isArray(value.history) ? value.history.map(requireSnapshot) : [],
  }
  if (!['reading', 'movement', 'learning'].includes(goal.category)) throw new Error('Invalid category')
  return goal
}
const requireLink = (value, position) => ({
  id: requireString(value.id, 'id', 100),
  label: requireString(value.label, 'label', 120),
  url: requireString(value.url, 'url', 2048),
  logoUrl: value.logoUrl == null ? null : requireString(value.logoUrl, 'logoUrl', 2048),
  position,
  archived: Boolean(value.archived),
})

const toGoal = (row) => ({
  id: row.id, title: row.title, description: row.description, category: row.category,
  current: row.current, target: row.target, unit: row.unit, archived: Boolean(row.archived),
  history: database.prepare('SELECT current, target, recorded_at AS recordedAt FROM goal_history WHERE goal_id = ? ORDER BY id').all(row.id),
})
const getState = () => {
  const preferenceRow = database.prepare('SELECT payload, version, updated_at AS updatedAt FROM preferences WHERE id = 1').get()
  return {
    version: preferenceRow?.version ?? 0,
    // `updatedAt` es el instante del cambio que fijó el cliente (decide qué copia gana al sincronizar); `savedAt` es la hora de guardado del servidor.
    preferences: preferenceRow ? { savedAt: preferenceRow.updatedAt, ...JSON.parse(preferenceRow.payload) } : null,
  goals: database.prepare('SELECT * FROM goals ORDER BY updated_at DESC').all().map(toGoal),
  links: database.prepare('SELECT id, label, url, logo_url AS logoUrl, position, archived, updated_at AS updatedAt FROM links WHERE archived = 0 ORDER BY position').all().map((link) => ({ ...link, archived: Boolean(link.archived) })),
  }
}

const saveState = (payload) => {
  if (!payload || !Number.isInteger(payload.version) || payload.version < 0 || !Array.isArray(payload.goals) || !Array.isArray(payload.links)) throw new Error('Invalid state')
  const goals = payload.goals.map(requireGoal)
  const links = payload.links.slice(0, 10).map((link, index) => requireLink(link, index))
  const now = new Date().toISOString()
  database.exec('BEGIN IMMEDIATE')
  try {
    const currentVersion = database.prepare('SELECT version FROM preferences WHERE id = 1').get()?.version ?? 0
    if (payload.version !== currentVersion) throw new ConflictError('State version conflict')
    const existingGoals = database.prepare('SELECT id, current, target FROM goals').all()
    const existingById = new Map(existingGoals.map((goal) => [goal.id, goal]))
    database.exec('DELETE FROM goals')
    database.exec('DELETE FROM links')
    const insertGoal = database.prepare('INSERT INTO goals (id, title, description, category, current, target, unit, archived, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const insertHistory = database.prepare('INSERT INTO goal_history (goal_id, current, target, recorded_at) VALUES (?, ?, ?, ?)')
    for (const goal of goals) {
      insertGoal.run(goal.id, goal.title, goal.description, goal.category, goal.current, goal.target, goal.unit, goal.archived ? 1 : 0, now)
      const previous = existingById.get(goal.id)
      const hasPreviousSnapshot = previous && goal.history.some((snapshot) => snapshot.current === previous.current && snapshot.target === previous.target)
      if (previous && (previous.current !== goal.current || previous.target !== goal.target) && !hasPreviousSnapshot) insertHistory.run(goal.id, previous.current, previous.target, now)
      for (const snapshot of goal.history) insertHistory.run(goal.id, snapshot.current, snapshot.target, snapshot.recordedAt)
    }
    const insertLink = database.prepare('INSERT INTO links (id, label, url, logo_url, position, archived, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    for (const link of links) insertLink.run(link.id, link.label, link.url, link.logoUrl, link.position, link.archived ? 1 : 0, now)
    if (payload.preferences != null) {
      const preferences = JSON.stringify(payload.preferences)
      database.prepare('INSERT INTO preferences (id, payload, version, updated_at) VALUES (1, ?, 1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, version = preferences.version + 1, updated_at = excluded.updated_at').run(preferences, now)
    }
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      const origin = request.headers.origin
      if (origin && allowedOrigins.has(origin)) response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      response.writeHead(204)
      response.end()
      return
    }
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    if (request.method === 'GET' && url.pathname === '/health') return sendJson(request, response, 200, { status: 'ok', database: databasePath })
    if (request.method === 'GET' && url.pathname === '/api/state') return sendJson(request, response, 200, getState())
    if (request.method === 'GET' && url.pathname === '/api/pi/metrics') return sendJson(request, response, 200, await getPiMetrics())
    if (request.method === 'GET' && url.pathname === '/api/sites/health') return sendJson(request, response, 200, await getSiteHealth())
    if (request.method === 'GET' && url.pathname === '/api/quote') {
      const quote = await getQuote()
      return quote ? sendJson(request, response, 200, quote) : sendJson(request, response, 503, { error: 'Quote unavailable' })
    }
    if (request.method === 'PUT' && url.pathname === '/api/state') {
      saveState(await readBody(request))
      return sendJson(request, response, 200, getState())
    }
    sendJson(request, response, 404, { error: 'Not found' })
  } catch (error) {
    const message = error instanceof SyntaxError ? 'Invalid JSON' : error instanceof Error ? error.message : 'Unexpected error'
    const status = error instanceof ConflictError ? 409 : message === 'Payload too large' ? 413 : 400
    sendJson(request, response, status, { error: message })
  }
})

server.listen(port, host, () => {
  console.log(`alXns persistence API listening on ${host}:${port}`)
  void getQuote() // Precalienta la cita del día: el origen tarda ~1 s y la PWA espera 1.5 s.
  void getSiteHealth() // Precalienta las comprobaciones de sitios: pueden tardar hasta 4 s.
})

const shutdown = () => { database.close(); server.close(() => process.exit(0)) }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
