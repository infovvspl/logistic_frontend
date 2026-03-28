import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiUser, FiTruck, FiCalendar, FiCheckCircle, FiX, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import * as rateChartAPI from '../../features/rateCharts/rateChartAPI.js'

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_TRANSIT', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  )
}

function SearchPicker({ label, icon: Icon, selected, selectedLabel, selectedSub, onClear, search, onSearch, children, error }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          <div className="flex items-center gap-2 font-medium min-w-0">
            <Icon size={14} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold truncate">{selectedLabel}</div>
              {selectedSub && <div className="text-xs text-blue-500 truncate">{selectedSub}</div>}
            </div>
          </div>
          <button type="button" onClick={onClear} className="ml-2 shrink-0 p-1 rounded hover:bg-blue-100 transition-colors">
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="max-h-36 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
            {children}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}

export default function TripForm({
  defaultValues,
  onSubmit,
  loading,
  customers = [],
  assignments = [],
  drivers = [],
  vehicles = [],
  places = [],
  consignments = [],
  metrics = [],
  rateCharts: rateChartsProp = [],
}) {
  const [form, setForm] = useState({
    customer_id: defaultValues?.customer_id ?? '',
    vehicle_assign_id: defaultValues?.vehicle_assign_id ?? defaultValues?.vehicle_assign_to_driver_id ?? '',
    source: defaultValues?.source ?? '',
    destination: defaultValues?.destination ?? '',
    consignment: defaultValues?.consignment ?? '',
    metrics: defaultValues?.metrics ?? '',
    quantity: defaultValues?.quantity ?? '',
    amount: defaultValues?.amount ?? '',
    start_date_time: defaultValues?.start_date_time
      ? new Date(defaultValues.start_date_time).toISOString().slice(0, 16)
      : '',
    end_date_time: defaultValues?.end_date_time
      ? new Date(defaultValues.end_date_time).toISOString().slice(0, 16)
      : '',
    status: defaultValues?.status ?? 'SCHEDULED',
  })
  const [errors, setErrors] = useState({})
  const [customerSearch, setCustomerSearch] = useState('')
  const [assignSearch, setAssignSearch] = useState('')
  // base rate per unit from matched rate chart
  const [baseRate, setBaseRate] = useState(null)

  // Always fetch live rate charts so new rates appear instantly without reopening the form
  const rateChartsQuery = useQuery({
    queryKey: ['rate-charts'],
    queryFn: rateChartAPI.listRateCharts,
    staleTime: 0,
    refetchInterval: 3000, // poll every 3s while form is open
  })
  const rateCharts = rateChartsQuery.data?.items ?? rateChartsProp

  // Find matching rate chart when source/destination/consignment/metrics change
  const findRate = (updatedForm) => {
    const { source, destination, consignment, metrics: metricsId } = updatedForm
    if (!source || !destination || !consignment || !metricsId) return null
    return rateCharts.find(
      (rc) =>
        String(rc.from_place) === String(source) &&
        String(rc.to_place) === String(destination) &&
        String(rc.metrics_id) === String(metricsId)
    ) ?? null
  }

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }

      // Recalculate rate when any of the 4 fields change
      if (['source', 'destination', 'consignment', 'metrics'].includes(key)) {
        const matched = findRate(next)
        if (matched) {
          setBaseRate(matched.rate)
          const qty = Number(next.quantity) || 1
          next.amount = String(matched.rate * qty)
        } else {
          setBaseRate(null)
          // only clear amount if it was auto-filled (baseRate was set)
          if (baseRate !== null) next.amount = ''
        }
      }

      // Recalculate amount when quantity changes and we have a base rate
      if (key === 'quantity') {
        const rate = baseRate ?? findRate(prev)?.rate
        if (rate) {
          setBaseRate(rate)
          const qty = Number(val) || 1
          next.amount = String(rate * qty)
        }
      }

      return next
    })
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  // Build assignment display labels
  const driverById = useMemo(() => {
    const map = new Map(); drivers.forEach(d => map.set(String(d.id), d)); return map
  }, [drivers])

  const vehicleById = useMemo(() => {
    const map = new Map(); vehicles.forEach(v => map.set(String(v.id), v)); return map
  }, [vehicles])

  const assignmentOptions = useMemo(() =>
    assignments.map(a => {
      const driver = driverById.get(String(a.driver_id || a.user_id))
      const vehicle = vehicleById.get(String(a.vehicle_id))
      return {
        ...a,
        label: vehicle ? vehicle.registration_number : `Assignment ${a.id}`,
        subLabel: driver?.name || 'No driver',
      }
    }), [assignments, driverById, vehicleById])

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      (c.customer_name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.customer_email || '').toLowerCase().includes(customerSearch.toLowerCase())
    ), [customers, customerSearch])

  const filteredAssignments = useMemo(() =>
    assignmentOptions.filter(a =>
      a.label.toLowerCase().includes(assignSearch.toLowerCase()) ||
      a.subLabel.toLowerCase().includes(assignSearch.toLowerCase())
    ), [assignmentOptions, assignSearch])

  const selectedCustomer = customers.find(c => String(c.id) === String(form.customer_id))
  const selectedAssignment = assignmentOptions.find(a => String(a.id) === String(form.vehicle_assign_id))

  const placeOptions = [{ value: '', label: 'Select place...' }, ...places.map(p => ({ value: p.id, label: p.name }))]
  const consignmentOptions = [{ value: '', label: 'Select consignment...' }, ...consignments.map(c => ({ value: c.id, label: c.name }))]
  const metricOptions = [{ value: '', label: 'Select metric...' }, ...metrics.map(m => ({ value: m.id, label: m.name }))]

  // Show "no rate chart" warning when source+destination+metrics are all set but no match found
  const noRateChart = !!(
    form.source && form.destination && form.metrics &&
    form.source !== form.destination &&
    !findRate(form)
  )

  const validate = () => {
    const e = {}
    if (!form.customer_id) e.customer_id = 'Customer is required'
    if (!form.vehicle_assign_id) e.vehicle_assign_id = 'Vehicle assignment is required'
    if (!form.source) e.source = 'Source is required'
    if (!form.destination) e.destination = 'Destination is required'
    if (form.source && form.source === form.destination) e.destination = 'Source and destination cannot be the same'
    if (!form.consignment) e.consignment = 'Consignment is required'
    if (!form.metrics) e.metrics = 'Metric is required'
    if (!form.start_date_time) e.start_date_time = 'Start date is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      ...form,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      amount: form.amount || '',
      end_date_time: form.end_date_time || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <SectionDivider label="People" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SearchPicker
          label="Customer" icon={FiUser}
          selected={!!selectedCustomer}
          selectedLabel={selectedCustomer?.customer_name}
          selectedSub={selectedCustomer?.customer_email}
          onClear={() => set('customer_id', '')}
          search={customerSearch} onSearch={setCustomerSearch}
          error={errors.customer_id}
        >
          {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
            <button key={c.id} type="button"
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => { set('customer_id', c.id); setCustomerSearch('') }}
            >
              <div className="font-medium text-zinc-900 text-sm">{c.customer_name}</div>
              {c.customer_email && <div className="text-xs text-zinc-400">{c.customer_email}</div>}
            </button>
          )) : <div className="p-3 text-center text-zinc-400 text-xs">No customers found</div>}
        </SearchPicker>

        <SearchPicker
          label="Vehicle Assignment" icon={FiTruck}
          selected={!!selectedAssignment}
          selectedLabel={selectedAssignment?.label}
          selectedSub={selectedAssignment?.subLabel}
          onClear={() => set('vehicle_assign_id', '')}
          search={assignSearch} onSearch={setAssignSearch}
          error={errors.vehicle_assign_id}
        >
          {filteredAssignments.length > 0 ? filteredAssignments.map(a => (
            <button key={a.id} type="button"
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => { set('vehicle_assign_id', a.id); setAssignSearch('') }}
            >
              <div className="font-medium text-zinc-900 text-sm">{a.label}</div>
              <div className="text-xs text-zinc-400">{a.subLabel}</div>
            </button>
          )) : <div className="p-3 text-center text-zinc-400 text-xs">No assignments found</div>}
        </SearchPicker>
      </div>

      <SectionDivider label="Route" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Source" options={placeOptions} value={form.source}
          onChange={(e) => set('source', e.target.value)} error={errors.source} />
        <Select label="Destination" options={placeOptions} value={form.destination}
          onChange={(e) => set('destination', e.target.value)} error={errors.destination} />
      </div>

      <SectionDivider label="Cargo" />
      {noRateChart && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <FiAlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">No rate chart found</p>
            <p className="text-xs text-amber-600 mt-0.5">
              No rate exists for this route + metric combination. Please{' '}
              <a href="/dashboard/rate-charts" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-amber-800">
                add it in Rate Charts
              </a>{' '}
              then click refresh.
            </p>
          </div>
          <button
            type="button"
            onClick={() => rateChartsQuery.refetch()}
            disabled={rateChartsQuery.isFetching}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50"
          >
            <FiRefreshCw size={13} className={rateChartsQuery.isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Consignment" options={consignmentOptions} value={form.consignment}
          onChange={(e) => set('consignment', e.target.value)} error={errors.consignment} />
        <Select label="Metric" options={metricOptions} value={form.metrics}
          onChange={(e) => set('metrics', e.target.value)} error={errors.metrics} />
        <Input label="Quantity" type="number" placeholder="e.g. 3"
          value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        <div className="space-y-1">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder={baseRate ? `Auto: ₹${baseRate} × qty` : 'e.g. 25000'}
            value={form.amount}
            onChange={(e) => { setBaseRate(null); set('amount', e.target.value) }}
          />
          {baseRate && (
            <p className="text-[11px] text-emerald-600 font-medium">
              ₹{baseRate.toLocaleString('en-IN')} × {Number(form.quantity) || 1} = ₹{Number(form.amount).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>

      <SectionDivider label="Schedule" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Start Date & Time" type="datetime-local"
          leftIcon={<FiCalendar />}
          value={form.start_date_time}
          onChange={(e) => set('start_date_time', e.target.value)}
          error={errors.start_date_time}
        />
        <Input label="End Date & Time" type="datetime-local"
          leftIcon={<FiCalendar />}
          value={form.end_date_time}
          onChange={(e) => set('end_date_time', e.target.value)}
        />
        <Select label="Status" options={STATUS_OPTIONS} value={form.status}
          onChange={(e) => set('status', e.target.value)} />
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {defaultValues ? 'Update Trip' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
