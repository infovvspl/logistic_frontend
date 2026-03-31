import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = ['user_id', 'punch_in_at', 'punch_out_at']

let mockAttendance = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.attendance_id }
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

export async function listAttendance() {
  try {
    if (USE_MOCKS) return { items: mockAttendance }
    const { data } = await api.get('/attendance')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load attendance')) }
}

export async function createAttendance(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `att${Date.now()}` }
      mockAttendance = [next, ...mockAttendance]
      return next
    }
    const { data } = await api.post('/attendance', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create attendance')) }
}

export async function updateAttendance(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockAttendance = mockAttendance.map((a) => a.id === id ? { ...a, ...clean } : a)
      return mockAttendance.find((a) => a.id === id)
    }
    const { data } = await api.patch(`/attendance/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update attendance')) }
}

export async function deleteAttendance(id) {
  try {
    if (USE_MOCKS) { mockAttendance = mockAttendance.filter((a) => a.id !== id); return { ok: true } }
    const { data } = await api.delete(`/attendance/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete attendance')) }
}
