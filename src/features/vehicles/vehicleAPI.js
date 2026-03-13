import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockVehicles = [
  { id: 'v1', plate: 'RST-1042', type: 'Van', status: 'Active' },
  { id: 'v2', plate: 'RST-2099', type: 'Truck', status: 'Maintenance' },
]

export async function listVehicles() {
  if (USE_MOCKS) return { items: mockVehicles }
  const { data } = await api.get('/vehicles')
  return data
}

export async function createVehicle(payload) {
  if (USE_MOCKS) {
    const next = {
      id: `v${Date.now()}`,
      plate: payload.plate,
      type: payload.type,
      status: payload.status ?? 'Active',
    }
    mockVehicles = [next, ...mockVehicles]
    return next
  }
  const { data } = await api.post('/vehicles', payload)
  return data
}

export async function deleteVehicle(id) {
  if (USE_MOCKS) {
    mockVehicles = mockVehicles.filter((v) => v.id !== id)
    return { ok: true }
  }
  const { data } = await api.delete(`/vehicles/${id}`)
  return data
}

