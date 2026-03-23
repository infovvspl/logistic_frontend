import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { cn } from '../../utils/helpers.js'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function BranchForm({ defaultValues, onSubmit, loading, submitLabel, companyId, companies }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues:
      defaultValues ?? {
        branch_name: '',
        branch_email: '',
        branch_phone: '',
        branch_address: '',
        company_id: companyId ?? '',
      },
  })

  useEffect(() => {
    if (companyId) setValue('company_id', companyId, { shouldValidate: true })
  }, [companyId, setValue])

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-zinc-800">Company</span>
        </div>
        <select
          className={cn(
            'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
            errors.company_id ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : '',
          )}
          {...register('company_id', { required: 'Company is required' })}
          defaultValue={companyId ?? defaultValues?.company_id ?? ''}
          onChange={(e) => setValue('company_id', e.target.value, { shouldValidate: true })}
        >
          <option value="" disabled>
            Select company
          </option>
          {(companies ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.company_id ? <div className="mt-1 text-xs text-rose-600">{errors.company_id.message}</div> : null}
      </label>

      <Input
        label="Branch name"
        placeholder="Kolkata Main Branch"
        error={errors.branch_name?.message}
        {...register('branch_name', { required: 'Branch name is required' })}
      />
      <Input label="Branch email" placeholder="kolkata@logistics.com" {...register('branch_email')} />
      <Input label="Branch phone" placeholder="9830012345" inputMode="numeric" {...register('branch_phone')} />
      <Input label="Branch address" placeholder="Salt Lake Sector V, Kolkata" {...register('branch_address')} />

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}

