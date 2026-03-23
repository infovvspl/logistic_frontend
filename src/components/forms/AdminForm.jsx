import { useForm, useWatch } from 'react-hook-form'
import { useMemo } from 'react'
import { User, ShieldCheck, MapPin, PhoneCall, CreditCard } from 'lucide-react' // Added for professional touch
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

export default function AdminForm({ defaultValues, onSubmit, loading }) {
  const processedDefaults = useMemo(() => {
    if (!defaultValues) return null
    const vals = { ...defaultValues }
    if (vals.date_of_birth) {
      try {
        const d = new Date(vals.date_of_birth)
        if (!isNaN(d.getTime())) {
          vals.date_of_birth = d.toISOString().split('T')[0]
        }
      } catch (e) {
        console.error('Invalid date format:', vals.date_of_birth)
      }
    }
    return vals
  }, [defaultValues])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: processedDefaults ?? { 
      name: '', 
      email: '', 
      mobile: '', 
      password: '', 
      role: 'admin',
      date_of_birth: '',
      gender: 'MALE',
      aadhar_number: '',
      pan_number: '',
      passport_number: '',
      emergency_contact_number: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      permanent_address: '',
      current_address: '',
      fcm_token: 'sample_fcm_token_here',
      image: '',
      status: 'ACTIVE'
    },
  })

  const aadhar = useWatch({ control, name: 'aadhar_number' }) ?? ''
  const pan    = useWatch({ control, name: 'pan_number' })    ?? ''
  const passport = useWatch({ control, name: 'passport_number' }) ?? ''

  const charHint = (len, max) => (
    <span className={`text-[10px] tabular-nums ${len === max ? 'text-emerald-500 font-bold' : 'text-zinc-400'}`}>
      {len}/{max}
    </span>
  )

  // Section Header Component for consistency
  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-3">
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <form 
        className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden" 
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="p-8 space-y-10">
          
          {/* Basic Credentials */}
          <section>
            <SectionHeader 
              icon={User} 
              title="Basic Credentials" 
              subtitle="Primary account information and login details" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email"
                  }
                })}
              />
              <Input
                label="Mobile Number"
                placeholder="9876543210"
                error={errors.mobile?.message}
                {...register('mobile', {
                  required: 'Mobile is required',
                  pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' },
                })}
              />
              <PasswordInput
                label="Account Password"
                placeholder={defaultValues ? "Leave blank to keep current" : "••••••••"}
                error={errors.password?.message}
                {...register('password', !defaultValues ? { 
                  required: 'Password is required',
                  minLength: { value: 8, message: "At least 8 characters" },
                  validate: {
                    hasUpper: (v) => /[A-Z]/.test(v) || "One uppercase letter required",
                    hasLower: (v) => /[a-z]/.test(v) || "One lowercase letter required",
                    hasNumber: (v) => /[0-9]/.test(v) || "One number required",
                    hasSymbol: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || "One special character required"
                  }
                } : {})}
              />
            </div>
          </section>

          {/* Personal & ID */}
          <section>
            <SectionHeader 
              icon={ShieldCheck} 
              title="Identity & Personal" 
              subtitle="Verification and demographic details" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input
                label="Date of Birth"
                type="date"
                error={errors.date_of_birth?.message}
                {...register('date_of_birth', { required: 'DOB is required' })}
              />
              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                error={errors.gender?.message}
                {...register('gender', { required: 'Gender is required' })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <Input
                label="Aadhar Number"
                hint={charHint(aadhar.length, 12)}
                maxLength={12}
                error={errors.aadhar_number?.message}
                {...register('aadhar_number', {
                  validate: (v) => !v || /^\d{12}$/.test(v) || 'Invalid Aadhar',
                })}
              />
              <Input
                label="PAN Number"
                hint={charHint(pan.length, 10)}
                maxLength={10}
                error={errors.pan_number?.message}
                {...register('pan_number', {
                  validate: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) || 'Invalid PAN',
                })}
              />
              <Input
                label="Passport"
                hint={charHint(passport.length, 8)}
                maxLength={8}
                error={errors.passport_number?.message}
                {...register('passport_number', {
                  validate: (v) => !v || /^[A-Z0-9]{1,8}$/.test(v) || 'Invalid format',
                })}
              />
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <SectionHeader 
              icon={PhoneCall} 
              title="Emergency Contact" 
              subtitle="Who should we contact in case of urgency?" 
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Name" {...register('emergency_contact_name', { required: 'Required' })} />
              <Input label="Relationship" {...register('emergency_contact_relationship', { required: 'Required' })} />
              <Input label="Phone" {...register('emergency_contact_number', { required: 'Required' })} />
            </div>
          </section>

          {/* Address */}
          <section>
            <SectionHeader 
              icon={MapPin} 
              title="Address Details" 
              subtitle="Current and permanent residential information" 
            />
            <div className="space-y-4">
              <Textarea
                label="Current Address"
                rows={2}
                error={errors.current_address?.message}
                {...register('current_address', { required: 'Required' })}
              />
              <Textarea
                label="Permanent Address"
                rows={2}
                error={errors.permanent_address?.message}
                {...register('permanent_address', { required: 'Required' })}
              />
            </div>
          </section>

          {/* Settings */}
          <section className="flex flex-col md:flex-row gap-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="flex-1">
              <Select label="Account Status" options={STATUS_OPTIONS} {...register('status')} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-zinc-700 block mb-1.5">Administrative Role</label>
              <div className="px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 font-bold uppercase tracking-wider">
                Admin Access
              </div>
              <input type="hidden" {...register('role')} />
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-xs text-zinc-500 italic">Please ensure all information matches government IDs.</p>
          <Button type="submit" loading={loading} className="px-10 py-2.5 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
            {defaultValues ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  )
}