import { api } from '../../services/axios.js'

// Fields allowed for driver per the required format
const ALLOWED_USER_FIELDS = [
  'name', 'email', 'mobile', 'password', 'date_of_birth', 
  'gender', 'aadhar_number', 'pan_number', 'passport_number',
  'emergency_contact_number', 'emergency_contact_name', 
  'emergency_contact_relationship', 'permanent_address', 
  'current_address', 'status', 'role'
]

const ALLOWED_DRIVER_FIELDS = [
  'license_number', 'license_type', 'license_issue_date', 
  'license_expiry_date', 'year_of_experience', 'preferred_vehicle_type'
]

export async function listDrivers() {
  const { data } = await api.get('/drivers')
  return data
}

export async function getDriver(id) {
  if (!id) throw new Error('Driver ID is required')
  const { data } = await api.get(`/drivers/${id}`)
  return data
}

export async function createDriver(payload) {
  try {
    const cleanPayload = {
      user_data: {},
      driver_data: {}
    }

    // Process User Data
    if (payload.user_data) {
      ALLOWED_USER_FIELDS.forEach(field => {
        let val = payload.user_data[field]
        if (val !== undefined && val !== null && val !== '') {
          if (field === 'emergency_contact_number') {
            cleanPayload.user_data[field] = Number(val)
          } else {
            cleanPayload.user_data[field] = val
          }
        }
      })
    }

    // Process Driver Data
    if (payload.driver_data) {
      ALLOWED_DRIVER_FIELDS.forEach(field => {
        let val = payload.driver_data[field]
        if (val !== undefined && val !== null && val !== '') {
          if (field === 'year_of_experience') {
            cleanPayload.driver_data[field] = Number(val)
          } else {
            cleanPayload.driver_data[field] = val
          }
        }
      })
    }

    const { data } = await api.post('/drivers', cleanPayload)
    return data
  } catch (error) {
    throw error?.response?.data?.message || error?.message || 'Failed to create driver'
  }
}

export async function updateDriver(id, payload) {
  try {
    if (!id) throw new Error('Driver ID is required')

    const cleanPayload = {
      user_data: {},
      driver_data: {}
    }

    // Process User Data
    if (payload.user_data) {
      ALLOWED_USER_FIELDS.forEach(field => {
        const val = payload.user_data[field]
        if (val !== undefined && val !== null && val !== '') {
          if (field === 'emergency_contact_number') {
            cleanPayload.user_data[field] = Number(val)
          } else {
            cleanPayload.user_data[field] = val
          }
        }
      })
    }

    // Process Driver Data
    if (payload.driver_data) {
      ALLOWED_DRIVER_FIELDS.forEach(field => {
        const val = payload.driver_data[field]
        if (val !== undefined && val !== null && val !== '') {
          if (field === 'year_of_experience') {
            cleanPayload.driver_data[field] = Number(val)
          } else {
            cleanPayload.driver_data[field] = val
          }
        }
      })
    }

    // API documentation says GET and PATCH are at /drivers/{id}
    const { data } = await api.patch(`/drivers/${id}`, cleanPayload)
    return data
  } catch (error) {
    throw error?.response?.data?.message || error?.message || 'Failed to update driver'
  }
}

export async function deleteDriver(id) {
  const { data } = await api.delete(`/drivers/${id}`)
  return data
}