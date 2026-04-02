import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = ['product_id', 'unit', 'quantity', 'given_from', 'given_to']

let mockItems = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.transfer_id }
}

function normalizeList(data) {
  if (Array.isArray(data)) return { items: data.map(normalize) }
  if (data?.items) return { ...data, items: data.items.map(normalize) }
  if (data?.data && Array.isArray(data.data)) return { items: data.data.map(normalize) }
  return { items: [] }
}

function cleanPayload(payload) {
  const clean = {}
  ALLOWED_FIELDS.forEach((f) => {
    const v = payload[f]
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    clean[f] = f === 'quantity' ? Number(v) : v
  })
  return clean
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listProductTransfers() {
  try {
    if (USE_MOCKS) return { items: mockItems }
    const { data } = await api.get('/product-transfers')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load product transfers')) }
}

export async function createProductTransfer(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { const next = { ...clean, id: `pt${Date.now()}` }; mockItems = [next, ...mockItems]; return next }
    const { data } = await api.post('/product-transfers', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create product transfer')) }
}

export async function updateProductTransfer(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) { mockItems = mockItems.map((i) => i.id === id ? { ...i, ...clean } : i); return mockItems.find((i) => i.id === id) }
    const { data } = await api.patch(`/product-transfers/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update product transfer')) }
}

export async function deleteProductTransfer(id) {
  try {
    if (USE_MOCKS) { mockItems = mockItems.filter((i) => i.id !== id); return { ok: true } }
    const { data } = await api.delete(`/product-transfers/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete product transfer')) }
}
