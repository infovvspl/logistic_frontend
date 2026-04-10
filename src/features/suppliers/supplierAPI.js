import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = [
  'supplier_name', 'contact_person_name', 'supplier_phone',
  'contact_person_phone', 'supplier_email', 'supplier_address', 'supplier_gst_number',
  'bank_name', 'account_no_1', 'ifsc_code', 'swift_code', 'branch',
]

let mockSuppliers = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.supplier_id }
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

export async function listSuppliers() {
  try {
    if (USE_MOCKS) return { items: mockSuppliers }
    const { data } = await api.get('/suppliers')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load suppliers')) }
}

export async function createSupplier(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `sup${Date.now()}` }
      mockSuppliers = [next, ...mockSuppliers]
      return next
    }
    const { data } = await api.post('/suppliers', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create supplier')) }
}

export async function updateSupplier(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockSuppliers = mockSuppliers.map((s) => s.id === id ? { ...s, ...clean } : s)
      return mockSuppliers.find((s) => s.id === id)
    }
    const { data } = await api.patch(`/suppliers/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update supplier')) }
}

export async function deleteSupplier(id) {
  try {
    if (USE_MOCKS) { mockSuppliers = mockSuppliers.filter((s) => s.id !== id); return { ok: true } }
    const { data } = await api.delete(`/suppliers/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete supplier')) }
}
