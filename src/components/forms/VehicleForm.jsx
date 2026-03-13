import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function VehicleForm({ defaultValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? { plate: '', type: '', status: 'Active' },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Plate"
        placeholder="RST-1042"
        error={errors.plate?.message}
        {...register('plate', { required: 'Plate is required' })}
      />
      <Input
        label="Type"
        placeholder="Van / Truck"
        error={errors.type?.message}
        {...register('type', { required: 'Type is required' })}
      />
      <Input label="Status" {...register('status')} />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Save
        </Button>
      </div>
    </form>
  )
}

