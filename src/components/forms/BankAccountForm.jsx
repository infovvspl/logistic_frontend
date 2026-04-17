import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function BankAccountForm({ defaultValues, companyId, companies, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? {
      company_id: companyId ?? '',
      bank_name: '',
      account_no: '',
      ifsc_code: '',
      swift_code: '',
      branch: '',
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!companyId && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-zinc-700">Company</label>
          <select
            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            {...register('company_id', { required: 'Target company is required' })}
          >
            <option value="">-- Select Company --</option>
            {companies?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.company_id && <span className="text-red-500 text-xs font-semibold">{errors.company_id.message}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Bank Name"
          placeholder="HDFC Bank"
          error={errors.bank_name?.message}
          {...register('bank_name', { required: 'Bank name is required' })}
        />
        <Input
          label="Account No"
          placeholder="4589658457"
          inputMode="numeric"
          error={errors.account_no?.message}
          {...register('account_no', { required: 'Account number is required' })}
        />
        <Input
          label="IFSC Code"
          placeholder="HDFC0001234"
          {...register('ifsc_code')}
        />
        <Input
          label="SWIFT Code"
          placeholder="HDFCINBB"
          {...register('swift_code')}
        />
        <div className="md:col-span-2">
          <Input
            label="Branch"
            placeholder="PATIA"
            {...register('branch')}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Update Account' : 'Register Account'}
        </Button>
      </div>
    </form>
  )
}
