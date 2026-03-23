import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_BRANCH_FIELDS = [
  'branch_name',
  'branch_email',
  'branch_phone',
  'branch_address',
  'company_id',
]

let mockBranches = [
  {
    id: 'br1',
    branch_name: 'Kolkata Main Branch',
    branch_email: 'kolkata@logistics.com',
    branch_phone: '9830012345',
    branch_address: 'Salt Lake Sector V, Kolkata',
    company_id: 'comp1',
  },
]

function normalizeBranch(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.branch_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeBranch) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeBranch) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeBranch) }
  return { items: [] }
}

function cleanBranchPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_BRANCH_FIELDS.forEach((field) => {
    const val = src[field]
    if (val === undefined || val === null) return
    if (typeof val === 'string' && val.trim() === '') return
    clean[field] = val
  })

  return clean
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback
}

export async function listBranches() {
  try {
    if (USE_MOCKS) return { items: mockBranches }
    const { data } = await api.get('/branches')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load branches'))
  }
}

export async function getBranch(id) {
  try {
    if (!id) throw new Error('Branch ID is required')
    const { data } = await api.get(`/branches/${id}`)
    return normalizeBranch(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load branch'))
  }
}

export async function createBranch(payload) {
  try {
    const clean = cleanBranchPayload(payload)
    if (!clean.company_id) throw new Error('Company ID is required')
    if (USE_MOCKS) {
      const next = { ...clean, id: `br${Date.now()}` }
      mockBranches = [next, ...mockBranches]
      return next
    }
    const { data } = await api.post('/branches', clean)
    return normalizeBranch(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create branch'))
  }
}

export async function updateBranch(id, payload) {
  try {
    if (!id) throw new Error('Branch ID is required')
    const clean = cleanBranchPayload(payload)
    if (USE_MOCKS) {
      mockBranches = mockBranches.map((b) => (b.id === id ? { ...b, ...clean } : b))
      return mockBranches.find((b) => b.id === id)
    }
    const { data } = await api.patch(`/branches/${id}`, clean)
    return normalizeBranch(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update branch'))
  }
}

export async function deleteBranch(id) {
  try {
    if (!id) throw new Error('Branch ID is required')
    if (USE_MOCKS) {
      mockBranches = mockBranches.filter((b) => b.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/branches/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete branch'))
  }
}

