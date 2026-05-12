import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = [
  'trip_id', 'bill_no', 'vehicle_id', 'company_id',
  'payer_type', 'payer_id',
  'payee_type', 'payee_id',
  'amount', 'transaction_type', 'transaction_purpose',
]

let mockLedger = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  // Preserve both bill_no and bill_id — API may use either field name
  const bill_no = raw.bill_no ?? raw.bill_id ?? raw.bill_ref ?? ''
  return {
    ...raw,
    id: raw.id ?? raw._id ?? raw.ledger_id,
    bill_no,
  }
}

function normalizeList(data) {
  if (Array.isArray(data)) return { items: data.map(normalize) }
  if (data?.items) return { ...data, items: data.items.map(normalize) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalize) }
  return { items: [] }
}

function cleanPayload(payload) {
  const clean = {}
  ALLOWED_FIELDS.forEach((f) => {
    const v = payload[f]
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    clean[f] = v
  })
  return clean
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listLedger() {
  try {
    if (USE_MOCKS) return { items: mockLedger }
    const { data } = await api.get('/ledger')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load ledger')) }
}

export async function getLedger(id) {
  try {
    const { data } = await api.get(`/ledger/${id}`)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load ledger entry')) }
}

export async function createLedger(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `led${Date.now()}` }
      mockLedger = [next, ...mockLedger]
      return next
    }
    const { data } = await api.post('/ledger', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create ledger entry')) }
}

export async function updateLedger(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockLedger = mockLedger.map((l) => l.id === id ? { ...l, ...clean } : l)
      return mockLedger.find((l) => l.id === id)
    }
    const { data } = await api.patch(`/ledger/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update ledger entry')) }
}

export async function deleteLedger(id) {
  try {
    if (USE_MOCKS) { mockLedger = mockLedger.filter((l) => l.id !== id); return { ok: true } }
    const { data } = await api.delete(`/ledger/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete ledger entry')) }
}

// Expense-specific functions
export async function listExpenses() {
  try {
    if (USE_MOCKS) return { items: mockLedger.filter(l => l.transaction_type === 'expense') }
    const { data } = await api.get('/ledger?type=expense')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load expenses')) }
}

export async function createExpense(payload) {
  try {
    const clean = cleanPayload({ ...payload, transaction_type: 'expense' })
    if (USE_MOCKS) {
      const next = { ...clean, id: `exp${Date.now()}`, transaction_type: 'expense' }
      mockLedger = [next, ...mockLedger]
      return next
    }
    const { data } = await api.post('/ledger', { ...clean, transaction_type: 'expense' })
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create expense')) }
}

export async function updateExpense(id, payload) {
  try {
    const clean = cleanPayload({ ...payload, transaction_type: 'expense' })
    if (USE_MOCKS) {
      mockLedger = mockLedger.map((l) => l.id === id ? { ...l, ...clean, transaction_type: 'expense' } : l)
      return mockLedger.find((l) => l.id === id)
    }
    const { data } = await api.patch(`/ledger/${id}`, { ...clean, transaction_type: 'expense' })
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update expense')) }
}

export async function deleteExpense(id) {
  try {
    if (USE_MOCKS) { mockLedger = mockLedger.filter((l) => l.id !== id); return { ok: true } }
    const { data } = await api.delete(`/ledger/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete expense')) }
}
