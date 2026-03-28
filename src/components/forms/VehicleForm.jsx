import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import {
  FiTruck, FiHash, FiCalendar,
  FiFileText, FiShield, FiCheckCircle,
  FiUser, FiCpu, FiUpload, FiFile, FiCamera,
} from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'

const VEHICLE_TYPES = [
  { value: 'Truck', label: 'Truck' },
  { value: 'Van', label: 'Van' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Car', label: 'Car' },
  { value: 'Trailer', label: 'Trailer' },
]
const BODY_TYPES = [
  { value: 'Open', label: 'Open' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Container', label: 'Container' },
  { value: 'Flatbed', label: 'Flatbed' },
]
const FUEL_TYPES = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Petrol', label: 'Petrol' },
  { value: 'CNG', label: 'CNG' },
  { value: 'Electric', label: 'Electric' },
]
const PERMIT_TYPES = [
  { value: 'National', label: 'National' },
  { value: 'State', label: 'State' },
]
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

function formatDate(v) {
  if (!v) return ''
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
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${hasFile ? 'border-blue-200 bg-blue-50' : 'border-zinc-200 bg-zinc-50'}`}>
        <FiFile size={16} className={hasFile ? 'text-blue-500' : 'text-zinc-400'} />
        <span className="flex-1 text-xs text-zinc-600 truncate">
          {hasFile ? file.name : existingUrl ? 'File uploaded' : 'No file chosen'}
        </span>
        <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0">
          <FiUpload size={12} />
          {existingUrl || hasFile ? 'Change' : 'Upload'}
          <input type="file" accept="image/*,.pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setValue(fieldName, f) }}
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

export default function VehicleForm({ defaultValues, onSubmit, loading, branches = [], companies = [] }) {
  const isEdit = !!defaultValues

  const processedDefaults = useMemo(() => {
    if (!defaultValues) return null
    const src = { ...defaultValues }
    const dateFields = [
      'vehicle_registration_certificate_expiry_date',
      'vehicle_insurance_policy_date',
      'vehicle_insurance_expiry_date',
      'vehicle_pollution_under_control_certificate_issue_date',
      'vehicle_pollution_under_control_certificate_expiry_date',
      'vehicle_fitness_certificate_issue_date',
      'vehicle_fitness_certificate_expiry_date',
      'vehicle_permit_issue_date',
      'vehicle_permit_expiry_date',
      'vehicle_purchase_date',
      'vehicle_gps_device_expiry_date',
      'vehicle_mining_gps_device_expiry_date',
      'vehicle_vts_device_expiry_date',
      'andhra_permit_expiry_date',
      'vehicle_andhra_permit_issue_date',
      'vehicle_andhra_permit_expiry_date',
      'vehicle_odisha_permit_issue_date',
      'vehicle_odisha_permit_expiry_date',
      'vehicle_national_permit_issue_date',
      'vehicle_national_permit_expiry_date',
    ]
    dateFields.forEach((f) => (src[f] = formatDate(src[f])))
    // normalise file fields — only keep http URLs
    const fileFields = [
      'vehicle_image', 'vehicle_registration_certificate_file',
      'vehicle_insurance_file', 'vehicle_pollution_under_control_certificate_file',
      'vehicle_fitness_certificate_file', 'vehicle_permit_file',
      'vehicle_andhra_permit_file', 'vehicle_odisha_permit_file',
      'vehicle_national_permit_file', 'andhra_tax_file', 'odisha_tax_file',
    ]
    fileFields.forEach((f) => {
      const v = src[f] || ''
      src[f] = typeof v === 'string' && v.startsWith('http') ? v : ''
    })
    return src
  }, [defaultValues])

  const branchOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Select branch' }]
    branches.forEach((b) => opts.push({ value: b.id, label: b.branch_name }))
    return opts
  }, [branches])

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: processedDefaults ?? {
      registration_number: '',
      chassis_number: '',
      engine_number: '',
      vehicle_engine_no: '',
      vehicle_type: 'Truck',
      vehicle_manufacture_company: '',
      vehicle_model: '',
      vehicle_manufacturing_year: new Date().getFullYear(),
      vehicle_color: '',
      vehicle_load_capacity: '',
      vehicle_seating_capacity: 2,
      vehicle_body_type: 'Closed',
      vehicle_fuel_type: 'Diesel',
      vehicle_status: 'ACTIVE',
      vehicle_registration_certificate_number: '',
      vehicle_registration_certificate_expiry_date: '',
      vehicle_insurance_company_name: '',
      vehicle_insurance_policy_number: '',
      vehicle_insurance_policy_date: '',
      vehicle_insurance_expiry_date: '',
      vehicle_pollution_under_control_certificate_number: '',
      vehicle_pollution_under_control_certificate_issue_date: '',
      vehicle_pollution_under_control_certificate_expiry_date: '',
      vehicle_fitness_certificate_issue_date: '',
      vehicle_fitness_certificate_expiry_date: '',
      vehicle_permit_issue_date: '',
      vehicle_permit_expiry_date: '',
      vehicle_permit_type: 'National',
      andhra_permit_status: '',
      andhra_permit_expiry_date: '',
      andhra_tax: '',
      odisha_tax: '',
      odisha_permit_status: '',
      national_permit_status: '',
      vehicle_andhra_permit_issue_date: '',
      vehicle_andhra_permit_expiry_date: '',
      vehicle_andhra_permit_file: '',
      vehicle_odisha_permit_issue_date: '',
      vehicle_odisha_permit_expiry_date: '',
      vehicle_odisha_permit_file: '',
      vehicle_national_permit_issue_date: '',
      vehicle_national_permit_expiry_date: '',
      vehicle_national_permit_file: '',
      andhra_tax_file: '',
      odisha_tax_file: '',
      vehicle_gps_company: '',
      vehicle_gps_device_id: '',
      vehicle_gps_device_expiry_date: '',
      vehicle_mining_gps_device_id: '',
      vehicle_mining_gps_device_expiry_date: '',
      vehicle_vts_device_id: '',
      vehicle_vts_device_expiry_date: '',
      vehicle_owner_name: '',
      vehicle_purchase_date: '',
      branch_id: '',
      company_id: '',
      vehicle_image: '',
      vehicle_registration_certificate_file: '',
      vehicle_insurance_file: '',
      vehicle_pollution_under_control_certificate_file: '',
      vehicle_fitness_certificate_file: '',
      vehicle_permit_file: '',
    },
  })

  const selectedBranchId = useWatch({ control, name: 'branch_id' })
  const selectedCompany = useMemo(() => {
    const branch = branches.find((b) => String(b.id) === String(selectedBranchId))
    if (!branch) return null
    return companies.find((c) => String(c.id) === String(branch.company_id))
  }, [selectedBranchId, branches, companies])

  useEffect(() => {
    setValue('company_id', selectedCompany?.id ?? '')
  }, [selectedCompany, setValue])

  return (
    <form onSubmit={handleSubmit((values) => {
      // remove empty file fields so existing files are preserved
      const fileFields = ['vehicle_image', 'vehicle_registration_certificate_file',
        'vehicle_insurance_file', 'vehicle_pollution_under_control_certificate_file',
        'vehicle_fitness_certificate_file', 'vehicle_permit_file',
        'vehicle_andhra_permit_file', 'vehicle_odisha_permit_file',
        'vehicle_national_permit_file', 'andhra_tax_file', 'odisha_tax_file']
      fileFields.forEach((f) => { if (!values[f] || typeof values[f] === 'string') delete values[f] })
      onSubmit(values)
    })} className="w-full space-y-4">

      {/* ── General Information ─────────────────────────────── */}
      <SectionDivider label="General Information" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Registration Number" required placeholder="WB23AB1234"
          error={errors.registration_number?.message}
          leftIcon={<FiHash />}
          {...register('registration_number', { required: 'Required' })}
        />
        <Input
          label="Chassis Number" placeholder="CHS98765..."
          leftIcon={<FiHash />}
          {...register('chassis_number')}
        />
        <Input
          label="Engine Number" placeholder="ENG-11223344"
          leftIcon={<FiHash />}
          {...register('engine_number')}
        />
        <Controller control={control} name="vehicle_type"
          render={({ field }) => <Select label="Vehicle Type" options={VEHICLE_TYPES} {...field} />}
        />
        <Input
          label="Manufacturer" placeholder="Tata / Eicher"
          leftIcon={<FiTruck />}
          {...register('vehicle_manufacture_company')}
        />
        <Input
          label="Model" placeholder="Tata 407"
          leftIcon={<FiTruck />}
          {...register('vehicle_model')}
        />
        <Input
          label="Manufacturing Year" type="number"
          leftIcon={<FiCalendar />}
          {...register('vehicle_manufacturing_year')}
        />
        <Input
          label="Color" placeholder="White"
          {...register('vehicle_color')}
        />
        <Controller control={control} name="vehicle_status"
          render={({ field }) => <Select label="Status" options={STATUS_OPTIONS} {...field} />}
        />
      </div>

      {/* ── Specifications ──────────────────────────────────── */}
      <SectionDivider label="Specifications" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Load Capacity (kg)" placeholder="6000"
          {...register('vehicle_load_capacity')}
        />
        <Input
          label="Seating Capacity" type="number"
          {...register('vehicle_seating_capacity')}
        />
        <Controller control={control} name="vehicle_body_type"
          render={({ field }) => <Select label="Body Type" options={BODY_TYPES} {...field} />}
        />
        <Controller control={control} name="vehicle_fuel_type"
          render={({ field }) => <Select label="Fuel Type" options={FUEL_TYPES} {...field} />}
        />
      </div>

      {/* ── Registration & Insurance ────────────────────────── */}
      <SectionDivider label="Registration & Insurance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="RC Number" placeholder="RC987..."
          leftIcon={<FiFileText />}
          {...register('vehicle_registration_certificate_number')}
        />
        <Input
          label="RC Expiry" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_registration_certificate_expiry_date')}
        />
        <Input
          label="Insurance Company" placeholder="ICICI Lombard"
          leftIcon={<FiShield />}
          {...register('vehicle_insurance_company_name')}
        />
        <Input
          label="Policy Number" placeholder="INS987..."
          leftIcon={<FiFileText />}
          {...register('vehicle_insurance_policy_number')}
        />
        <Input
          label="Policy Date" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_insurance_policy_date')}
        />
        <Input
          label="Insurance Expiry" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_insurance_expiry_date')}
        />
      </div>

      {/* ── Certificates ───────────────────────────────────── */}
      <SectionDivider label="Certificates" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-zinc-800">Pollution (PUC)</span>
          <Input placeholder="PUC Certificate No." {...register('vehicle_pollution_under_control_certificate_number')} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" hint="Issue"
              {...register('vehicle_pollution_under_control_certificate_issue_date')}
            />
            <Input type="date" hint="Expiry"
              {...register('vehicle_pollution_under_control_certificate_expiry_date')}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-zinc-800">Fitness Certificate</span>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" hint="Issue"
              {...register('vehicle_fitness_certificate_issue_date')}
            />
            <Input type="date" hint="Expiry"
              {...register('vehicle_fitness_certificate_expiry_date')}
            />
          </div>
        </div>
      </div>

      {/* ── Permit & Operations ─────────────────────────────── */}
      <SectionDivider label="Permit & Operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* <Controller control={control} name="vehicle_permit_type"
          render={({ field }) => <Select label="Permit Type" options={PERMIT_TYPES} {...field} />}
        /> */}
        <Input
          label="Owner Name" placeholder="John Doe"
          leftIcon={<FiUser />}
          {...register('vehicle_owner_name')}
        />
        {/* <Input
          label="Permit Issue" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_permit_issue_date')}
        /> */}
        {/* <Input
          label="Permit Expiry" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_permit_expiry_date')}
        /> */}
        <Input
          label="Vehicle Purchase Date" type="date"
          leftIcon={<FiCalendar />}
          {...register('vehicle_purchase_date')}
        />
        {/* <Input
          label="GPS Device ID" placeholder="GPS987..."
          leftIcon={<FiCpu />}
          {...register('vehicle_gps_device_id')}
        /> */}
      </div>

      {/* ── GPS / VTS Devices ───────────────────────────────── */}
      <SectionDivider label="GPS / VTS Devices" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="GPS Company" placeholder="SecureTrack Solutions" leftIcon={<FiCpu />} {...register('vehicle_gps_company')} />
        <Input label="GPS Device ID" placeholder="GPS-IND-9001" leftIcon={<FiCpu />} {...register('vehicle_gps_device_id')} />
        <Input label="GPS Expiry" type="date" leftIcon={<FiCalendar />} {...register('vehicle_gps_device_expiry_date')} />
        <div />
        <Input label="Mining GPS Device ID" placeholder="M-GPS-4455" leftIcon={<FiCpu />} {...register('vehicle_mining_gps_device_id')} />
        <Input label="Mining GPS Expiry" type="date" leftIcon={<FiCalendar />} {...register('vehicle_mining_gps_device_expiry_date')} />
        <Input label="VTS Device ID" placeholder="VTS-ID-9981" leftIcon={<FiCpu />} {...register('vehicle_vts_device_id')} />
        <Input label="VTS Expiry" type="date" leftIcon={<FiCalendar />} {...register('vehicle_vts_device_expiry_date')} />
      </div>

      {/* ── Andhra Permit & Tax ─────────────────────────────── */}
      <SectionDivider label="Andhra Permit & Tax" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller control={control} name="andhra_permit_status"
          render={({ field }) => (
            <Select label="Andhra Permit" options={[{ value: '', label: 'Select' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} {...field} />
          )}
        />
        {watch('andhra_permit_status') === 'yes' && (<>
          <Input label="Andhra Permit Issue Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_andhra_permit_issue_date')} />
          <Input label="Andhra Permit Expiry Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_andhra_permit_expiry_date')} />
          <FileUpload label="Andhra Permit File" fieldName="vehicle_andhra_permit_file" setValue={setValue} watch={watch} />
        </>)}
        <Input label="Andhra Tax (₹)" type="number" placeholder="2500" {...register('andhra_tax')} />
        <FileUpload label="Andhra Tax File" fieldName="andhra_tax_file" setValue={setValue} watch={watch} />
      </div>

      {/* ── Odisha Permit & Tax ─────────────────────────────── */}
      <SectionDivider label="Odisha Permit & Tax" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller control={control} name="odisha_permit_status"
          render={({ field }) => (
            <Select label="Odisha Permit" options={[{ value: '', label: 'Select' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} {...field} />
          )}
        />
        {watch('odisha_permit_status') === 'yes' && (<>
          <Input label="Odisha Permit Issue Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_odisha_permit_issue_date')} />
          <Input label="Odisha Permit Expiry Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_odisha_permit_expiry_date')} />
          <FileUpload label="Odisha Permit File" fieldName="vehicle_odisha_permit_file" setValue={setValue} watch={watch} />
        </>)}
        <Input label="Odisha Tax (₹)" type="number" placeholder="1850" {...register('odisha_tax')} />
        <FileUpload label="Odisha Tax File" fieldName="odisha_tax_file" setValue={setValue} watch={watch} />
      </div>

      {/* ── National Permit ─────────────────────────────────── */}
      <SectionDivider label="National Permit" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller control={control} name="national_permit_status"
          render={({ field }) => (
            <Select label="National Permit" options={[{ value: '', label: 'Select' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} {...field} />
          )}
        />
        {watch('national_permit_status') === 'yes' && (<>
          <Input label="National Permit Issue Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_national_permit_issue_date')} />
          <Input label="National Permit Expiry Date" type="date" leftIcon={<FiCalendar />} {...register('vehicle_national_permit_expiry_date')} />
          <FileUpload label="National Permit File" fieldName="vehicle_national_permit_file" setValue={setValue} watch={watch} />
        </>)}
      </div>

      {/* ── Assignment ──────────────────────────────────────── */}
      <SectionDivider label="Assignment" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller control={control} name="branch_id"
          render={({ field }) => (
            <Select label="Assign Branch" options={branchOptions} error={errors.branch_id?.message} {...field} />
          )}
        />
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Company</label>
          <div className={`flex items-center h-10 px-3 rounded-lg border text-sm transition-colors ${selectedCompany
            ? 'border-blue-200 bg-blue-50 text-blue-800 font-medium'
            : 'border-zinc-200 bg-zinc-50 text-zinc-400'}`}>
            {selectedCompany?.name || 'Auto-filled on branch select'}
          </div>
        </div>
      </div>

      {/* ── Documents & Images ──────────────────────────────── */}
      <SectionDivider label="Documents & Images" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FileUpload label="Vehicle Image" fieldName="vehicle_image" setValue={setValue} watch={watch} />
        <FileUpload label="RC File" fieldName="vehicle_registration_certificate_file" setValue={setValue} watch={watch} />
        <FileUpload label="Insurance File" fieldName="vehicle_insurance_file" setValue={setValue} watch={watch} />
        <FileUpload label="PUC Certificate" fieldName="vehicle_pollution_under_control_certificate_file" setValue={setValue} watch={watch} />
        <FileUpload label="Fitness Certificate" fieldName="vehicle_fitness_certificate_file" setValue={setValue} watch={watch} />
        <FileUpload label="Permit File" fieldName="vehicle_permit_file" setValue={setValue} watch={watch} />
      </div>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="flex justify-end pt-3 border-t border-zinc-100">
        <Button
          type="submit" loading={loading}
          className="min-w-[160px]"
          leftIcon={<FiCheckCircle size={16} />}
        >
          {isEdit ? 'Update Vehicle' : 'Create Vehicle'}
        </Button>
      </div>
    </form>
  )
}

