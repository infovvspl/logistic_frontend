import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import {
  FiCamera, FiUser, FiMail, FiPhone, FiLock,
  FiCalendar, FiCheckCircle, FiInfo, FiTruck, FiUpload, FiFile,
} from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const VEHICLE_TYPES = [
  { value: 'Truck', label: 'Truck' },
  { value: 'Van', label: 'Van' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Car', label: 'Car' },
  { value: 'Trailer', label: 'Trailer' },
]

function formatDate(v) {
  if (v === undefined || v === null || v === '') return ''
  if (typeof v === 'string') {
    const s = v.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split('-')
      return `${yyyy}-${mm}-${dd}`
    }
  }
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  )
}

function FileUpload({ label, fieldName, setValue, watch }) {
  const file = watch(fieldName)
  const hasFile = file instanceof File
  const existingUrl = typeof file === 'string' && file.startsWith('http') ? file : null
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!hasFile) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, hasFile])

  const previewSrc = preview || existingUrl

  const isPdf = hasFile
    ? file.type === 'application/pdf'
    : existingUrl ? /\.pdf($|\?)/i.test(existingUrl) : false

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>

      {/* Preview */}
      {previewSrc && (
        isPdf ? (
          <a href={previewSrc} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 h-28 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-semibold text-blue-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Click to open PDF
          </a>
        ) : (
          <a href={previewSrc} target="_blank" rel="noreferrer" className="block">
            <img src={previewSrc} alt={label}
              className="w-full h-28 object-cover rounded-lg border border-zinc-200 shadow-sm hover:opacity-90 transition-opacity"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </a>
        )
      )}

      {/* Upload bar */}
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${hasFile ? 'border-blue-200 bg-blue-50' : 'border-zinc-200 bg-zinc-50'}`}>
        <FiFile size={16} className={hasFile ? 'text-blue-500' : 'text-zinc-400'} />
        <span className="flex-1 text-xs text-zinc-600 truncate">
          {hasFile ? file.name : existingUrl ? 'File uploaded' : 'No file chosen'}
        </span>
        <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0">
          <FiUpload size={12} />
          {existingUrl || hasFile ? 'Change' : 'Upload'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setValue(fieldName, f)
            }}
          />
        </label>
        {(hasFile || existingUrl) && (
          <button type="button" onClick={() => setValue(fieldName, '')} className="text-xs text-rose-500 font-semibold hover:underline shrink-0">
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

export default function UserForm({
  defaultValues,
  onSubmit,
  loading,
  lockedRoleId,
  lockedRoleLabel,
  branches = [],
  companies = [],
}) {
  const isEdit = !!defaultValues
  const isDriver = lockedRoleLabel?.toLowerCase().includes('driver')

  const processedDefaults = useMemo(() => {
    if (!defaultValues) return null
    const src = JSON.parse(JSON.stringify(defaultValues))
    const out = { ...src }
    out.date_of_birth = formatDate(out.date_of_birth)
    out.license_issue_date = formatDate(out.license_issue_date)
    out.license_expiry_date = formatDate(out.license_expiry_date)
    out.gender = (out.gender || 'MALE').toUpperCase()
    out.status = (out.status || 'ACTIVE').toUpperCase()
    out.year_of_experience = out.year_of_experience ?? ''
    // normalise image field — API may return it as pro_image_url
    // only use if it's a real http URL (not a path, blob, or base64)
    const rawImg = out.pro_image_url || out.image || ''
    out.image = (typeof rawImg === 'string' && rawImg.startsWith('http')) ? rawImg : ''
    // normalise document file fields
    ;['aadhar_file', 'pan_file', 'passport_file', 'license_file'].forEach((f) => {
      const v = out[f] || ''
      out[f] = (typeof v === 'string' && v.startsWith('http')) ? v : ''
    })
    return out
  }, [defaultValues])

  const branchOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Select branch' }]
    branches.forEach((b) => opts.push({ value: b.id, label: b.branch_name }))
    return opts
  }, [branches])

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: processedDefaults ?? {
      name: '', email: '', mobile: '', password: '',
      role_id: lockedRoleId ?? '', date_of_birth: '', gender: 'MALE',
      aadhar_number: '', pan_number: '', passport_number: '',
      emergency_contact_number: '', emergency_contact_name: '', emergency_contact_relationship: '',
      permanent_address: '', current_address: '',
      license_number: '', license_type: '', license_issue_date: '', license_expiry_date: '',
      year_of_experience: '', preferred_vehicle_type: 'Truck', referenced_by: '',
      image: '', status: 'ACTIVE', branch_id: '',
      aadhar_file: '', pan_file: '', passport_file: '', license_file: '',
    },
  })

  useEffect(() => {
    if (processedDefaults) reset(processedDefaults)
  }, [processedDefaults, reset])

  useEffect(() => {
    if (lockedRoleId) setValue('role_id', lockedRoleId, { shouldValidate: true })
  }, [lockedRoleId, setValue])

  const selectedBranchId = useWatch({ control, name: 'branch_id' })
  const watchImage = watch('image')
  const watchName = watch('name')
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!watchImage) { setPreview(''); return }
    if (typeof watchImage === 'string') { setPreview(watchImage); return }
    const url = URL.createObjectURL(watchImage)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [watchImage])

  const selectedCompany = useMemo(() => {
    const branch = branches.find((b) => String(b.id) === String(selectedBranchId))
    if (!branch) return null
    return companies.find((c) => String(c.id) === String(branch.company_id))
  }, [selectedBranchId, branches, companies])

  return (
    <form onSubmit={handleSubmit(async (values) => {
      // remove empty file fields so existing files are preserved
      ;['image', 'aadhar_file', 'pan_file', 'passport_file', 'license_file'].forEach((f) => {
        if (!values[f] || typeof values[f] === 'string') delete values[f]
      })
      await onSubmit(values)
    })} className="w-full space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50">
        <div className="relative shrink-0 group">
          <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow bg-zinc-200">
            {preview ? (
              <img src={preview} className="h-full w-full object-cover" alt="Profile" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <FiUser size={28} />
              </div>
            )}
          </div>
          <label
            htmlFor="user-image"
            className="absolute -bottom-1.5 -right-1.5 p-1 bg-blue-600 rounded-lg text-white shadow cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <FiCamera size={12} />
          </label>
          <input
            type="file"
            id="user-image"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setValue('image', file)
            }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-700">{watchName || 'New User'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{lockedRoleLabel || 'User'}</p>
          {watchImage ? (
            <button
              type="button"
              onClick={() => setValue('image', '')}
              className="mt-1 text-xs text-rose-500 font-semibold hover:underline"
            >
              Remove photo
            </button>
          ) : (
            <label htmlFor="user-image" className="mt-1 text-xs text-blue-600 font-semibold cursor-pointer hover:underline block">
              Upload photo
            </label>
          )}
        </div>
      </div>

      {/* ── Account Credentials ─────────────────────────────── */}
      <SectionDivider label="Account Details" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Full Name"
          placeholder="Enter your name"
          error={errors.name?.message}
          required
          leftIcon={<FiUser />}
          {...register('name', { required: 'Name required' })}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          required
          leftIcon={<FiMail />}
          {...register('email', {
            required: 'Email required',
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
          })}
        />
        <Input
          label="Mobile"
          placeholder="Enter your number"
          error={errors.mobile?.message}
          required
          leftIcon={<FiPhone />}
          {...register('mobile', {
            required: 'Mobile required',
            pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' },
          })}
        />
        {!isEdit ? (
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            required
            leftIcon={<FiLock />}
            {...register('password', { required: 'Password required' })}
          />
        ) : (
          <Input
            label="New Password"
            type="password"
            placeholder="Leave blank to keep current"
            leftIcon={<FiLock />}
            {...register('password')}
          />
        )}
        <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
          <div className="flex items-center h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">
              {lockedRoleLabel || '—'}
            </span>
            {/* <span className="text-xs text-zinc-400">Locked</span> */}
          </div>
          <input type="hidden" {...register('role_id', { required: true })} />
        </div>
      </div>

      {/* ── Business Assignment ─────────────────────────────── */}
      <SectionDivider label="Branch Details" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="branch_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Assign Branch"
              options={branchOptions}
              error={errors.branch_id?.message}
              {...field}
            />
          )}
        />
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Company</label>
          <div className={`flex items-center h-10 px-3 rounded-lg border text-sm transition-colors ${selectedCompany
            ? 'border-blue-200 bg-blue-50 text-blue-800 font-medium'
            : 'border-zinc-200 bg-zinc-50 text-zinc-400'
            }`}>
            {selectedCompany?.name || 'Auto-filled on branch select'}
          </div>
        </div>
        <div className="col-span-full">
          <Input
            label="Referenced By"
            placeholder="Name of referrer (optional)"
            leftIcon={<FiInfo />}
            {...register('referenced_by')}
          />
        </div>
      </div>

      {/* ── Personal Information ────────────────────────────── */}
      <SectionDivider label="Personal Information" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="date_of_birth"
          control={control}
          render={({ field }) => (
            <Input label="Date of Birth" type="date" leftIcon={<FiCalendar />} {...field} />
          )}
        />
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select label="Gender" options={GENDER_OPTIONS} {...field} />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Aadhar Number" placeholder="123456789012" maxLength={12} error={errors.aadhar_number?.message}
          {...register('aadhar_number', { validate: (v) => !v || /^\d{12}$/.test(v) || '12 digits required' })}
        />
        <Input label="PAN Card" placeholder="ABCDE1234F" maxLength={10} error={errors.pan_number?.message}
          {...register('pan_number', { validate: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) || 'Invalid PAN' })}
        />
        <Input label="Passport Number" placeholder="Z1234567" maxLength={8} {...register('passport_number')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FileUpload label="Aadhar File" fieldName="aadhar_file" setValue={setValue} watch={watch} />
        <FileUpload label="PAN File" fieldName="pan_file" setValue={setValue} watch={watch} />
        <FileUpload label="Passport File" fieldName="passport_file" setValue={setValue} watch={watch} />
      </div>

      {/* ── License & Professional ──────────────────────────── */}
      {(isDriver || isEdit) && (
        <>
          <SectionDivider label="License & Professional" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="License Number"
              placeholder="DL-XXXXXXXXXX"
              required={isDriver}
              leftIcon={<FiTruck />}
              {...register('license_number', { required: isDriver })}
            />
            <Input
              label="License Type"
              placeholder="HMV / LMV"
              required={isDriver}
              {...register('license_type', { required: isDriver })}
            />
            <Input
              label="Issue Date"
              type="date"
              required={isDriver}
              leftIcon={<FiCalendar />}
              {...register('license_issue_date', { required: isDriver })}
            />
            <Input
              label="Expiry Date"
              type="date"
              required={isDriver}
              leftIcon={<FiCalendar />}
              {...register('license_expiry_date', { required: isDriver })}
            />
            <Input
              label="Years of Experience"
              type="number"
              placeholder="e.g. 5"
              required={isDriver}
              {...register('year_of_experience', { required: isDriver })}
            />
            <Controller
              name="preferred_vehicle_type"
              control={control}
              render={({ field }) => (
                <Select label="Preferred Vehicle" options={VEHICLE_TYPES} {...field} />
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FileUpload label="License File" fieldName="license_file" setValue={setValue} watch={watch} />
          </div>
        </>
      )}

      {/* ── Emergency Contact ───────────────────────────────── */}
      <SectionDivider label="Emergency Contact" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Contact Name"
          placeholder="Full name"
          {...register('emergency_contact_name')}
        />
        <Input
          label="Relationship"
          placeholder="e.g. Spouse"
          {...register('emergency_contact_relationship')}
        />
        <Input
          label="Contact Number"
          placeholder="9876543210"
          leftIcon={<FiPhone />}
          {...register('emergency_contact_number')}
        />
      </div>

      {/* ── Address Details ─────────────────────────────────── */}
      <SectionDivider label="Address Details" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Textarea
          label="Current Address"
          placeholder="Street, City, State…"
          rows={3}
          {...register('current_address')}
        />
        <Textarea
          label="Permanent Address"
          placeholder="Same as above or different…"
          rows={3}
          {...register('permanent_address')}
        />
      </div>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="flex justify-end pt-3 border-t border-zinc-100">
        <Button
          type="submit"
          loading={loading}
          className="min-w-[160px]"
          leftIcon={<FiCheckCircle size={16} />}
        >
          {isEdit ? 'Save Changes' : `Create ${lockedRoleLabel || 'User'}`}
        </Button>
      </div>
    </form>
  )
}