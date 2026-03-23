import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_ASSIGNMENT_FIELDS = [
  'driver_id',
  'helper_id',
  'vehicle_id',
  'status',
  // legacy field kept for backward compat
  'user_id',
]

let mockAssignments = [
  {
    id: 'a1',
    user_id: 'driver1',
    vehicle_id: 'v1',
    status: 'ASSIGNED',
    createdAt: '2026-03-01T10:00:00Z',
  },
]

function normalizeAssignment(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.assignment_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeAssignment) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeAssignment) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeAssignment) }
  return { items: [] }
}

function cleanAssignmentPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_ASSIGNMENT_FIELDS.forEach((field) => {
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

export async function listAssignments() {
  try {
    if (USE_MOCKS) return { items: mockAssignments }
    const { data } = await api.get('/assignments')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load assignments'))
  }
}

export async function getAssignment(id) {
  try {
    if (!id) throw new Error('Assignment ID is required')
    if (USE_MOCKS) {
      const a = mockAssignments.find((a) => a.id === id)
      if (!a) throw new Error('Assignment not found')
      return a
    }
    const { data } = await api.get(`/assignments/${id}`)
    return normalizeAssignment(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load assignment'))
  }
}

export async function createAssignment(payload) {
  try {
    const clean = cleanAssignmentPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `a${Date.now()}`, createdAt: new Date().toISOString() }
      mockAssignments = [next, ...mockAssignments]
      return next
    }
    const { data } = await api.post('/assignments', clean)
    return normalizeAssignment(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create assignment'))
  }
}

export async function updateAssignment(id, payload) {
  try {
    if (!id) throw new Error('Assignment ID is required')
    const clean = cleanAssignmentPayload(payload)
    if (USE_MOCKS) {
      mockAssignments = mockAssignments.map((a) => (a.id === id ? { ...a, ...clean } : a))
      return mockAssignments.find((a) => a.id === id)
    }
    const { data } = await api.patch(`/assignments/${id}`, clean)
    return normalizeAssignment(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update assignment'))
  }
}

export async function deleteAssignment(id) {
  try {
    if (!id) throw new Error('Assignment ID is required')
    if (USE_MOCKS) {
      mockAssignments = mockAssignments.filter((a) => a.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/assignments/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete assignment'))
  }
}


