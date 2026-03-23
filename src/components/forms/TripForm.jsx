import { useForm, Controller } from 'react-hook-form'
import { useState, useMemo } from 'react'
import {
  FiSearch, FiUser, FiTruck, FiMapPin,
  FiCalendar, FiPackage, FiDollarSign, FiCheckCircle, FiX,
} from 'react-icons/fi'
import { FaRupeeSign } from "react-icons/fa";
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'

const STATUS_OPTIONS = [
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
]

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
        {label}
      </span>
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

export default function TripForm({ defaultValues, onSubmit, loading, customers = [], assignments = [], drivers = [], vehicles = [] }) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [assignmentSearch, setAssignmentSearch] = useState('')

  const driverMap = useMemo(() => {
    const map = new Map()
    drivers.forEach(d => map.set(String(d.id), d))
    return map
  }, [drivers])

  const vehicleMap = useMemo(() => {
    const map = new Map()
    vehicles.forEach(v => map.set(String(v.id), v))
    return map
  }, [vehicles])

  const assignmentOptions = useMemo(() => {
    return assignments
      .filter(a => a.status === 'ASSIGNED' || a.id === defaultValues?.vehicle_assign_to_driver_id)
      .map(a => {
        const driver = driverMap.get(String(a.user_id))
        const vehicle = vehicleMap.get(String(a.vehicle_id))
        return {
          ...a,
          label: vehicle ? `${vehicle.registration_number} (${driver?.name || 'No Driver'})` : `Assignment ${a.id}`,
          subLabel: `${vehicle?.vehicle_model || 'Unknown model'} · ${driver?.mobile || 'No mobile'}`,
        }
      })
  }, [assignments, driverMap, vehicleMap, defaultValues])

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      (c.customer_name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.customer_email || '').toLowerCase().includes(customerSearch.toLowerCase())
    ), [customers, customerSearch])

  const filteredAssignments = useMemo(() =>
    assignmentOptions.filter(a =>
      a.label.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.subLabel.toLowerCase().includes(assignmentSearch.toLowerCase())
    ), [assignmentOptions, assignmentSearch])

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? {
      customer_id: '',
      vehicle_assign_to_driver_id: '',
      source: '',
      destination: '',
      start_date_time: '',
      end_date_time: '',
      consignment: '',
      metrics: '',
      amount: '',
      status: 'ONGOING',
    },
  })

  const selectedCustomerId = watch('customer_id')
  const selectedAssignmentId = watch('vehicle_assign_to_driver_id')

  const selectedCustomer = useMemo(() =>
    customers.find(c => String(c.id) === String(selectedCustomerId)),
    [customers, selectedCustomerId])

  const selectedAssignment = useMemo(() =>
    assignmentOptions.find(a => String(a.id) === String(selectedAssignmentId)),
    [assignmentOptions, selectedAssignmentId])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">

      {/* ── People ──────────────────────────────────────────── */}
      <SectionDivider label="People" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SearchPicker
          label="Customer"
          icon={FiUser}
          selected={!!selectedCustomer}
          selectedLabel={selectedCustomer?.customer_name}
          selectedSub={selectedCustomer?.customer_email}
          onClear={() => setValue('customer_id', '')}
          search={customerSearch}
          onSearch={setCustomerSearch}
          error={errors.customer_id?.message}
        >
          {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
            <button key={c.id} type="button"
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => setValue('customer_id', c.id)}
            >
              <div className="font-medium text-zinc-900 text-sm">{c.customer_name}</div>
              {c.customer_email && <div className="text-xs text-zinc-400">{c.customer_email}</div>}
            </button>
          )) : (
            <div className="p-3 text-center text-zinc-400 text-xs">No customers found</div>
          )}
        </SearchPicker>

        <SearchPicker
          label="Vehicle & Driver"
          icon={FiTruck}
          selected={!!selectedAssignment}
          selectedLabel={selectedAssignment?.label}
          selectedSub={selectedAssignment?.subLabel}
          onClear={() => setValue('vehicle_assign_to_driver_id', '')}
          search={assignmentSearch}
          onSearch={setAssignmentSearch}
          error={errors.vehicle_assign_to_driver_id?.message}
        >
          {filteredAssignments.length > 0 ? filteredAssignments.map(a => (
            <button key={a.id} type="button"
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => setValue('vehicle_assign_to_driver_id', a.id)}
            >
              <div className="font-medium text-zinc-900 text-sm">{a.label}</div>
              <div className="text-xs text-zinc-400">{a.subLabel}</div>
            </button>
          )) : (
            <div className="p-3 text-center text-zinc-400 text-xs">No active assignments found</div>
          )}
        </SearchPicker>
      </div>

      <input type="hidden" {...register('customer_id', { required: 'Please select a customer' })} />
      <input type="hidden" {...register('vehicle_assign_to_driver_id', { required: 'Please select a vehicle assignment' })} />

      {/* ── Route ───────────────────────────────────────────── */}
      <SectionDivider label="Route" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Source" placeholder="Kolkata" required
          leftIcon={<FiMapPin />}
          error={errors.source?.message}
          {...register('source', { required: 'Required' })}
        />
        <Input
          label="Destination" placeholder="Delhi" required
          leftIcon={<FiMapPin />}
          error={errors.destination?.message}
          {...register('destination', { required: 'Required' })}
        />
      </div>

      {/* ── Schedule ────────────────────────────────────────── */}
      <SectionDivider label="Schedule" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Start Date & Time" type="datetime-local"
          leftIcon={<FiCalendar />}
          {...register('start_date_time')}
        />
        <Input
          label="End Date & Time" type="datetime-local"
          leftIcon={<FiCalendar />}
          {...register('end_date_time')}
        />
      </div>

      {/* ── Cargo & Financials ──────────────────────────────── */}
      <SectionDivider label="Cargo & Financials" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Consignment" placeholder="Electronics, Furniture..."
          leftIcon={<FiPackage />}
          {...register('consignment')}
        />
        <Input
          label="Metrics (KM / Weight)" placeholder="1500 KM"
          {...register('metrics')}
        />
        <Input
          label="Amount (₹)" type="number" placeholder="45000"
          leftIcon={<FaRupeeSign  />}
          {...register('amount')}
        />
        <Controller control={control} name="status"
          render={({ field }) => <Select label="Status" options={STATUS_OPTIONS} {...field} />}
        />
      </div>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="flex justify-end pt-3 border-t border-zinc-100">
        <Button
          type="submit" loading={loading}
          className="min-w-[160px]"
          leftIcon={<FiCheckCircle size={16} />}
        >
          {defaultValues ? 'Update Trip' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
