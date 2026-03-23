import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_TRIP_FIELDS = [
  'customer_id',
  'vehicle_assign_to_driver_id',
  'source',
  'destination',
  'start_date_time',
  'end_date_time',
  'consignment',
  'metrics',
  'amount',
  'status',
]

let mockTrips = [
  {
    id: 't1',
    customer_id: 'c1',
    vehicle_assign_to_driver_id: 'a1',
    source: 'Kolkata',
    destination: 'Delhi',
    start_date_time: '2026-03-20T08:00:00Z',
    end_date_time: '2026-03-22T18:00:00Z',
    consignment: 'Electronics',
    metrics: '1500 KM',
    amount: 45000,
    status: 'ONGOING',
  },
]

function normalizeTrip(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.trip_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeTrip) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeTrip) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeTrip) }
  return { items: [] }
}

function cleanTripPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_TRIP_FIELDS.forEach((field) => {
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

export async function listTrips() {
  try {
    if (USE_MOCKS) return { items: mockTrips }
    const { data } = await api.get('/trips')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load trips'))
  }
}

export async function getTrip(id) {
  try {
    if (!id) throw new Error('Trip ID is required')
    if (USE_MOCKS) {
      const t = mockTrips.find((t) => t.id === id)
      if (!t) throw new Error('Trip not found')
      return t
    }
    const { data } = await api.get(`/trips/${id}`)
    return normalizeTrip(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load trip'))
  }
}

export async function createTrip(payload) {
  try {
    const clean = cleanTripPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `t${Date.now()}` }
      mockTrips = [next, ...mockTrips]
      return next
    }
    const { data } = await api.post('/trips', clean)
    return normalizeTrip(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create trip'))
  }
}

export async function updateTrip(id, payload) {
  try {
    if (!id) throw new Error('Trip ID is required')
    const clean = cleanTripPayload(payload)
    if (USE_MOCKS) {
      mockTrips = mockTrips.map((t) => (t.id === id ? { ...t, ...clean } : t))
      return mockTrips.find((t) => t.id === id)
    }
    const { data } = await api.patch(`/trips/${id}`, clean)
    return normalizeTrip(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update trip'))
  }
}

export async function deleteTrip(id) {
  try {
    if (!id) throw new Error('Trip ID is required')
    if (USE_MOCKS) {
      mockTrips = mockTrips.filter((t) => t.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/trips/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete trip'))
  }
}
