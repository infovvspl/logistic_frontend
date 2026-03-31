import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = [
  'user_id', 'wages_id', 'month',
  'no_of_working_hours', 'no_of_working_days', 'no_of_leave_days', 'no_of_ot_hours',
  'regular_wages', 'ot_wages', 'pf', 'esic', 'senior_allowance', 'total_wages',
]

let mockSalary = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.salary_id }
}

function normalizeList(data) {
  if (Array.isArray(data)) return { items: data.map(normalize) }
  if (data?.items) return { ...data, items: data.items.map(normalize) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalize) }
  return { items: [] }
}

const NUM_FIELDS = ['no_of_working_hours','no_of_working_days','no_of_leave_days','no_of_ot_hours','regular_wages','ot_wages','pf','esic','senior_allowance','total_wages']

function cleanPayload(payload) {
  const clean = {}
  ALLOWED_FIELDS.forEach((f) => {
    const v = payload[f]
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    clean[f] = NUM_FIELDS.includes(f) ? Number(v) : v
  })
  return clean
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listSalary() {
  try {
    if (USE_MOCKS) return { items: mockSalary }
    const { data } = await api.get('/salary')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load salary')) }
}

export async function createSalary(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { const next = { ...clean, id: `sal${Date.now()}` }; mockSalary = [next, ...mockSalary]; return next }
    const { data } = await api.post('/salary', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create salary')) }
}

export async function updateSalary(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { mockSalary = mockSalary.map((s) => s.id === id ? { ...s, ...clean } : s); return mockSalary.find((s) => s.id === id) }
    const { data } = await api.patch(`/salary/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update salary')) }
}

export async function deleteSalary(id) {
  try {
    if (USE_MOCKS) { mockSalary = mockSalary.filter((s) => s.id !== id); return { ok: true } }
    const { data } = await api.delete(`/salary/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete salary')) }
}
