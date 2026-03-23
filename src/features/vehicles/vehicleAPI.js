import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_VEHICLE_FIELDS = [
  'registration_number',
  'chassis_number',
  'vehicle_type',
  'vehicle_manufacture_company',
  'vehicle_model',
  'vehicle_manufacturing_year',
  'vehicle_color',
  'vehicle_load_capacity',
  'vehicle_seating_capacity',
  'vehicle_body_type',
  'vehicle_fuel_type',
  'vehicle_registration_certificate_number',
  'vehicle_registration_certificate_expiry_date',
  'vehicle_insurance_company_name',
  'vehicle_insurance_policy_number',
  'vehicle_insurance_expiry_date',
  'vehicle_pollution_under_control_certificate_issue_date',
  'vehicle_pollution_under_control_certificate_expiry_date',
  'vehicle_fitness_certificate_issue_date',
  'vehicle_fitness_certificate_expiry_date',
  'vehicle_permit_issue_date',
  'vehicle_permit_expiry_date',
  'vehicle_permit_type',
  'vehicle_owner_name',
  'vehicle_purchase_date',
  'vehicle_status',
  'vehicle_gps_device_id',
  'branch_id',
  'vehicle_image',
  'vehicle_registration_certificate_file',
  'vehicle_insurance_file',
  'vehicle_pollution_under_control_certificate_file',
  'vehicle_fitness_certificate_file',
  'vehicle_permit_file',
]

const VEHICLE_FILE_FIELDS = [
  'vehicle_image',
  'vehicle_registration_certificate_file',
  'vehicle_insurance_file',
  'vehicle_pollution_under_control_certificate_file',
  'vehicle_fitness_certificate_file',
  'vehicle_permit_file',
]

function buildFormData(clean) {
  const form = new FormData()
  Object.entries(clean).forEach(([key, val]) => {
    form.append(key, val instanceof File ? val : String(val))
  })
  return form
}

function hasFileField(clean) {
  return VEHICLE_FILE_FIELDS.some((f) => clean[f] instanceof File)
}

let mockVehicles = [
  {
    id: 'v1',
    registration_number: 'WB23AB1234',
    chassis_number: 'CHS987654321',
    vehicle_type: 'Truck',
    vehicle_manufacture_company: 'Tata',
    vehicle_model: 'Tata 407',
    vehicle_manufacturing_year: 2022,
    vehicle_color: 'White',
    vehicle_load_capacity: '6000',
    vehicle_seating_capacity: 2,
    vehicle_body_type: 'Closed',
    vehicle_fuel_type: 'Diesel',
    vehicle_registration_certificate_number: 'RC987654',
    vehicle_registration_certificate_expiry_date: '2030-01-01',
    vehicle_insurance_company_name: 'ICICI Lombard',
    vehicle_insurance_policy_number: 'INS987654',
    vehicle_insurance_expiry_date: '2027-01-01',
    vehicle_pollution_under_control_certificate_issue_date: '2024-01-01',
    vehicle_pollution_under_control_certificate_expiry_date: '2025-01-01',
    vehicle_fitness_certificate_issue_date: '2023-01-01',
    vehicle_fitness_certificate_expiry_date: '2026-01-01',
    vehicle_permit_issue_date: '2023-01-01',
    vehicle_permit_expiry_date: '2028-01-01',
    vehicle_permit_type: 'National',
    vehicle_owner_name: 'ABC Logistics',
    vehicle_purchase_date: '2022-06-15',
    vehicle_status: 'ACTIVE',
    vehicle_gps_device_id: 'GPS987654',
    branch_id: '4ef3f42e-1f7e-4bf6-971f-1fb875567e7c',
  },
]

function normalizeVehicle(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.vehicle_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeVehicle) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeVehicle) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeVehicle) }
  return { items: [] }
}

function cleanVehiclePayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_VEHICLE_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    if (typeof val === 'string' && val.trim() === '') return
    if (typeof val === 'string' && val.startsWith('data:')) return
    clean[field] = val
  })

  return clean
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listVehicles() {
  try {
    if (USE_MOCKS) return { items: mockVehicles }
    const { data } = await api.get('/vehicles')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load vehicles'))
  }
}

export async function getVehicle(id) {
  try {
    if (!id) throw new Error('Vehicle ID is required')
    if (USE_MOCKS) {
      const v = mockVehicles.find((v) => v.id === id)
      if (!v) throw new Error('Vehicle not found')
      return v
    }
    const { data } = await api.get(`/vehicles/${id}`)
    return normalizeVehicle(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load vehicle'))
  }
}

export async function createVehicle(payload) {
  try {
    const clean = cleanVehiclePayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `v${Date.now()}` }
      mockVehicles = [next, ...mockVehicles]
      return next
    }
    const hasFile = hasFileField(clean)
    const body = hasFile ? buildFormData(clean) : clean
    const { data } = await api.post('/vehicles', body, hasFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
    return normalizeVehicle(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create vehicle'))
  }
}

export async function updateVehicle(id, payload) {
  try {
    if (!id) throw new Error('Vehicle ID is required')
    const clean = cleanVehiclePayload(payload)
    if (USE_MOCKS) {
      mockVehicles = mockVehicles.map((v) => (v.id === id ? { ...v, ...clean } : v))
      return mockVehicles.find((v) => v.id === id)
    }
    const hasFile = hasFileField(clean)
    const body = hasFile ? buildFormData(clean) : clean
    const { data } = await api.patch(`/vehicles/${id}`, body, hasFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
    return normalizeVehicle(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update vehicle'))
  }
}

export async function deleteVehicle(id) {
  try {
    if (!id) throw new Error('Vehicle ID is required')
    if (USE_MOCKS) {
      mockVehicles = mockVehicles.filter((v) => v.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/vehicles/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete vehicle'))
  }
}

