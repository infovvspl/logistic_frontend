import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function CustomerForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues:
      defaultValues ?? {
        customer_name: '',
        contact_person_name: '',
        customer_phone: '',
        contact_person_phone: '',
        customer_email: '',
        customer_address: '',
        customer_gst: '',
        customer_tan_number: '',
      },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Customer name"
        placeholder="ABC Pvt Ltd"
        error={errors.customer_name?.message}
        {...register('customer_name', { required: 'Customer name is required' })}
      />
      <Input
        label="Contact person name"
        placeholder="Rahul Sharma"
        error={errors.contact_person_name?.message}
        {...register('contact_person_name', { required: 'Contact person name is required' })}
      />
      <Input
        label="Customer phone"
        placeholder="9876543210"
        inputMode="numeric"
        error={errors.customer_phone?.message}
        {...register('customer_phone', { required: 'Customer phone is required' })}
      />
      <Input
        label="Contact person phone"
        placeholder="9123456780"
        inputMode="numeric"
        error={errors.contact_person_phone?.message}
        {...register('contact_person_phone', { required: 'Contact person phone is required' })}
      />
      <Input
        label="Customer email"
        placeholder="abc@company.com"
        error={errors.customer_email?.message}
        {...register('customer_email')}
      />
      <Input
        label="Customer address"
        placeholder="Delhi, India"
        error={errors.customer_address?.message}
        {...register('customer_address')}
      />
      <Input
        label="Customer GST"
        placeholder="22AAAAA0000A1Z5"
        error={errors.customer_gst?.message}
        {...register('customer_gst')}
      />
      <Input
        label="Customer TAN Number"
        placeholder="ABCD12345E"
        error={errors.customer_tan_number?.message}
        {...register('customer_tan_number')}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  )
}

