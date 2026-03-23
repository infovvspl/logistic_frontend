import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_USER_FIELDS = [
  'name',
  'email',
  'mobile',
  'password',
  'role_id',
  'date_of_birth',
  'gender',
  'aadhar_number',
  'pan_number',
  'passport_number',
  'emergency_contact_number',
  'emergency_contact_name',
  'emergency_contact_relationship',
  'permanent_address',
  'current_address',
  'license_number',
  'license_type',
  'license_issue_date',
  'license_expiry_date',
  'year_of_experience',
  'preferred_vehicle_type',
  'referenced_by',
  'license_file',
  'aadhar_file',
  'pan_file',
  'passport_file',
  'image',
  'status',
  'branch_id',
]

let mockUsers = []

function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.user_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeUser) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeUser) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeUser) }
  if (data?.users && Array.isArray(data.users)) return { items: data.users.map(normalizeUser) }
  return { items: [] }
}

function cleanUserPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_USER_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    // Allow File objects through; skip empty strings
    if (typeof val === 'string' && val.trim() === '') return
    // Skip base64 strings — we send File objects instead
    if (typeof val === 'string' && val.startsWith('data:')) return
    if (field === 'year_of_experience') {
      const n = typeof val === 'number' ? val : Number(val)
      if (Number.isFinite(n)) clean[field] = n
      return
    }

    clean[field] = val
  })

  return clean
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listUsers() {
  try {
    if (USE_MOCKS) return { items: mockUsers }
    const { data } = await api.get('/users')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load users'))
  }
}

export async function getUser(id) {
  try {
    if (!id) throw new Error('User ID is required')
    const { data } = await api.get(`/users/${id}`)
    return normalizeUser(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load user'))
  }
}

const FILE_FIELDS = ['image', 'aadhar_file', 'pan_file', 'passport_file', 'license_file']

function buildFormData(clean) {
  const form = new FormData()
  Object.entries(clean).forEach(([key, val]) => {
    if (val instanceof File) {
      form.append(key, val)
    } else {
      form.append(key, String(val))
    }
  })
  return form
}

function hasFileField(clean) {
  return FILE_FIELDS.some((f) => clean[f] instanceof File)
}

export async function createUser(payload) {
  try {
    const clean = cleanUserPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `u${Date.now()}` }
      mockUsers = [next, ...mockUsers]
      return next
    }
    const hasFile = hasFileField(clean)
    const body = hasFile ? buildFormData(clean) : clean
    const { data } = await api.post('/users', body, hasFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
    return normalizeUser(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create user'))
  }
}

export async function updateUser(id, payload) {
  try {
    if (!id) throw new Error('User ID is required')
    const clean = cleanUserPayload(payload)
    if (USE_MOCKS) {
      mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, ...clean } : u))
      return mockUsers.find((u) => u.id === id)
    }
    const hasFile = hasFileField(clean)
    const body = hasFile ? buildFormData(clean) : clean
    const { data } = await api.patch(`/users/${id}`, body, hasFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
    return normalizeUser(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update user'))
  }
}

export async function deleteUser(id) {
  try {
    if (!id) throw new Error('User ID is required')
    if (USE_MOCKS) {
      mockUsers = mockUsers.filter((u) => u.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/users/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete user'))
  }
}

