import { useForm } from 'react-hook-form'
import { FiPackage, FiCheckCircle } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function ProductForm({ defaultValues, onSubmit, loading, serverError = null }) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? { product_name: '', stock: '', low_stock: '', hsn_code: '', part_number: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <Input label="Product Name" required placeholder="Cement Bag" leftIcon={<FiPackage />}
        error={errors.product_name?.message}
        {...register('product_name', { required: 'Product name is required' })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="HSN Code" placeholder="2523"
          error={errors.hsn_code?.message}
          {...register('hsn_code')} />
        <Input label="Part Number" placeholder="PN-001"
          error={errors.part_number?.message}
          {...register('part_number')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Stock" type="number" placeholder="500"
          error={errors.stock?.message}
          {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Must be ≥ 0' } })} />
        <Input label="Low Stock Threshold" type="number" placeholder="50"
          {...register('low_stock', { min: { value: 0, message: 'Must be ≥ 0' } })} />
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
