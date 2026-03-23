import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockRateCharts = [
  {
    id: 'rc1',
    metrics_id: 'm1',
    rate: 25000,
    from_place: 'p1',
    to_place: 'p2',
  },
]

function normalizeRateChart(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.rate_chart_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeRateChart) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeRateChart) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeRateChart) }
  return { items: [] }
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listRateCharts() {
  try {
    if (USE_MOCKS) return { items: mockRateCharts }
    const { data } = await api.get('/rate-charts')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load rate charts'))
  }
}

export async function createRateChart(payload) {
  try {
    const body = {
      metrics_id: payload.metrics_id,
      rate: Number(payload.rate),
      from_place: payload.from_place,
      to_place: payload.to_place,
    }
    if (USE_MOCKS) {
      const next = { id: `rc${Date.now()}`, ...body }
      mockRateCharts = [next, ...mockRateCharts]
      return next
    }
    const { data } = await api.post('/rate-charts', body)
    return normalizeRateChart(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create rate chart'))
  }
}

export async function updateRateChart(id, payload) {
  try {
    if (!id) throw new Error('Rate chart ID is required')
    const body = {
      metrics_id: payload.metrics_id,
      rate: Number(payload.rate),
      from_place: payload.from_place,
      to_place: payload.to_place,
    }
    if (USE_MOCKS) {
      mockRateCharts = mockRateCharts.map((r) => (r.id === id ? { ...r, ...body } : r))
      return mockRateCharts.find((r) => r.id === id)
    }
    const { data } = await api.patch(`/rate-charts/${id}`, body)
    return normalizeRateChart(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update rate chart'))
  }
}

export async function deleteRateChart(id) {
  try {
    if (!id) throw new Error('Rate chart ID is required')
    if (USE_MOCKS) {
      mockRateCharts = mockRateCharts.filter((r) => r.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/rate-charts/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete rate chart'))
  }
}
