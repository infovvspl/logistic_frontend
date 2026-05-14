import { useState } from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function ShiftForm({ defaultValues, onSubmit, loading, serverError = null }) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    shift_name: defaultValues?.shift_name ?? '',
    start_time: defaultValues?.start_time ?? '',
    end_time:   defaultValues?.end_time   ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.shift_name) e.shift_name = 'Shift name is required'
    if (!form.start_time) e.start_time = 'Start time is required'
    if (!form.end_time)   e.end_time   = 'End time is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-4">
        <Input 
          label="Shift Name" 
          placeholder="e.g., Morning Shift"
          value={form.shift_name} 
          onChange={(e) => set('shift_name', e.target.value)}
          error={errors.shift_name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Start Time" 
            type="time"
            step="1"
            value={form.start_time} 
            onChange={(e) => set('start_time', e.target.value)}
            error={errors.start_time}
          />
          <Input 
            label="End Time" 
            type="time"
            step="1"
            value={form.end_time} 
            onChange={(e) => set('end_time', e.target.value)}
            error={errors.end_time}
          />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button 
          type="submit" 
          loading={loading} 
          className="min-w-[160px]" 
          leftIcon={<FiCheckCircle size={16} />}
        >
          {isEdit ? 'Update Shift' : 'Create Shift'}
        </Button>
      </div>
    </form>
  )
}
