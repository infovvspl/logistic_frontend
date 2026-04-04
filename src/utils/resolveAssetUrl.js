function stripTrailingSlash(s) {
  return s.endsWith('/') ? s.slice(0, -1) : s
}

function joinUrl(base, path) {
  const cleanBase = stripTrailingSlash(base || '')
  const cleanPath = String(path || '')
  if (!cleanBase) return cleanPath
  if (!cleanPath) return cleanBase
  return `${cleanBase}/${cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath}`
}

function getAssetBase() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'

  if (typeof apiBase !== 'string') return ''
  if (!apiBase.startsWith('http')) return ''

  try {
    const u = new URL(apiBase)
    u.hash = ''
    u.search = ''

    // Common convention: API at `/api`, static at `/uploads`
    u.pathname = u.pathname.replace(/\/api\/?$/i, '/')

    const basePath = stripTrailingSlash(u.pathname)
    return basePath ? `${u.origin}${basePath}` : u.origin
  } catch {
    return ''
  }
}

const ASSET_BASE = getAssetBase()

export function resolveAssetUrl(input) {
  if (!input) return input
  if (typeof input !== 'string') return input

  const raw = input.trim()
  if (!raw) return raw
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  if (raw.startsWith('/uploads/')) return joinUrl(ASSET_BASE, raw)
  if (raw.startsWith('uploads/')) return joinUrl(ASSET_BASE, `/${raw}`)

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const u = new URL(raw)
      const idx = u.pathname.indexOf('/uploads/')
      if (idx >= 0) {
        const path = `${u.pathname.slice(idx)}${u.search}${u.hash}`
        return ASSET_BASE ? joinUrl(ASSET_BASE, path) : path
      }
    } catch {
      // ignore parse errors and return raw
    }
  }

  return raw
}
