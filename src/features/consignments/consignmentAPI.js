import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockConsignments = [
  { id: 'c1', name: 'Limestone' },
  { id: 'c2', name: 'Coal' },
]

function normalizeConsignment(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.consignment_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeConsignment) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeConsignment) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeConsignment) }
  return { items: [] }
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listConsignments() {
  try {
    if (USE_MOCKS) return { items: mockConsignments }
    const { data } = await api.get('/consignments')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load consignments'))
  }
}

export async function createConsignment(payload) {
  try {
    if (USE_MOCKS) {
      const next = { id: `c${Date.now()}`, name: payload.name }
      mockConsignments = [next, ...mockConsignments]
      return next
    }
    const { data } = await api.post('/consignments', { name: payload.name })
    return normalizeConsignment(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create consignment'))
  }
}

export async function updateConsignment(id, payload) {
  try {
    if (!id) throw new Error('Consignment ID is required')
    if (USE_MOCKS) {
      mockConsignments = mockConsignments.map((c) => (c.id === id ? { ...c, name: payload.name } : c))
      return mockConsignments.find((c) => c.id === id)
    }
    const { data } = await api.patch(`/consignments/${id}`, { name: payload.name })
    return normalizeConsignment(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update consignment'))
  }
}

export async function deleteConsignment(id) {
  try {
    if (!id) throw new Error('Consignment ID is required')
    if (USE_MOCKS) {
      mockConsignments = mockConsignments.filter((c) => c.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/consignments/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete consignment'))
  }
}
