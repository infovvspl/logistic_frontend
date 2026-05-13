import { useState, useMemo } from 'react'
import { FiSearch, FiX, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const UNIT_OPTIONS = [
  { value: '', label: 'Select unit...' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'litre', label: 'Litre' },
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
]

function VehiclePicker({ label, vehicles, selectedId, onSelect, onClear }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return vehicles.filter((v) =>
      (v.registration_number ?? '').toLowerCase().includes(q) || (v.vehicle_model ?? '').toLowerCase().includes(q)
    )
  }, [vehicles, search])

  const selected = vehicles.find((v) => String(v.id) === String(selectedId))

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label} <span className="text-rose-500">*</span></span>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          <div>
            <div className="font-semibold">{selected.registration_number}</div>
            <div className="text-xs text-blue-400">{selected.vehicle_model || ''}</div>
          </div>
          <button type="button" onClick={onClear} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input type="text" placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
            {filtered.length > 0 ? filtered.map((v) => (
              <button key={v.id} type="button"
                className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                onClick={() => { onSelect(v); setSearch('') }}>
                <div className="font-medium text-zinc-900">{v.registration_number}</div>
                <div className="text-xs text-zinc-400">{v.vehicle_model || ''}</div>
              </button>
            )) : <div className="p-3 text-center text-zinc-400 text-xs">No vehicles found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductTransferForm({
  defaultValues, onSubmit, loading, serverError = null,
  products = [], vehicles = [],
}) {
  const { user } = useAuth()
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    product_id: defaultValues?.product_id ?? '',
    unit:       defaultValues?.unit       ?? '',
    quantity:   defaultValues?.quantity   ?? '',
    given_to_vehicle:   defaultValues?.given_to_vehicle   ?? '',
    given_to_vehicle_name: defaultValues?.given_to_vehicle_name ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const productOptions = [{ value: '', label: 'Select product...' }, ...products.map((p) => ({ value: p.id, label: p.product_name }))]

  const validate = () => {
    const e = {}
    if (!form.product_id) e.product_id = 'Product is required'
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter a valid quantity'
    if (!form.given_to_vehicle) e.given_to_vehicle = 'Select a vehicle'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      ...form,
      given_from: user?.id || user?._id || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      {/* Product & quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Select label="Product" options={productOptions}
            value={form.product_id} onChange={(e) => set('product_id', e.target.value)} />
          {errors.product_id && <p className="text-xs text-rose-600 font-medium">{errors.product_id}</p>}
        </div>
        <Select label="Unit" options={UNIT_OPTIONS}
          value={form.unit} onChange={(e) => set('unit', e.target.value)} />
        <div className="sm:col-span-2 space-y-1">
          <Input label="Quantity" type="number" placeholder="50"
            value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          {errors.quantity && <p className="text-xs text-rose-600 font-medium">{errors.quantity}</p>}
        </div>
      </div>

      {/* Transfer to vehicle */}
      <div className="space-y-1">
        <VehiclePicker label="Given To Vehicle" vehicles={vehicles} selectedId={form.given_to_vehicle}
          onSelect={(v) => {
            set('given_to_vehicle', v.id)
            set('given_to_vehicle_name', v.registration_number)
          }}
          onClear={() => {
            set('given_to_vehicle', '')
            set('given_to_vehicle_name', '')
          }} />
        {errors.given_to_vehicle && <p className="text-xs text-rose-600 font-medium">{errors.given_to_vehicle}</p>}
      </div>

      {/* Transfer summary */}
      {form.given_to_vehicle_name && form.quantity && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
          <FiArrowRight size={13} />
          {form.quantity} {form.unit || 'units'} of product → {form.given_to_vehicle_name}
        </div>
      )}

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Transfer' : 'Create Transfer'}
        </Button>
      </div>
    </form>
  )
}
