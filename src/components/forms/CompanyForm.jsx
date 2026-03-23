import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function CompanyForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues:
      defaultValues ?? {
        name: '',
        email: '',
        mobile: '',
        gst_no: '',
        cin_no: '',
        tin_no: '',
        account_no_1: '',
        account_no_2: '',
        pan_no: '',
        service_tax_no: '',
        pf: '',
        esis: '',
        senior_allowance: '',
      },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Company name"
        placeholder="RS Transport Services"
        error={errors.name?.message}
        {...register('name', { required: 'Company name is required' })}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Email" placeholder="support1@rstransport.com" {...register('email')} />
        <Input label="Mobile" placeholder="9345678323" inputMode="numeric" {...register('mobile')} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="GST No" placeholder="33DDDDD3333D4Z3" {...register('gst_no')} />
        <Input label="CIN No" placeholder="U44556TN2021PTC345378" {...register('cin_no')} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="TIN No" placeholder="5566778839" {...register('tin_no')} />
        <Input label="PAN No" placeholder="DDDDD3313D" {...register('pan_no')} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Account No 1" placeholder="321354987012" inputMode="numeric" {...register('account_no_1')} />
        <Input label="Account No 2" placeholder="789312345678" inputMode="numeric" {...register('account_no_2')} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Service Tax No" placeholder="ST335678" {...register('service_tax_no')} />
        <Input label="Senior allowance" placeholder="5500" inputMode="numeric" {...register('senior_allowance')} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="PF" placeholder="PF33579" {...register('pf')} />
        <Input label="ESIS" placeholder="ESI13539" {...register('esis')} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}

