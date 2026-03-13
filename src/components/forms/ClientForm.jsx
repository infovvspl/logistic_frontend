import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function ClientForm({ defaultValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? { name: '', contact: '' },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Client name"
        placeholder="Northwind"
        error={errors.name?.message}
        {...register('name', { required: 'Client name is required' })}
      />
      <Input
        label="Contact"
        placeholder="ops@northwind.test"
        error={errors.contact?.message}
        {...register('contact', { required: 'Contact is required' })}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Save
        </Button>
      </div>
    </form>
  )
}

