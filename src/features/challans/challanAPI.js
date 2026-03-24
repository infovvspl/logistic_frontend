import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_CHALLAN_FIELDS = [
  'challan_no', 'bill_no', 'challan_date', 'trip_id', 'unloading_date', 'permit_number', 'transport',
  'vehicle_number', 'description', 'weight_at_loading', 'weight_at_unloading',
  'shortage', 'hsn_code', 'total_amount', 'tds', 'remark', 'advance',
  'tc_date', 'balance',
]

let mockChallans = []

function normalizeChallan(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.challan_id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeChallan) }
  if (data?.items) return { ...data, items: data.items.map(normalizeChallan) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeChallan) }
  return { items: [] }
}

function cleanPayload(payload) {
  const clean = {}
  ALLOWED_CHALLAN_FIELDS.forEach((f) => {
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

export async function listChallans() {
  try {
    if (USE_MOCKS) return { items: mockChallans }
    const { data } = await api.get('/challans')
    return normalizeListResponse(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load challans')) }
}

export async function getChallan(id) {
  try {
    const { data } = await api.get(`/challans/${id}`)
    return normalizeChallan(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load challan')) }
}

export async function createChallan(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `ch${Date.now()}` }
      mockChallans = [next, ...mockChallans]
      return next
    }
    const { data } = await api.post('/challans', clean)
    return normalizeChallan(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create challan')) }
}

export async function updateChallan(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockChallans = mockChallans.map((c) => c.id === id ? { ...c, ...clean } : c)
      return mockChallans.find((c) => c.id === id)
    }
    const { data } = await api.patch(`/challans/${id}`, clean)
    return normalizeChallan(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update challan')) }
}

export async function deleteChallan(id) {
  try {
    if (USE_MOCKS) { mockChallans = mockChallans.filter((c) => c.id !== id); return { ok: true } }
    const { data } = await api.delete(`/challans/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete challan')) }
}
