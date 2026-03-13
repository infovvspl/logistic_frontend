import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function DriverForm({ defaultValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? { name: '', phone: '' },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Name"
        placeholder="Driver name"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />
      <Input
        label="Phone"
        placeholder="+1 555 0101"
        error={errors.phone?.message}
        {...register('phone', { required: 'Phone is required' })}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Save
        </Button>
      </div>
    </form>
  )
}

