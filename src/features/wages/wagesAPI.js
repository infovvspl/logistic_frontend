import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = ['user_id', 'normal_wages', 'ot_wages', 'pf_percentage', 'esic_percentage', 'senior_allowance']

let mockWages = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.wages_id }
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
    clean[f] = ['normal_wages','ot_wages','pf_percentage','esic_percentage','senior_allowance'].includes(f) ? Number(v) : v
  })
  return clean
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listWages() {
  try {
    if (USE_MOCKS) return { items: mockWages }
    const { data } = await api.get('/wages')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load wages')) }
}

export async function createWages(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { const next = { ...clean, id: `wg${Date.now()}` }; mockWages = [next, ...mockWages]; return next }
    const { data } = await api.post('/wages', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create wages')) }
}

export async function updateWages(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { mockWages = mockWages.map((w) => w.id === id ? { ...w, ...clean } : w); return mockWages.find((w) => w.id === id) }
    const { data } = await api.patch(`/wages/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update wages')) }
}

export async function deleteWages(id) {
  try {
    if (USE_MOCKS) { mockWages = mockWages.filter((w) => w.id !== id); return { ok: true } }
    const { data } = await api.delete(`/wages/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete wages')) }
}
