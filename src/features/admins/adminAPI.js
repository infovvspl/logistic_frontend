import { api } from '../../services/axios.js'

// Allowed fields that backend accepts for admin update
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'mobile',
  'date_of_birth',
  'gender',
  'aadhar_number',
  'address',
  'password'
]

export async function listAdmins() {
  const { data } = await api.get('/admin')
  return data
}

export async function createAdmin(payload) {
  const { data } = await api.post('/admin', payload)
  return data
}

export async function updateAdmin(id, payload) {
  try {
    if (!id) {
      throw new Error('Admin ID is required')
    }

    const cleanPayload = {}

    // Only allow safe fields
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      const value = payload?.[field]

      if (value === undefined || value === null || value === '') return

      // Don't send empty password
      if (field === 'password' && !value) return

      cleanPayload[field] = value
    })

    console.log('PATCH PAYLOAD:', cleanPayload)

    if (Object.keys(cleanPayload).length === 0) {
      throw new Error('No valid fields to update')
    }

    const { data } = await api.patch(`/admin/${id}`, cleanPayload)

    return data
  } catch (error) {
    console.error('Update admin failed:', error?.response?.data || error.message)

    throw (
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update admin'
    )
  }
}

export async function deleteAdmin(id) {
  const { data } = await api.delete(`/admin/${id}`)
  return data
}