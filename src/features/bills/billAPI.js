import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_BILL_FIELDS = ['bill_no', 'challan_id', 'challan_ids']

let mockBills = []

function normalizeBill(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.bill_id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeBill) }
  if (data?.items) return { ...data, items: data.items.map(normalizeBill) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeBill) }
  return { items: [] }
}

function cleanPayload(payload) {
  const clean = {}
  ALLOWED_BILL_FIELDS.forEach((f) => {
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

export async function listBills() {
  try {
    if (USE_MOCKS) return { items: mockBills }
    const { data } = await api.get('/bills')
    return normalizeListResponse(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load bills')) }
}

export async function createBill(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `bill${Date.now()}` }
      mockBills = [next, ...mockBills]
      return next
    }
    const { data } = await api.post('/bills', clean)
    return normalizeBill(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create bill')) }
}

export async function updateBill(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockBills = mockBills.map((b) => b.id === id ? { ...b, ...clean } : b)
      return mockBills.find((b) => b.id === id)
    }
    const { data } = await api.patch(`/bills/${id}`, clean)
    return normalizeBill(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update bill')) }
}

export async function deleteBill(id) {
  try {
    if (USE_MOCKS) { mockBills = mockBills.filter((b) => b.id !== id); return { ok: true } }
    const { data } = await api.delete(`/bills/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete bill')) }
}
