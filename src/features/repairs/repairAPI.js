import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_REPAIR_FIELDS = [
  'vehicle_id',
  'reported_by',
  'repair_type',
  'issue_description',
  'mechanic_name',
  'km',
  'repair_cost',
  'repair_start_date',
  'repair_end_date',
  'status',
]

let mockRepairs = [
  {
    id: 'r1',
    vehicle_id: 'bbb80731-7c5b-45cd-973f-852c1d9532e8',
    reported_by: 'a06a069a-a058-45bb-bb7e-655f100099d5',
    repair_type: 'Engine Repair',
    issue_description: 'Engine making unusual noise and overheating',
    mechanic_name: 'Ramesh Kumar',
    repair_cost: 8500,
    repair_start_date: '2026-05-14',
    repair_end_date: '2026-05-16',
    status: 'in_progress',
  },
]

function normalizeRepair(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.repair_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeRepair) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeRepair) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeRepair) }
  return { items: [] }
}

function cleanRepairPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_REPAIR_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    if (typeof val === 'string' && val.trim() === '') return
    clean[field] = val
  })

  return clean
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listRepairs() {
  try {
    if (USE_MOCKS) return { items: mockRepairs }
    const { data } = await api.get('/repairs')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load repairs'))
  }
}

export async function getRepair(id) {
  try {
    if (!id) throw new Error('Repair ID is required')
    if (USE_MOCKS) {
      const r = mockRepairs.find((r) => r.id === id)
      if (!r) throw new Error('Repair not found')
      return r
    }
    const { data } = await api.get(`/repairs/${id}`)
    return normalizeRepair(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load repair'))
  }
}

export async function createRepair(payload) {
  try {
    const clean = cleanRepairPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `r${Date.now()}` }
      mockRepairs = [next, ...mockRepairs]
      return next
    }
    const { data } = await api.post('/repairs', clean)
    return normalizeRepair(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create repair'))
  }
}

export async function updateRepair(id, payload) {
  try {
    if (!id) throw new Error('Repair ID is required')
    const clean = cleanRepairPayload(payload)
    if (USE_MOCKS) {
      mockRepairs = mockRepairs.map((r) => (r.id === id ? { ...r, ...clean } : r))
      return mockRepairs.find((r) => r.id === id)
    }
    const { data } = await api.patch(`/repairs/${id}`, clean)
    return normalizeRepair(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update repair'))
  }
}

export async function deleteRepair(id) {
  try {
    if (!id) throw new Error('Repair ID is required')
    if (USE_MOCKS) {
      mockRepairs = mockRepairs.filter((r) => r.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/repairs/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete repair'))
  }
}
