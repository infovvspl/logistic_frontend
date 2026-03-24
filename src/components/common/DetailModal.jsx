import Modal from '../ui/Modal.jsx'
import { formatDate } from '../../utils/formatDate.js'

const SKIP_KEYS = ['id', '_id', 'role_id', 'branch_id', 'company_id', 'vehicle_id', 'user_id',
  'customer_id', 'vehicle_assign_to_driver_id', 'fcm_token', '__v']

const PROFILE_IMAGE_KEYS = ['image', 'pro_image_url', 'profile_image', 'avatar', 'photo']
const DOC_IMAGE_KEYS = [
  'aadhar_file', 'pan_file', 'passport_file', 'license_file', 'bank_passbook_file',
  'vehicle_image', 'vehicle_registration_certificate_file',
  'vehicle_insurance_file', 'vehicle_pollution_under_control_certificate_file',
  'vehicle_fitness_certificate_file', 'vehicle_permit_file',
]

function isImageKey(key) {
  return PROFILE_IMAGE_KEYS.includes(key) || DOC_IMAGE_KEYS.includes(key) || /image|photo|avatar/i.test(key)
}

function isProfileImageKey(key) {
  // Only treat as profile image if it's in PROFILE_IMAGE_KEYS exactly
  // DOC_IMAGE_KEYS take priority even if they match the regex
  return PROFILE_IMAGE_KEYS.includes(key)
}

function isValidUrl(val) {
  return typeof val === 'string' && val.length > 0 && (val.startsWith('http') || val.startsWith('/'))
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  // date-like keys
  if (/date|time|at$/i.test(key)) {
    try { return formatDate(value) } catch { return String(value) }
  }
  return String(value)
}

function statusColor(value) {
  const v = String(value).toUpperCase()
  if (['ACTIVE', 'COMPLETED'].includes(v)) return 'bg-green-50 text-green-700 ring-green-600/20'
  if (['INACTIVE', 'CANCELLED'].includes(v)) return 'bg-red-50 text-red-700 ring-red-600/10'
  if (v === 'ONGOING') return 'bg-blue-50 text-blue-700 ring-blue-700/10'
  return 'bg-zinc-100 text-zinc-600 ring-zinc-500/10'
}

export default function DetailModal({ open, onClose, title, data, extraSections }) {
  if (!data) return null

  // Find first profile image URL field
  const imageEntry = Object.entries(data).find(([k, v]) => isProfileImageKey(k) && isValidUrl(v))
  const imageUrl = imageEntry?.[1] ?? null

  // Document image entries (aadhar, pan, passport, license)
  const docImages = Object.entries(data).filter(([k, v]) => DOC_IMAGE_KEYS.includes(k) && isValidUrl(v))

  const entries = Object.entries(data).filter(
    ([k, v]) => !SKIP_KEYS.includes(k) && !isImageKey(k) && typeof v !== 'object'
  )

  return (
    <Modal open={open} onClose={onClose} title={title ?? 'Details'}>
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        {/* Profile image */}
        {imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-zinc-200 shadow"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {entries.map(([key, value]) => {
            const isStatus = /status/i.test(key)
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {formatLabel(key)}
                </span>
                {isStatus ? (
                  <span className={`w-fit inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(value)}`}>
                    {value}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-800 font-medium break-words">
                    {formatValue(key, value)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Document Images */}
        {docImages.length > 0 && (
          <div className="pt-2 border-t border-zinc-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Documents</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {docImages.map(([key, url]) => {
                const isPdf = /\.pdf($|\?)/i.test(url)
                return (
                  <div key={key} className="flex flex-col gap-1.5 justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 leading-tight">
                      {formatLabel(key)}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center h-28 rounded-lg border border-zinc-200 overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full bg-zinc-50 hover:bg-zinc-100 transition-colors">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span className="text-xs font-semibold text-blue-600">Open PDF</span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={formatLabel(key)}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center gap-1 w-full h-full bg-zinc-50"><span class="text-xs text-zinc-400">Failed to load</span></div>' }}
                        />
                      )}
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Extra sections (e.g. related driver, vehicle) */}
        {extraSections?.map((section) => (
          <div key={section.title} className="pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {section.title}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {Object.entries(section.data ?? {}).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {formatLabel(key)}
                  </span>
                  <span className="text-sm text-zinc-800 font-medium break-words">
                    {formatValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
