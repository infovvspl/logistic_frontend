import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = ['shift_name', 'start_time', 'end_time']

let mockShifts = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.shift_id }
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

export async function listShifts() {
  try {
    if (USE_MOCKS) return { items: mockShifts }
    const { data } = await api.get('/shifts')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load shifts')) }
}

export async function createShift(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { const next = { ...clean, id: `shift${Date.now()}` }; mockShifts = [next, ...mockShifts]; return next }
    const { data } = await api.post('/shifts', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create shift')) }
}

export async function updateShift(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { mockShifts = mockShifts.map((s) => s.id === id ? { ...s, ...clean } : s); return mockShifts.find((s) => s.id === id) }
    const { data } = await api.patch(`/shifts/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update shift')) }
}

export async function deleteShift(id) {
  try {
    if (USE_MOCKS) { mockShifts = mockShifts.filter((s) => s.id !== id); return { ok: true } }
    const { data } = await api.delete(`/shifts/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete shift')) }
}
