import { useForm, Controller, useWatch } from 'react-hook-form'
import { useMemo, useEffect } from 'react'
import Input from '../ui/Input.jsx'
import PasswordInput from '../ui/PasswordInput.jsx'
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
]

// These fields will be mapped to the nested userData/driverData on submit
const USER_FIELDS = [
  'name', 'email', 'mobile', 'password', 'date_of_birth', 'gender',
  'aadhar_number', 'pan_number', 'passport_number', 'status',
  'emergency_contact_number', 'emergency_contact_name', 'emergency_contact_relationship',
  'permanent_address', 'current_address'
]

const DRIVER_FIELDS = [
  'license_number', 'license_type', 'license_issue_date', 'license_expiry_date',
  'year_of_experience', 'preferred_vehicle_type'
]

export default function DriverForm({ defaultValues, onSubmit, loading }) {
  const isEdit = !!defaultValues

  const processedDefaults = useMemo(() => {
    if (!defaultValues) return null;

    const src = JSON.parse(JSON.stringify(defaultValues)); // deep clone to be safe

    // Helper: try multiple paths (nested or flat)
    const get = (possiblePaths, defaultVal = '') => {
      const paths = Array.isArray(possiblePaths) ? possiblePaths : [possiblePaths];
      for (const path of paths) {
        const parts = path.split('.');
        let val = src;
        for (const p of parts) {
          val = val?.[p];
          if (val === undefined || val === null) break;
        }
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
      return defaultVal;
    };

    const flat = {};

    // ── Main fields ─────────────────────────────────────────────────────
    flat.name = get(['user_data.name', 'userData.name', 'user.name', 'data.name', 'name']);
    flat.email = get(['user_data.email', 'userData.email', 'user.email', 'data.email', 'email']);
    flat.mobile = get(['user_data.mobile', 'userData.mobile', 'user.mobile', 'data.mobile', 'mobile', 'phone']);
    flat.status = (get(['user_data.status', 'userData.status', 'user.status', 'data.status', 'status']) || 'ACTIVE').toUpperCase();

    // License / Driver professional
    flat.license_number = get([
      'driver_data.license_number',
      'driverData.license_number',
      'driver.license_number',
      'data.license_number',
      'data.license_id',
      'license_number',
      'licenseId'
    ]);
    flat.license_type = get(['driver_data.license_type', 'driverData.license_type', 'driver.license_type', 'data.license_type', 'license_type']);
    flat.license_issue_date = get(['driver_data.license_issue_date', 'driverData.license_issue_date', 'driver.license_issue_date', 'data.license_issue_date', 'license_issue_date']);
    flat.license_expiry_date = get(['driver_data.license_expiry_date', 'driverData.license_expiry_date', 'driver.license_expiry_date', 'data.license_expiry_date', 'license_expiry_date']);
    flat.year_of_experience = get(['driver_data.year_of_experience', 'driverData.year_of_experience', 'driver.year_of_experience', 'data.year_of_experience', 'year_of_experience', 'experience']) ?? '';
    flat.preferred_vehicle_type = get(['driver_data.preferred_vehicle_type', 'driverData.preferred_vehicle_type', 'driver.preferred_vehicle_type', 'data.preferred_vehicle_type', 'preferred_vehicle_type']) || 'Truck';

    // Personal / KYC / Emergency (most likely missing from this endpoint)
    flat.date_of_birth = get(['user_data.date_of_birth', 'userData.date_of_birth', 'user.date_of_birth', 'data.date_of_birth', 'dob']);
    flat.gender = (get(['user_data.gender', 'userData.gender', 'user.gender', 'data.gender', 'gender']) || 'MALE').toUpperCase();
    flat.aadhar_number = get(['user_data.aadhar_number', 'userData.aadhar_number', 'user.aadhar_number', 'data.aadhar_number', 'aadhar']);
    flat.pan_number = get(['user_data.pan_number', 'userData.pan_number', 'user.pan_number', 'data.pan_number', 'pan']);
    flat.passport_number = get(['user_data.passport_number', 'userData.passport_number', 'user.passport_number', 'data.passport_number', 'passport_number']);
    flat.emergency_contact_name = get(['user_data.emergency_contact_name', 'userData.emergency_contact_name', 'user.emergency_contact_name', 'data.emergency_contact_name', 'emergency_contact_name']);
    flat.emergency_contact_relationship = get(['user_data.emergency_contact_relationship', 'userData.emergency_contact_relationship', 'user.emergency_contact_relationship', 'data.emergency_contact_relationship', 'emergency_contact_relationship']);
    flat.emergency_contact_number = get(['user_data.emergency_contact_number', 'userData.emergency_contact_number', 'user.emergency_contact_number', 'data.emergency_contact_number', 'emergency_contact_number']);
    flat.current_address = get(['user_data.current_address', 'userData.current_address', 'user.current_address', 'data.current_address', 'address', 'current_address']);
    flat.permanent_address = get(['user_data.permanent_address', 'userData.permanent_address', 'user.permanent_address', 'data.permanent_address', 'permanent_address']);

    // ── Format dates for input type="date" ──────────────────────────────
    const formatDate = (v) => {
      if (v === undefined || v === null || v === '') return ''

      // Common API formats: "YYYY-MM-DD" or "DD-MM-YYYY"
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

    flat.date_of_birth = formatDate(flat.date_of_birth);
    flat.license_issue_date = formatDate(flat.license_issue_date);
    flat.license_expiry_date = formatDate(flat.license_expiry_date);

    return flat;
  }, [defaultValues]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: processedDefaults || {
      name: '', email: '', mobile: '', password: '', date_of_birth: '', gender: 'MALE',
      aadhar_number: '', pan_number: '', passport_number: '', status: 'ACTIVE',
      emergency_contact_number: '', emergency_contact_name: '', emergency_contact_relationship: '',
      permanent_address: '', current_address: '',
      license_number: '', license_type: '', license_issue_date: '', license_expiry_date: '',
      year_of_experience: '', preferred_vehicle_type: 'Truck'
    }
  })

  // 1. Make sure reset is called after processedDefaults changes
  useEffect(() => {
    if (processedDefaults) {
      // Reset with explicit options to force update
      reset(
        {
          ...processedDefaults,
          // Explicitly ensure these are set (sometimes helps with controlled inputs)
          gender: processedDefaults.gender || 'MALE',
          status: processedDefaults.status || 'ACTIVE',
          preferred_vehicle_type: processedDefaults.preferred_vehicle_type || 'Truck',
        },
        {
          keepDefaultValues: false,
          keepDirty: false,
          keepErrors: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepValues: false,           // ← important: force overwrite existing values
        }
      );
    }
  }, [processedDefaults, reset]);

  const aadhar   = useWatch({ control, name: 'aadhar_number' })   ?? ''
  const pan      = useWatch({ control, name: 'pan_number' })      ?? ''
  const passport = useWatch({ control, name: 'passport_number' }) ?? ''

  const charHint = (len, max) => (
    <span className={len === max ? 'text-xs text-rose-500 font-medium' : 'text-xs text-zinc-400'}>
      {len}/{max}
    </span>
  )

  const internalSubmit = (data) => {
    // Re-structure to the nested JSON the API expects
    const payload = {
      user_data: {},
      driver_data: {}
    }

    USER_FIELDS.forEach(f => {
      if (data[f] !== '' && data[f] !== null && data[f] !== undefined) {
        payload.user_data[f] = (f === 'emergency_contact_number') ? Number(data[f]) : data[f]
      }
    })

    DRIVER_FIELDS.forEach(f => {
      if (data[f] !== '' && data[f] !== null && data[f] !== undefined) {
        payload.driver_data[f] = (f === 'year_of_experience') ? Number(data[f]) : data[f]
      }
    })

    // Don't send password if editing and empty
    if (!!defaultValues && !data.password) delete payload.user_data.password

    onSubmit(payload)
  }

  return (
    <form className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-4" onSubmit={handleSubmit(internalSubmit)}>
      {/* Account Info */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Account Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" placeholder="Full Name" error={errors.name?.message} {...register('name', { required: 'Name required' })} />
          <Input label="Email" type="email" disabled={isEdit} placeholder="email@example.com" error={errors.email?.message} {...register('email', {
            required: 'Email required',
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
          })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Mobile" disabled={isEdit} placeholder="9876543210" error={errors.mobile?.message} {...register('mobile', {
            required: 'Mobile required',
            pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' },
          })} />
          {!isEdit && (
            <PasswordInput label="Password" placeholder="••••••••" error={errors.password?.message} {...register('password', { required: 'Password required' })} />
          )}
          {isEdit && (
            <PasswordInput label="Password" placeholder="Leave blank to keep current" {...register('password')} />
          )}
        </div>
      </section>

      {/* Personal Details */}
      <section className="space-y-4 pt-4 border-t border-zinc-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller control={control} name="date_of_birth" render={({ field }) => (
            <Input label="Date of Birth" type="date" {...field} />
          )} />
          <Controller control={control} name="gender" render={({ field }) => (
            <Select label="Gender" options={GENDER_OPTIONS} {...field} />
          )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Aadhar" placeholder="12-digit number" hint={charHint(aadhar.length, 12)} maxLength={12} error={errors.aadhar_number?.message} {...register('aadhar_number', {
            validate: (v) => !v || /^\d{12}$/.test(v) || 'Must be exactly 12 digits',
          })} />
          <Input label="PAN" placeholder="ABCDE1234F" hint={charHint(pan.length, 10)} maxLength={10} error={errors.pan_number?.message} {...register('pan_number', {
            validate: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) || 'Invalid PAN (e.g. ABCDE1234F)',
          })} />
          <Input label="Passport" placeholder="Z1234567" hint={charHint(passport.length, 8)} maxLength={8} error={errors.passport_number?.message} {...register('passport_number', {
            validate: (v) => !v || /^[A-Z0-9]{1,8}$/.test(v) || 'Max 8 alphanumeric characters',
          })} />
        </div>
      </section>

      {/* License Info */}
      <section className="space-y-4 pt-4 border-t border-zinc-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">License & Professional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="License Number" placeholder="DL-..." {...register('license_number', { required: 'Required' })} error={errors.license_number?.message} />
          <Input label="Vehicle Class" placeholder="e.g. LMV" {...register('license_type')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Issue Date" type="date" {...register('license_issue_date')} />
          <Input label="Expiry Date" type="date" {...register('license_expiry_date')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Experience" type="number" {...register('year_of_experience')} />
          <Controller control={control} name="preferred_vehicle_type" render={({ field }) => (
            <Select label="Preferred Vehicle" options={VEHICLE_TYPES} {...field} />
          )} />
        </div>
      </section>

      {/* Address & Emergency */}
      <section className="space-y-4 pt-4 border-t border-zinc-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Emergency & Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Emergency Contact" placeholder="Name" {...register('emergency_contact_name')} />
          <Input label="Relationship" placeholder="Spouse" {...register('emergency_contact_relationship')} />
          <Input label="Contact Mobile" placeholder="Mobile" {...register('emergency_contact_number')} />
        </div>
        <Textarea label="Current Address" placeholder="Enter address..." {...register('current_address')} />
        <Textarea label="Permanent Address" placeholder="Enter address..." {...register('permanent_address')} />
      </section>

      <div className="flex justify-end pt-6 sticky bottom-0 bg-white border-t border-zinc-100 pb-2">
        <Button type="submit" loading={loading} className="w-full md:w-auto min-w-[140px]">
          {isEdit ? 'Update Driver' : 'Create Driver'}
        </Button>
      </div>
    </form>
  )
}