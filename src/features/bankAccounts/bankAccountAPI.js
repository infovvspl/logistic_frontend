import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_BANK_ACCOUNT_FIELDS = [
  'company_id',
  'bank_name',
  'account_no',
  'ifsc_code',
  'swift_code',
  'branch',
]

let mockBankAccounts = [
  {
    id: 'ba1',
    company_id: 'comp1',
    bank_name: 'HDFC Bank',
    account_no: '4589658457',
    ifsc_code: 'PATI5678',
    swift_code: 'GHT6756',
    branch: 'PATIA',
  },
]

function normalizeBankAccount(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const id = raw.id ?? raw._id ?? raw.bank_account_id
  return { ...raw, id }
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return { items: data.map(normalizeBankAccount) }
  if (data?.items && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizeBankAccount) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalizeBankAccount) }
  return { items: [] }
}

function cleanBankAccountPayload(payload) {
  const clean = {}
  const src = payload && typeof payload === 'object' ? payload : {}

  ALLOWED_BANK_ACCOUNT_FIELDS.forEach((field) => {
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

export async function listBankAccounts() {
  try {
    if (USE_MOCKS) return { items: mockBankAccounts }
    const { data } = await api.get('/bank-accounts')
    return normalizeListResponse(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load bank accounts'))
  }
}

export async function getBankAccount(id) {
  try {
    if (!id) throw new Error('Bank Account ID is required')
    const { data } = await api.get(`/bank-accounts/${id}`)
    return normalizeBankAccount(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load bank account'))
  }
}

export async function createBankAccount(payload) {
  try {
    const clean = cleanBankAccountPayload(payload)
    if (!clean.company_id) throw new Error('Company ID is required')
    if (USE_MOCKS) {
      const next = { ...clean, id: `ba${Date.now()}` }
      mockBankAccounts = [next, ...mockBankAccounts]
      return next
    }
    const { data } = await api.post('/bank-accounts', clean)
    return normalizeBankAccount(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create bank account'))
  }
}

export async function updateBankAccount(id, payload) {
  try {
    if (!id) throw new Error('Bank Account ID is required')
    const clean = cleanBankAccountPayload(payload)
    if (USE_MOCKS) {
      mockBankAccounts = mockBankAccounts.map((b) => (b.id === id ? { ...b, ...clean } : b))
      return mockBankAccounts.find((b) => b.id === id)
    }
    const { data } = await api.patch(`/bank-accounts/${id}`, clean)
    return normalizeBankAccount(data?.data ?? data)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update bank account'))
  }
}

export async function deleteBankAccount(id) {
  try {
    if (!id) throw new Error('Bank Account ID is required')
    if (USE_MOCKS) {
      mockBankAccounts = mockBankAccounts.filter((b) => b.id !== id)
      return { ok: true }
    }
    const { data } = await api.delete(`/bank-accounts/${id}`)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete bank account'))
  }
}
