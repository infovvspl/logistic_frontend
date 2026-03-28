import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_COMPANY_FIELDS = [
  'name', 'email', 'mobile',
  'gst_no', 'cin_no', 'tin_no', 'pan_no', 'service_tax_no',
  'pf', 'esis', 'esi', 'senior_allowance',
  'account_no_1', 'bank_name', 'ifsc_code', 'swift_code', 'branch',
  'account_no_2', 'bank_name_2', 'ifsc_code_2', 'swift_code_2', 'branch_2',
]

let mockCompanies = [
  {
    id: 'comp1',
    name: 'RS Transport Services',
    email: 'support1@rstransport.com',
    mobile: '9345678323',
    gst_no: '33DDDDD3333D4Z3',
    cin_no: 'U44556TN2021PTC345378',
    tin_no: '5566778839',
    pan_no: 'DDDDD3313D',
    service_tax_no: 'ST335678',
    pf: 'PF33579',
    esis: 'ESI13539',
    esi: '',
    senior_allowance: 5500,
    account_no_1: '321354987012',
    bank_name: 'State Bank of India',
    ifsc_code: 'SBIN0001234',
    swift_code: 'SBININBB',
    branch: 'Mumbai Main Branch',
    account_no_2: '789312345678',
    bank_name_2: 'HDFC Bank',
    ifsc_code_2: 'HDFC0001234',
    swift_code_2: 'HDFCINBB',
    branch_2: 'Delhi Branch',
  },
]

function normalizeCompany(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.company_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeCompany) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeCompany) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeCompany) }
  return { items: [] }
}

function cleanCompanyPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_COMPANY_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    if (typeof val === 'string' && val.trim() === '') return

    if (field === 'senior_allowance') {
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

export async function listCompanies() {
  try {
    if (USE_MOCKS) return { items: mockCompanies }
    const { data } = await api.get('/companies')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load companies'))
  }
}

export async function getCompany(id) {
  try {
    if (!id) throw new Error('Company ID is required')
    const { data } = await api.get(`/companies/${id}`)
    return normalizeCompany(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load company'))
  }
}

export async function createCompany(payload) {
  try {
    const clean = cleanCompanyPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `comp${Date.now()}` }
      mockCompanies = [next, ...mockCompanies]
      return next
    }
    const { data } = await api.post('/companies', clean)
    return normalizeCompany(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create company'))
  }
}

export async function updateCompany(id, payload) {
  try {
    if (!id) throw new Error('Company ID is required')
    const clean = cleanCompanyPayload(payload)
    if (USE_MOCKS) {
      mockCompanies = mockCompanies.map((c) => (c.id === id ? { ...c, ...clean } : c))
      return mockCompanies.find((c) => c.id === id)
    }
    const { data } = await api.patch(`/companies/${id}`, clean)
    return normalizeCompany(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update company'))
  }
}

export async function deleteCompany(id) {
  try {
    if (!id) throw new Error('Company ID is required')
    if (USE_MOCKS) {
      mockCompanies = mockCompanies.filter((c) => c.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/companies/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete company'))
  }
}

