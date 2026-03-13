import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockDrivers = [
  { id: 'd1', name: 'Asha Verma', phone: '+1 555 0101', joinedAt: '2026-01-03' },
  { id: 'd2', name: 'Miguel Santos', phone: '+1 555 0102', joinedAt: '2026-02-12' },
]

export async function listDrivers() {
  if (USE_MOCKS) return { items: mockDrivers }
  const { data } = await api.get('/drivers')
  return data
}

export async function createDriver(payload) {
  if (USE_MOCKS) {
    const next = {
      id: `d${Date.now()}`,
      name: payload.name,
      phone: payload.phone,
      joinedAt: payload.joinedAt ?? new Date().toISOString(),
    }
    mockDrivers = [next, ...mockDrivers]
    return next
  }
  const { data } = await api.post('/drivers', payload)
  return data
}

export async function deleteDriver(id) {
  if (USE_MOCKS) {
    mockDrivers = mockDrivers.filter((d) => d.id !== id)
    return { ok: true }
  }
  const { data } = await api.delete(`/drivers/${id}`)
  return data
}

