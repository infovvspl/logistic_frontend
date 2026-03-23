import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockMetrics = [
  { id: 'm1', name: 'TON' },
  { id: 'm2', name: 'KG' },
]

function normalizeMetric(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.metric_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeMetric) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeMetric) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeMetric) }
  return { items: [] }
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listMetrics() {
  try {
    if (USE_MOCKS) return { items: mockMetrics }
    const { data } = await api.get('/metrics')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load metrics'))
  }
}

export async function createMetric(payload) {
  try {
    if (USE_MOCKS) {
      const next = { id: `m${Date.now()}`, name: payload.name }
      mockMetrics = [next, ...mockMetrics]
      return next
    }
    const { data } = await api.post('/metrics', { name: payload.name })
    return normalizeMetric(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create metric'))
  }
}

export async function updateMetric(id, payload) {
  try {
    if (!id) throw new Error('Metric ID is required')
    if (USE_MOCKS) {
      mockMetrics = mockMetrics.map((m) => (m.id === id ? { ...m, name: payload.name } : m))
      return mockMetrics.find((m) => m.id === id)
    }
    const { data } = await api.patch(`/metrics/${id}`, { name: payload.name })
    return normalizeMetric(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update metric'))
  }
}

export async function deleteMetric(id) {
  try {
    if (!id) throw new Error('Metric ID is required')
    if (USE_MOCKS) {
      mockMetrics = mockMetrics.filter((m) => m.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/metrics/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete metric'))
  }
}
