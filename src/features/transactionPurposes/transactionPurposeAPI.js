import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockItems = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.transaction_purpose_id }
}

function normalizeList(data) {
  if (Array.isArray(data)) return { items: data.map(normalize) }
  if (data?.items) return { ...data, items: data.items.map(normalize) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalize) }
  return { items: [] }
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listTransactionPurposes() {
  try {
    if (USE_MOCKS) return { items: mockItems }
    const { data } = await api.get('/transaction-purposes')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load transaction purposes')) }
}

export async function createTransactionPurpose(payload) {
  try {
    const clean = { transaction_purpose_name: payload.transaction_purpose_name }
    if (USE_MOCKS) { const next = { ...clean, id: `tp${Date.now()}` }; mockItems = [next, ...mockItems]; return next }
    const { data } = await api.post('/transaction-purposes', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create transaction purpose')) }
}

export async function updateTransactionPurpose(id, payload) {
  try {
    const clean = { transaction_purpose_name: payload.transaction_purpose_name }
    if (USE_MOCKS) { mockItems = mockItems.map((i) => i.id === id ? { ...i, ...clean } : i); return mockItems.find((i) => i.id === id) }
    const { data } = await api.patch(`/transaction-purposes/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update transaction purpose')) }
}

export async function deleteTransactionPurpose(id) {
  try {
    if (USE_MOCKS) { mockItems = mockItems.filter((i) => i.id !== id); return { ok: true } }
    const { data } = await api.delete(`/transaction-purposes/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete transaction purpose')) }
}
