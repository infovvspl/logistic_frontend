import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = [
  'product_id', 'supplier_id',
  'unit', 'unit_price', 'quantity',
  'purchase_price', 'gst_percentage', 'gst_amount', 'total_price',
  'purchase_at', 'purchase_bill_file',
]

let mockPurchases = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.purchase_id }
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

export async function listPurchases() {
  try {
    if (USE_MOCKS) return { items: mockPurchases }
    const { data } = await api.get('/purchase-details')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load purchases')) }
}

export async function createPurchase(payload) {
  try {
    if (USE_MOCKS) {
      const next = { ...payload, id: `pur${Date.now()}` }
      mockPurchases = [next, ...mockPurchases]
      return next
    }
    // multipart if file is a File object
    const hasFile = payload.purchase_bill_file instanceof File
    if (hasFile) {
      const fd = new FormData()
      ALLOWED_FIELDS.forEach((f) => { if (payload[f] != null && payload[f] !== '') fd.append(f, payload[f]) })
      const { data } = await api.post('/purchase-details', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      return normalize(data?.data ?? data)
    }
    const clean = {}
    ALLOWED_FIELDS.forEach((f) => { if (payload[f] != null && payload[f] !== '') clean[f] = payload[f] })
    const { data } = await api.post('/purchase-details', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create purchase')) }
}

export async function updatePurchase(id, payload) {
  try {
    if (USE_MOCKS) {
      mockPurchases = mockPurchases.map((p) => p.id === id ? { ...p, ...payload } : p)
      return mockPurchases.find((p) => p.id === id)
    }
    const hasFile = payload.purchase_bill_file instanceof File
    if (hasFile) {
      const fd = new FormData()
      ALLOWED_FIELDS.forEach((f) => { if (payload[f] != null && payload[f] !== '') fd.append(f, payload[f]) })
      const { data } = await api.patch(`/purchase-details/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      return normalize(data?.data ?? data)
    }
    const clean = {}
    ALLOWED_FIELDS.forEach((f) => { if (payload[f] != null && payload[f] !== '') clean[f] = payload[f] })
    const { data } = await api.patch(`/purchase-details/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update purchase')) }
}

export async function deletePurchase(id) {
  try {
    if (USE_MOCKS) { mockPurchases = mockPurchases.filter((p) => p.id !== id); return { ok: true } }
    const { data } = await api.delete(`/purchase-details/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete purchase')) }
}
