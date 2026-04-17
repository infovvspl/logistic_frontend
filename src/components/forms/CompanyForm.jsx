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

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}
