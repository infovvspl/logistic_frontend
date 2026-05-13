import { api } from '../../services/axios.js'
import { USE_MOCKS } from '../../utils/constants.js'

const ALLOWED_FIELDS = ['product_name', 'stock', 'low_stock', 'hsn_code', 'part_number']

let mockProducts = []

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return { ...raw, id: raw.id ?? raw._id ?? raw.product_id }
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
    clean[f] = v
  })
  if (clean.stock !== undefined) clean.stock = Number(clean.stock)
  if (clean.low_stock !== undefined) clean.low_stock = Number(clean.low_stock)
  return clean
}

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

export async function listProducts() {
  try {
    if (USE_MOCKS) return { items: mockProducts }
    const { data } = await api.get('/products')
    return normalizeList(data)
  } catch (err) { throw new Error(extractError(err, 'Failed to load products')) }
}

export async function createProduct(payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      const next = { ...clean, id: `prod${Date.now()}` }
      mockProducts = [next, ...mockProducts]
      return next
    }
    const { data } = await api.post('/products', clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to create product')) }
}

export async function updateProduct(id, payload) {
  try {
    const clean = cleanPayload(payload)
    if (USE_MOCKS) {
      mockProducts = mockProducts.map((p) => p.id === id ? { ...p, ...clean } : p)
      return mockProducts.find((p) => p.id === id)
    }
    const { data } = await api.patch(`/products/${id}`, clean)
    return normalize(data?.data ?? data)
  } catch (err) { throw new Error(extractError(err, 'Failed to update product')) }
}

export async function deleteProduct(id) {
  try {
    if (USE_MOCKS) { mockProducts = mockProducts.filter((p) => p.id !== id); return { ok: true } }
    const { data } = await api.delete(`/products/${id}`)
    return data
  } catch (err) { throw new Error(extractError(err, 'Failed to delete product')) }
}
