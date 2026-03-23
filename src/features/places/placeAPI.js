import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockPlaces = [
  { id: 'p1', name: 'Bhubaneswar' },
  { id: 'p2', name: 'Cuttack' },
]

function normalizePlace(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.place_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizePlace) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizePlace) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizePlace) }
  return { items: [] }
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listPlaces() {
  try {
    if (USE_MOCKS) return { items: mockPlaces }
    const { data } = await api.get('/places')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load places'))
  }
}

export async function createPlace(payload) {
  try {
    if (USE_MOCKS) {
      const next = { id: `p${Date.now()}`, name: payload.name }
      mockPlaces = [next, ...mockPlaces]
      return next
    }
    const { data } = await api.post('/places', { name: payload.name })
    return normalizePlace(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create place'))
  }
}

export async function updatePlace(id, payload) {
  try {
    if (!id) throw new Error('Place ID is required')
    if (USE_MOCKS) {
      mockPlaces = mockPlaces.map((p) => (p.id === id ? { ...p, name: payload.name } : p))
      return mockPlaces.find((p) => p.id === id)
    }
    const { data } = await api.patch(`/places/${id}`, { name: payload.name })
    return normalizePlace(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update place'))
  }
}

export async function deletePlace(id) {
  try {
    if (!id) throw new Error('Place ID is required')
    if (USE_MOCKS) {
      mockPlaces = mockPlaces.filter((p) => p.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/places/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete place'))
  }
}
