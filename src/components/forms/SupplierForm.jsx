import { useForm } from 'react-hook-form'
import { FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiCheckCircle, FiCreditCard } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm shadow-blue-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
  )
}

export default function SupplierForm({ defaultValues, onSubmit, loading, serverError = null }) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? {
      supplier_name: '', contact_person_name: '', supplier_phone: '',
      contact_person_phone: '', supplier_email: '', supplier_address: '', supplier_gst_number: '',
      bank_name: '', account_no_1: '', ifsc_code: '', swift_code: '', branch: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">

      <SectionDivider label="Supplier Info" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input label="Supplier Name" required placeholder="ABC Traders" leftIcon={<FiUser />}
            error={errors.supplier_name?.message}
            {...register('supplier_name', { required: 'Supplier name is required' })} />
        </div>
        <Input label="Phone" placeholder="9876543210" inputMode="numeric" leftIcon={<FiPhone />}
          {...register('supplier_phone')} />
        <Input label="Email" placeholder="abc@traders.com" leftIcon={<FiMail />}
          {...register('supplier_email')} />
        <div className="sm:col-span-2">
          <Input label="Address" placeholder="Kolkata, West Bengal" leftIcon={<FiMapPin />}
            {...register('supplier_address')} />
        </div>
        <div className="sm:col-span-2">
          <Input label="GST Number" placeholder="22ABCDE1234F1Z5" leftIcon={<FiFileText />}
            {...register('supplier_gst_number')} />
        </div>
      </div>

      <SectionDivider label="Contact Person" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Contact Person Name" placeholder="Ramesh Kumar" leftIcon={<FiUser />}
          {...register('contact_person_name')} />
        <Input label="Contact Person Phone" placeholder="9123456780" inputMode="numeric" leftIcon={<FiPhone />}
          {...register('contact_person_phone')} />
      </div>

      <SectionDivider label="Bank Details" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Bank Name" placeholder="State Bank of India" leftIcon={<FiCreditCard />}
          {...register('bank_name')} />
        <Input label="Account Number" placeholder="1234567890" inputMode="numeric" leftIcon={<FiCreditCard />}
          {...register('account_no_1')} />
        <Input label="IFSC Code" placeholder="SBIN0001234" leftIcon={<FiFileText />}
          {...register('ifsc_code')} />
        <Input label="SWIFT Code" placeholder="SBININBB" leftIcon={<FiFileText />}
          {...register('swift_code')} />
        <div className="sm:col-span-2">
          <Input label="Branch" placeholder="MG Road Branch, Kolkata" leftIcon={<FiMapPin />}
            {...register('branch')} />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Supplier' : 'Create Supplier'}
        </Button>
      </div>
    </form>
  )
}
