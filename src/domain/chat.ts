/**
 * Dominio del chat de consultas (REQ-024). Contrato de la API de `selfbank`: `docs/api-contrato.md` y `selfbank/api/schemas.json`
 * de ese repositorio. Todo es puro: sin DOM ni `import.meta.env`. Los validadores nunca lanzan: devuelven `null` ante cualquier incumplimiento.
 */
export type AnswerStatus = 'answered' | 'needs_clarification' | 'unsupported'
export type ColumnType = 'text' | 'date' | 'money' | 'count'
export interface TableColumn { key: string; label: string; type: ColumnType }
export type CellValue = string | number | null
export type AnswerData =
  | { kind: 'scalar'; value: number; unit: 'EUR' | 'count' }
  | { kind: 'table'; columns: TableColumn[]; rows: CellValue[][] }
  | { kind: 'none' }
export interface ChatAnswer {
  id: string
  question: string
  status: AnswerStatus
  reason: 'ambigua' | 'fuera_de_alcance' | 'operacion' | null
  source: 'rules' | 'model'
  interpretation: { title: string; chips: string[]; text: string }
  text: string
  data: AnswerData
  timingMs: number
  mock: boolean
}
export interface ChatStatus {
  mode: 'mock' | 'live'
  modelName: string
  modelLoaded: boolean
  lastSync: string | null
  dataThrough: string | null
  accounts: number
  consentValidUntil: string | null
  consentDaysLeft: number | null
}
export interface Suggestion { id: string; label: string; question: string }
export type ChatErrorCode = 'unauthorized' | 'model_busy' | 'timeout' | 'network' | 'invalid_response' | 'invalid_request' | 'not_found' | 'internal'
export interface ChatError { code: ChatErrorCode; retryAfterSeconds?: number }
export type Result<T> = { ok: true; value: T } | { ok: false; error: ChatError }

export const maxQuestionLength = 500
const defaultRetrySeconds = 10

type Raw = Record<string, unknown>
const isRecord = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0
const textOrNull = (value: unknown): string | null | undefined => value === null ? null : typeof value === 'string' ? value : undefined
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T => typeof value === 'string' && (allowed as readonly string[]).includes(value)

const statuses = ['answered', 'needs_clarification', 'unsupported'] as const
const reasons = ['ambigua', 'fuera_de_alcance', 'operacion'] as const
const sources = ['rules', 'model'] as const
const columnTypes = ['text', 'date', 'money', 'count'] as const
const units = ['EUR', 'count'] as const
const answerIdPattern = /^ans_[0-9a-f]{12}$/

const parseColumns = (raw: unknown): TableColumn[] | null => {
  if (!Array.isArray(raw)) return null
  const columns: TableColumn[] = []
  for (const item of raw) {
    if (!isRecord(item) || !isText(item.key) || !isText(item.label) || !oneOf(item.type, columnTypes)) return null
    columns.push({ key: item.key, label: item.label, type: item.type })
  }
  return columns
}

const parseRows = (raw: unknown, width: number): CellValue[][] | null => {
  if (!Array.isArray(raw)) return null
  const rows: CellValue[][] = []
  for (const row of raw) {
    if (!Array.isArray(row) || row.length !== width) return null
    const cells: CellValue[] = []
    for (const cell of row) {
      if (cell !== null && typeof cell !== 'string' && !isFiniteNumber(cell)) return null
      cells.push(cell)
    }
    rows.push(cells)
  }
  return rows
}

const parseAnswerData = (kind: unknown, data: unknown): AnswerData | null => {
  if (kind === 'none') return { kind: 'none' }
  if (kind === 'scalar') {
    if (!isRecord(data) || !isFiniteNumber(data.value) || !oneOf(data.unit, units)) return null
    return { kind: 'scalar', value: data.value, unit: data.unit }
  }
  if (kind === 'table') {
    if (!isRecord(data)) return null
    const columns = parseColumns(data.columns)
    if (!columns) return null
    const rows = parseRows(data.rows, columns.length)
    return rows ? { kind: 'table', columns, rows } : null
  }
  return null
}

/** `POST /api/ask`. Una respuesta que no sea `answered` jamás puede llevar cifras ni tabla. */
export const parseAskResponse = (raw: unknown): ChatAnswer | null => {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !answerIdPattern.test(raw.id)) return null
  if (typeof raw.question !== 'string' || !oneOf(raw.status, statuses) || !oneOf(raw.source, sources)) return null
  if (!('reason' in raw) || (raw.reason !== null && !oneOf(raw.reason, reasons))) return null
  if (!(typeof raw.timing_ms === 'number' && Number.isInteger(raw.timing_ms) && raw.timing_ms >= 0)) return null
  if (raw.mock !== undefined && typeof raw.mock !== 'boolean') return null
  const interpretation = raw.interpretation
  if (!isRecord(interpretation) || typeof interpretation.title !== 'string' || typeof interpretation.text !== 'string') return null
  if (!Array.isArray(interpretation.chips) || !interpretation.chips.every((chip) => typeof chip === 'string')) return null
  const answer = raw.answer
  if (!isRecord(answer) || !isText(answer.text)) return null
  const data = parseAnswerData(answer.kind, answer.data)
  if (!data) return null
  if (raw.status !== 'answered' && data.kind !== 'none') return null
  return {
    id: raw.id,
    question: raw.question,
    status: raw.status,
    reason: raw.reason,
    source: raw.source,
    interpretation: { title: interpretation.title, chips: [...interpretation.chips as string[]], text: interpretation.text },
    text: answer.text,
    data,
    timingMs: raw.timing_ms,
    mock: raw.mock === true,
  }
}

