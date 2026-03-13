import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

let mockClients = [
  { id: 'c1', name: 'Northwind', contact: 'ops@northwind.test' },
  { id: 'c2', name: 'Contoso', contact: 'logistics@contoso.test' },
]

export async function listClients() {
  if (USE_MOCKS) return { items: mockClients }
  const { data } = await api.get('/clients')
  return data
}

export async function createClient(payload) {
  if (USE_MOCKS) {
    const next = {
      id: `c${Date.now()}`,
      name: payload.name,
      contact: payload.contact,
    }
    mockClients = [next, ...mockClients]
    return next
  }
  const { data } = await api.post('/clients', payload)
  return data
}

export async function deleteClient(id) {
  if (USE_MOCKS) {
    mockClients = mockClients.filter((c) => c.id !== id)
    return { ok: true }
  }
  const { data } = await api.delete(`/clients/${id}`)
  return data
}

