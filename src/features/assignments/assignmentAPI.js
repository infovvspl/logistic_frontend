import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockAssignments = [
  {
    id: 'a1',
    driver: 'Asha Verma',
    vehicle: 'RST-1042',
    client: 'Northwind',
    createdAt: '2026-03-01',
  },
]

export async function listAssignments() {
  if (USE_MOCKS) return { items: mockAssignments }
  const { data } = await api.get('/assignments')
  return data
}

export async function createAssignment(payload) {
  if (USE_MOCKS) {
    const next = {
      id: `a${Date.now()}`,
      driver: payload.driver,
      vehicle: payload.vehicle,
      client: payload.client,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    }
    mockAssignments = [next, ...mockAssignments]
    return next
  }
  const { data } = await api.post('/assignments', payload)
  return data
}

export async function deleteAssignment(id) {
  if (USE_MOCKS) {
    mockAssignments = mockAssignments.filter((a) => a.id !== id)
    return { ok: true }
  }
  const { data } = await api.delete(`/assignments/${id}`)
  return data
}