/** `GET /api/status`. */
export const parseStatus = (raw: unknown): ChatStatus | null => {
  if (!isRecord(raw) || raw.ok !== true || !oneOf(raw.mode, ['mock', 'live'] as const)) return null
  const model = raw.model
  const data = raw.data
  const consent = raw.consent
  if (!isRecord(model) || typeof model.name !== 'string' || typeof model.loaded !== 'boolean') return null
  if (!isRecord(data) || !isCount(data.accounts)) return null
  const lastSync = textOrNull(data.last_sync)
  const dataThrough = textOrNull(data.data_through)
  if (lastSync === undefined || dataThrough === undefined) return null
  if (!isRecord(consent)) return null
  const validUntil = textOrNull(consent.valid_until)
  const daysLeft = consent.days_left
  if (validUntil === undefined || !(daysLeft === null || (typeof daysLeft === 'number' && Number.isInteger(daysLeft)))) return null
  return {
    mode: raw.mode, modelName: model.name, modelLoaded: model.loaded, lastSync, dataThrough, accounts: data.accounts,
    consentValidUntil: validUntil, consentDaysLeft: daysLeft,
  }
}

/** `GET /api/suggestions`: al menos una sugerencia y preguntas de 1 a 500 caracteres. */
export const parseSuggestions = (raw: unknown): Suggestion[] | null => {
  if (!isRecord(raw) || !Array.isArray(raw.suggestions) || raw.suggestions.length === 0) return null
  const suggestions: Suggestion[] = []
  for (const item of raw.suggestions) {
    if (!isRecord(item) || !isText(item.id) || !isText(item.label) || !isText(item.question) || item.question.length > maxQuestionLength) return null
    suggestions.push({ id: item.id, label: item.label, question: item.question })
  }
  return suggestions
}

/** Código de un error `{"error": {"code", "message"}}`, o `null` si el cuerpo no tiene esa forma. */
export const parseApiErrorCode = (raw: unknown): string | null => {
  if (!isRecord(raw) || !isRecord(raw.error)) return null
  return typeof raw.error.code === 'string' ? raw.error.code : null
}

/** Pregunta lista para enviar (recortada, de 1 a 500 caracteres) o `null`. */
export const normalizeQuestion = (input: string): string | null => {
  const question = input.trim()
  return question.length > 0 && question.length <= maxQuestionLength ? question : null
}

export const messageForError = (error: ChatError): string => {
  switch (error.code) {
    case 'unauthorized': return 'El token no es válido o ha caducado. Introdúcelo de nuevo.'
    case 'model_busy': return `Estoy ocupado con otra consulta. Vuelve a intentarlo en ${error.retryAfterSeconds ?? defaultRetrySeconds} s.`
    case 'timeout': return 'La consulta ha tardado demasiado. Inténtalo de nuevo.'
    case 'network': return 'No se puede contactar con selfbank. Comprueba que Tailscale está activo en este dispositivo.'
    case 'invalid_response': return 'La respuesta de selfbank no tiene el formato esperado.'
    case 'invalid_request': return `La pregunta no es válida: debe tener entre 1 y ${maxQuestionLength} caracteres.`
    case 'not_found': return 'No encuentro eso en selfbank.'
    case 'internal': return 'Ha ocurrido un error en selfbank. Inténtalo más tarde.'
  }
}

/** Aviso cuando quedan 14 días o menos para reautorizar el acceso al banco. */
export const consentWarning = (daysLeft: number | null): string | null => {
  if (daysLeft === null || daysLeft > 14) return null
  if (daysLeft <= 0) return 'El consentimiento bancario ha caducado: reautoriza el acceso.'
  return `El consentimiento bancario caduca en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}: reautoriza pronto.`
}

const moneyFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const countFormat = new Intl.NumberFormat('es-ES')
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const isoDate = /^\d{4}-\d{2}-\d{2}$/

/** Texto de una celda de tabla según el tipo de su columna; lo que no encaja se muestra tal cual. */
export const formatCell = (value: CellValue, type: ColumnType): string => {
  if (value === null) return '—'
  if (type === 'money' && typeof value === 'number') return moneyFormat.format(value)
  if (type === 'count' && typeof value === 'number') return countFormat.format(value)
  if (type === 'date' && typeof value === 'string' && isoDate.test(value)) {
    const date = new Date(`${value}T00:00:00Z`)
    if (!Number.isNaN(date.getTime())) return dateFormat.format(date)
  }
  return String(value)
}
