import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_CUSTOMER_FIELDS = [
  'customer_name',
  'contact_person_name',
  'customer_phone',
  'contact_person_phone',
  'customer_email',
  'customer_address',
  'customer_gst',
  'customer_tan_number',
]

let mockCustomers = [
  {
    id: 'cust1',
    customer_name: 'Northwind',
    contact_person_name: 'Ops Team',
    customer_phone: '0000000000',
    contact_person_phone: '0000000000',
    customer_email: 'ops@northwind.test',
    customer_address: '—',
  },
]

function normalizeCustomer(raw) {
  if (!raw || typeof raw !== 'object') return raw

  // tolerate multiple backend shapes: {id}, {_id}, {customer_id}
  const id = raw.id ?? raw._id ?? raw.customer_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeCustomer) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeCustomer) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeCustomer) }
  return { items: [] }
}

function cleanCustomerPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_CUSTOMER_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    if (typeof val === 'string' && val.trim() === '') return
    clean[field] = val
  })

  return clean
}

function extractErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    fallback
  )
}

export async function listCustomers() {
  if (USE_MOCKS) return { items: mockCustomers }
  const { data } = await api.get('/customers')
  return normalizeListResponse(data)
}

export async function getCustomer(id) {
  if (!id) throw new Error('Customer ID is required')
  const { data } = await api.get(`/customers/${id}`)
  return normalizeCustomer(data?.data ?? data)
}

export async function createCustomer(payload) {
  try {
    const clean = cleanCustomerPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `cust${Date.now()}` }
      mockCustomers = [next, ...mockCustomers]
      return next
    }
    const { data } = await api.post('/customers', clean)
    return normalizeCustomer(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create customer'))
  }
}

export async function updateCustomer(id, payload) {
  try {
    if (!id) throw new Error('Customer ID is required')
    const clean = cleanCustomerPayload(payload)
    if (USE_MOCKS) {
      mockCustomers = mockCustomers.map((c) => (c.id === id ? { ...c, ...clean } : c))
      return mockCustomers.find((c) => c.id === id)
    }
    const { data } = await api.patch(`/customers/${id}`, clean)
    return normalizeCustomer(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update customer'))
  }
}

export async function deleteCustomer(id) {
  try {
    if (!id) throw new Error('Customer ID is required')
    if (USE_MOCKS) {
      mockCustomers = mockCustomers.filter((c) => c.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/customers/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete customer'))
  }
}

