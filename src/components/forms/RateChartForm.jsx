import { useState } from 'react'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'

export default function RateChartForm({ defaultValues, onSubmit, loading, places = [], metrics = [] }) {
  const [form, setForm] = useState({
    metrics_id: defaultValues?.metrics_id ?? '',
    rate: defaultValues?.rate ?? '',
    from_place: defaultValues?.from_place ?? '',
    to_place: defaultValues?.to_place ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.metrics_id) e.metrics_id = 'Metric is required'
    if (!form.from_place) e.from_place = 'From place is required'
    if (!form.to_place) e.to_place = 'To place is required'
    if (form.from_place && form.from_place === form.to_place) e.to_place = 'From and To place cannot be the same'
    if (!form.rate || isNaN(Number(form.rate)) || Number(form.rate) <= 0) e.rate = 'Enter a valid rate'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSubmit({ ...form, rate: Number(form.rate) })
  }

  const placeOptions = [{ value: '', label: 'Select place...' }, ...places.map((p) => ({ value: p.id, label: p.name }))]
  const metricOptions = [{ value: '', label: 'Select metric...' }, ...metrics.map((m) => ({ value: m.id, label: m.name }))]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="From Place"
          options={placeOptions}
          value={form.from_place}
          onChange={(e) => set('from_place', e.target.value)}
          error={errors.from_place}
        />
        <Select
          label="To Place"
          options={placeOptions}
          value={form.to_place}
          onChange={(e) => set('to_place', e.target.value)}
          error={errors.to_place}
        />
        <Select
          label="Metric"
          options={metricOptions}
          value={form.metrics_id}
          onChange={(e) => set('metrics_id', e.target.value)}
          error={errors.metrics_id}
        />
        <Input
          label="Rate"
          type="number"
          placeholder="e.g. 25000"
          value={form.rate}
          onChange={(e) => set('rate', e.target.value)}
          error={errors.rate}
        />
      </div>
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <Button type="submit" loading={loading} className="w-full md:w-auto">
          {defaultValues ? 'Update Rate Chart' : 'Add Rate Chart'}
        </Button>
      </div>
    </form>
  )
}
