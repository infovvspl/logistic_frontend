import Modal from '../ui/Modal.jsx'
import { formatDate } from '../../utils/formatDate.js'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '')

function resolveUrl(url) {
  if (!url || typeof url !== 'string') return url
  // Replace any localhost or 127.0.0.1 origin with the configured API base
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE)
}

const SKIP_KEYS = ['id', '_id', 'role_id', 'branch_id', 'company_id', 'vehicle_id', 'user_id', 'created_at', 'updated_at',
  'customer_id', 'vehicle_assign_to_driver_id', 'fcm_token', '__v', 'created_by', 'updated_by']

const PROFILE_IMAGE_KEYS = ['image', 'pro_image_url', 'profile_image', 'avatar', 'photo']
const DOC_IMAGE_KEYS = [
  'aadhar_file', 'pan_file', 'passport_file', 'license_file', 'bank_passbook_file',
  'vehicle_image', 'vehicle_registration_certificate_file',
  'vehicle_insurance_file', 'vehicle_pollution_under_control_certificate_file',
  'vehicle_fitness_certificate_file', 'vehicle_permit_file', 'andhra_tax_file',
  'odisha_tax_file', 'vehicle_national_permit_file',
  'vehicle_andhra_permit_file', 'vehicle_odisha_permit_file',
  'purchase_bill_file', 'vehicle_vts_paper_file',
]

function isImageKey(key) {
  return PROFILE_IMAGE_KEYS.includes(key) || DOC_IMAGE_KEYS.includes(key) || /image|photo|avatar/i.test(key)
}
function isProfileImageKey(key) { return PROFILE_IMAGE_KEYS.includes(key) }
function isValidUrl(val) {
  if (typeof val !== 'string' || val.trim().length === 0) return false
  return val.startsWith('http') || val.startsWith('/') || val.startsWith('blob:') || val.includes('://')
}
function isDocUrl(val) {
  // treat any non-empty string for doc keys as a renderable file reference
  return typeof val === 'string' && val.trim().length > 0
}
function formatLabel(key) { return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  if (/date|time|at$/i.test(key)) {
    try { return formatDate(value) } catch { return String(value) }
  }
  return String(value)
}

function statusConfig(value) {
  const v = String(value).toUpperCase()
  if (['ACTIVE', 'COMPLETED'].includes(v))
    return { dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
  if (['INACTIVE', 'CANCELLED'].includes(v))
    return { dot: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  if (['ONGOING', 'IN_TRANSIT', 'SCHEDULED'].includes(v))
    return { dot: 'bg-blue-400', text: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
  return { dot: 'bg-zinc-400', text: 'text-zinc-500', bg: 'bg-zinc-50 border-zinc-200' }
}

function isAmountKey(key, rawValue) {
  // exclude known non-numeric fields regardless of key name
  if (['advance_type', 'advance_date', 'advance_account_number'].includes(key)) return false
  // only treat as amount if the raw value is actually numeric
  if (rawValue === null || rawValue === undefined || rawValue === '') return false
  if (isNaN(Number(rawValue))) return false
  return /amount|balance|total|advance|tds|cgst|sgst|rate|salary|allowance/i.test(key)
}

function FieldRow({ label, value, isStatus, isAmount, rawValue }) {
  const cfg = isStatus ? statusConfig(rawValue) : null

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0 group">
      <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider shrink-0 w-36 pt-0.5">
        {label}
      </span>
      <div className="flex-1 text-right">
        {isStatus ? (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {value}
          </span>
        ) : isAmount && value !== '—' ? (
          <span className="text-sm font-black text-zinc-900 tabular-nums">
            {String(value).startsWith('₹') ? value : `₹${Number(rawValue).toLocaleString('en-IN')}`}
          </span>
        ) : (
          <span className="text-sm font-semibold text-zinc-700 break-words">{value}</span>
        )}
      </div>
    </div>
  )
}

export default function DetailModal({ open, onClose, title, data, extraSections }) {
  if (!data) return null

  const imageEntry = Object.entries(data).find(([k, v]) => isProfileImageKey(k) && isValidUrl(v))
  const imageUrl = imageEntry ? resolveUrl(imageEntry[1]) : null
  const docImages = Object.entries(data)
    .filter(([k, v]) => DOC_IMAGE_KEYS.includes(k) && isDocUrl(v))
    .map(([k, v]) => [k, resolveUrl(v)])
  const entries = Object.entries(data).filter(
    ([k, v]) => !SKIP_KEYS.includes(k) && !isImageKey(k) && typeof v !== 'object'
  )

  return (
    <Modal open={open} onClose={onClose} title={title ?? 'Details'}>
      <div className="max-h-[72vh] overflow-y-auto -mx-1 px-1">

        {/* Profile header strip */}
        {imageUrl && (
          <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400">
            <img
              src={imageUrl}
              alt="Profile"
              className="h-16 w-16 rounded-xl object-cover border-2 border-white/20 bg-white shadow-lg shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="text-white font-bold text-base">{data.name || data.customer_name || title}</p>
              <p className="text-zinc-100 text-xs mt-0.5">{data.email || data.mobile || ''}</p>
            </div>
          </div>
        )}

        {/* Main fields — row layout */}
        <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden mb-4">
          {/* Header bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-white/60" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Information</span>
          </div>
          <div className="px-4">
            {entries.map(([key, value]) => (
              <FieldRow
                key={key}
                label={formatLabel(key)}
                value={formatValue(key, value)}
                rawValue={value}
                isStatus={/status/i.test(key)}
                isAmount={isAmountKey(key, value)}
              />
            ))}
          </div>
        </div>

        {/* Document Images */}
        {docImages.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-white/60" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Documents</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {docImages.map(([key, url]) => {
                const isPdf = /\.pdf($|\?)/i.test(url)
                const isLinkable = url.startsWith('http') || url.startsWith('/') || url.startsWith('blob:')
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {formatLabel(key)}
                    </span>
                    {isLinkable ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-center h-28 rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-lg transition-all duration-200"
                      >
                        {isPdf ? (
                          <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-zinc-600">Open PDF</span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={formatLabel(key)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const wrap = e.currentTarget.parentElement
                              const fb = document.createElement('div')
                              fb.className = 'flex flex-col items-center justify-center gap-1.5 w-full h-full bg-zinc-50'
                              fb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size:11px;color:#a1a1aa">No preview</span>'
                              wrap.appendChild(fb)
                            }}
                          />
                        )}
                      </a>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-28 rounded-xl border border-zinc-200 bg-zinc-50 gap-1.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="text-[11px] text-zinc-400">File uploaded</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Extra sections */}
        {extraSections?.map((section) => (
          <div key={section.title} className="rounded-2xl border border-zinc-100 bg-white overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-white/60" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">{section.title}</span>
            </div>
            <div className="px-4">
              {Object.entries(section.data ?? {}).map(([key, value]) => (
                <FieldRow
                  key={key}
                  label={formatLabel(key)}
                  value={formatValue(key, value)}
                  rawValue={value}
                  isStatus={/status/i.test(key)}
                  isAmount={isAmountKey(key, value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
