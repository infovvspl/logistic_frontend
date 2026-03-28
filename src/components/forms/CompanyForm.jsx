import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  )
}

export default function CompanyForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? {
      name: '', email: '', mobile: '',
      gst_no: '', cin_no: '', tin_no: '', pan_no: '', service_tax_no: '',
      pf: '', esis: '', esi: '', senior_allowance: '',
      account_no_1: '', bank_name: '', ifsc_code: '', swift_code: '', branch: '',
      account_no_2: '', bank_name_2: '', ifsc_code_2: '', swift_code_2: '', branch_2: '',
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

      <SectionDivider label="Basic Info" />
      <Input
        label="Company Name"
        placeholder="RS Transport Services"
        error={errors.name?.message}
        {...register('name', { required: 'Company name is required' })}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Email" placeholder="support@company.com" {...register('email')} />
        <Input label="Mobile" placeholder="9345678323" inputMode="numeric" {...register('mobile')} />
      </div>

      <SectionDivider label="Tax & Registration" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="GST No" placeholder="33DDDDD3333D4Z3" {...register('gst_no')} />
        <Input label="CIN No" placeholder="U44556TN2021PTC345378" {...register('cin_no')} />
        <Input label="TIN No" placeholder="5566778839" {...register('tin_no')} />
        <Input label="PAN No" placeholder="DDDDD3313D" {...register('pan_no')} />
        <Input label="Service Tax No" placeholder="ST335678" {...register('service_tax_no')} />
        <Input label="Senior Allowance" placeholder="5500" inputMode="numeric" {...register('senior_allowance')} />
      </div>

      <SectionDivider label="Compliance" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input label="PF" placeholder="PF33579" {...register('pf')} />
        <Input label="ESIS" placeholder="ESI13539" {...register('esis')} />
        <Input label="ESI" placeholder="ESI-DETAIL-123" {...register('esi')} />
      </div>

      <SectionDivider label="Bank Account 1" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Account No" placeholder="1234567890" inputMode="numeric" {...register('account_no_1')} />
        <Input label="Bank Name" placeholder="State Bank of India" {...register('bank_name')} />
        <Input label="IFSC Code" placeholder="SBIN0001234" {...register('ifsc_code')} />
        <Input label="SWIFT Code" placeholder="SBININBB" {...register('swift_code')} />
        <div className="md:col-span-2">
          <Input label="Branch" placeholder="Mumbai Main Branch" {...register('branch')} />
        </div>
      </div>

      <SectionDivider label="Bank Account 2" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Account No" placeholder="9876543210" inputMode="numeric" {...register('account_no_2')} />
        <Input label="Bank Name" placeholder="HDFC Bank" {...register('bank_name_2')} />
        <Input label="IFSC Code" placeholder="HDFC0001234" {...register('ifsc_code_2')} />
        <Input label="SWIFT Code" placeholder="HDFCINBB" {...register('swift_code_2')} />
        <div className="md:col-span-2">
          <Input label="Branch" placeholder="Delhi Branch" {...register('branch_2')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}
