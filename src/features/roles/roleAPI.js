import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_ROLE_FIELDS = ['designation']

let mockRoles = [{ id: 'r1', designation: 'Super Admin' }]

function normalizeRole(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.role_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeRole) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeRole) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeRole) }
  return { items: [] }
}

function cleanRolePayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_ROLE_FIELDS.forEach((field) => {
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

export async function listRoles() {
  try {
    if (USE_MOCKS) return { items: mockRoles }
    const { data } = await api.get('/roles')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load roles'))
  }
}

export async function getRole(id) {
  try {
    if (!id) throw new Error('Role ID is required')
    const { data } = await api.get(`/roles/${id}`)
    return normalizeRole(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load role'))
  }
}

export async function createRole(payload) {
  try {
    const clean = cleanRolePayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `r${Date.now()}` }
      mockRoles = [next, ...mockRoles]
      return next
    }
    const { data } = await api.post('/roles', clean)
    return normalizeRole(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create role'))
  }
}

export async function updateRole(id, payload) {
  try {
    if (!id) throw new Error('Role ID is required')
    const clean = cleanRolePayload(payload)
    if (USE_MOCKS) {
      mockRoles = mockRoles.map((r) => (r.id === id ? { ...r, ...clean } : r))
      return mockRoles.find((r) => r.id === id)
    }
    const { data } = await api.patch(`/roles/${id}`, clean)
    return normalizeRole(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update role'))
  }
}

export async function deleteRole(id) {
  try {
    if (!id) throw new Error('Role ID is required')
    if (USE_MOCKS) {
      mockRoles = mockRoles.filter((r) => r.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/roles/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete role'))
  }
}

