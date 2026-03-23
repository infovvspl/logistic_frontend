import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function RoleForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? { designation: '' },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Designation"
        placeholder="Super Admin"
        error={errors.designation?.message}
        {...register('designation', { required: 'Designation is required' })}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}

