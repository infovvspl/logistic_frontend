import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function RepairForm({ defaultValues, vehicles, users, onSubmit, loading }) {
  const isEdit = !!defaultValues

  const processedDefaults = defaultValues ? {
    vehicle_id: defaultValues.vehicle_id || '',
    reported_by: defaultValues.reported_by || '',
    repair_type: defaultValues.repair_type || '',
    issue_description: defaultValues.issue_description || '',
    mechanic_name: defaultValues.mechanic_name || '',
    km: defaultValues.km || '',
    repair_cost: defaultValues.repair_cost || '',
    repair_start_date: formatDate(defaultValues.repair_start_date),
    repair_end_date: formatDate(defaultValues.repair_end_date),
    status: defaultValues.status || 'pending',
  } : null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: processedDefaults || {
      vehicle_id: '',
      reported_by: '',
      repair_type: '',
      issue_description: '',
      mechanic_name: '',
      km: '',
      repair_cost: '',
      repair_start_date: '',
      repair_end_date: '',
      status: 'pending',
    }
  })

  const vehicleOptions = vehicles?.map(v => ({ 
    value: v.id, 
    label: `${v.registration_number || 'N/A'}` 
    // label: `${v.registration_number || 'N/A'} - ${v.vehicle_model || 'Unknown Model'}` 
  })) || []
  const userOptions = users?.map(u => ({ value: u.id, label: u.name || 'Unknown User' })) || []

  const vehicleOptionsWithPlaceholder = [{ value: '', label: 'Select your vehicle' }, ...vehicleOptions]
  const userOptionsWithPlaceholder = [{ value: '', label: 'Select reporting person' }, ...userOptions]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Vehicle"
          options={vehicleOptionsWithPlaceholder}
          {...register('vehicle_id', { required: 'Vehicle is required' })}
          error={errors.vehicle_id?.message}
        />
        <Select
          label="Reported By"
          options={userOptionsWithPlaceholder}
          {...register('reported_by', { required: 'Reporter is required' })}
          error={errors.reported_by?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Repair Type"
          placeholder="Enter repair type"
          {...register('repair_type', { required: 'Repair type is required' })}
          error={errors.repair_type?.message}
        />
        <Input
          label="Mechanic Name"
          placeholder="Enter mechanic name"
          {...register('mechanic_name', { required: 'Mechanic name is required' })}
          error={errors.mechanic_name?.message}
        />
        <Input
          label="KM"
          type="number"
          placeholder="0"
          {...register('km', { valueAsNumber: true })}
          error={errors.km?.message}
        />
      </div>

      <Textarea
        label="Issue Description"
        placeholder="Describe the issue..."
        rows={3}
        {...register('issue_description', { required: 'Issue description is required' })}
        error={errors.issue_description?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Repair Cost (₹)"
          type="number"
          placeholder="0"
          {...register('repair_cost', { required: 'Repair cost is required', valueAsNumber: true })}
          error={errors.repair_cost?.message}
        />
        <Input
          label="Start Date"
          type="date"
          {...register('repair_start_date', { required: 'Start date is required' })}
          error={errors.repair_start_date?.message}
        />
        <Input
          label="End Date"
          type="date"
          {...register('repair_end_date')}
          error={errors.repair_end_date?.message}
        />
      </div>

      <Select
        label="Status"
        options={STATUS_OPTIONS}
        {...register('status', { required: 'Status is required' })}
        error={errors.status?.message}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          loading={loading}
        >
          {isEdit ? 'Update Repair' : 'Create Repair'}
        </Button>
      </div>
    </form>
  )
}
