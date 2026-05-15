import { useState, useMemo, useCallback, useEffect } from 'react'
import { FiCheckCircle, FiSearch, FiX } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 shadow-sm shadow-orange-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-orange-100 to-transparent" />
    </div>
  )
}

const TRANSACTION_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
]

export default function ExpenseForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  transactionPurposes = [],
  customers = [],
  drivers = [],
  vehicles = [],
  companies = [],
}) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    transaction_type: defaultValues?.transaction_type ?? '',
    transaction_purpose: defaultValues?.transaction_purpose ?? '',
    expense_head: defaultValues?.expense_head ?? '',
    payer_type: 'company', // Always company
    payer_id: companies[0]?.id ?? '', // First company as default
    company_id: defaultValues?.company_id ?? '', // Backend may require explicit company_id
    bill_no: defaultValues?.bill_no ?? '',
    vehicle_id: defaultValues?.vehicle_id ?? '',
    customer_id: defaultValues?.customer_id ?? '',
    driver_id: defaultValues?.driver_id ?? '',
    credit_to: defaultValues?.credit_to ?? '',
    amount: defaultValues?.amount ?? '',
  })
  const [errors, setErrors] = useState({})

  // When companies load after mount, default payer/company if user hasn't chosen yet.
  // Keep edit mode untouched.
  useEffect(() => {
    if (isEdit) return
    if (form.payer_id) return
    const firstId = companies[0]?.id
    if (!firstId) return
    setForm((prev) => (prev.payer_id ? prev : { ...prev, payer_id: firstId, company_id: prev.company_id || firstId }))
  }, [companies, form.payer_id, form.company_id, isEdit])

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({
      ...e,
      [key]: '',
      ...(key === 'customer_id' || key === 'driver_id' ? { payee_id: '' } : null),
    }))
  }

  // Filter users to get only drivers
  const driverOptions = useMemo(() => {
    return drivers
      .filter(user => user.role?.toLowerCase().includes('driver') || user.license_number)
      .map(driver => ({
        value: driver.id,
        label: driver.name || driver.email || driver.id
      }))
  }, [drivers])

  // Customer picker
  const selectedCustomer = customers.find((c) => String(c.id) === String(form.customer_id))
  const [customerSearch, setCustomerSearch] = useState('')
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase()
    return customers.filter((c) =>
      (c.customer_name ?? '').toLowerCase().includes(q) ||
      (c.name ?? '').toLowerCase().includes(q) ||
      String(c.id).toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  // Driver picker
  const selectedDriver = drivers.find((d) => String(d.id) === String(form.driver_id))
  const [driverSearch, setDriverSearch] = useState('')
  const filteredDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase()
    return drivers.filter((d) =>
      (d.name ?? '').toLowerCase().includes(q) ||
      (d.email ?? '').toLowerCase().includes(q) ||
      String(d.id).toLowerCase().includes(q)
    ).filter(d => d.role?.toLowerCase().includes('driver') || d.license_number)
  }, [drivers, driverSearch])

  // Vehicle picker
  const selectedVehicle = vehicles.find((v) => String(v.id) === String(form.vehicle_id))
  const [vehicleSearch, setVehicleSearch] = useState('')
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase()
    return vehicles.filter((v) =>
      (v.registration_number ?? '').toLowerCase().includes(q) ||
      (v.vehicle_model ?? '').toLowerCase().includes(q) ||
      String(v.id).toLowerCase().includes(q)
    )
  }, [vehicles, vehicleSearch])

  // Company selector (always company as payer)
  const selectedCompany = companies.find((c) => String(c.id) === String(form.payer_id))

  const validate = () => {
    const e = {}
    if (!form.transaction_type) e.transaction_type = 'Required'
    if (!form.transaction_purpose) e.transaction_purpose = 'Required'
    if (!form.expense_head?.trim()) e.expense_head = 'Required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.payer_id) e.payer_id = 'Required'
    if (!form.driver_id && !form.customer_id) e.payee_id = 'Select a customer or driver'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    
    const payee_type = form.driver_id ? 'user' : 'customer'
    const payee_id = form.driver_id || form.customer_id

    const payload = {
      ...form,
      amount: Number(form.amount),
      payer_type: 'company',
      company_id: form.company_id || form.payer_id,
      payee_type,
      payee_id,
    }
    
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      
      <SectionDivider label="Expense Details" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select 
          label="Transaction Type" 
          options={TRANSACTION_TYPES}
          value={form.transaction_type} 
          onChange={(e) => set('transaction_type', e.target.value)}
          error={errors.transaction_type} 
        />
        <Input 
          label="Amount (₹)" 
          type="number" 
          placeholder="5000"
          value={form.amount} 
          onChange={(e) => set('amount', e.target.value)}
          error={errors.amount} 
        />
        <div className="sm:col-span-2">
          <Select
            label="Transaction Purpose"
            options={[{ value: '', label: 'Select purpose...' }, ...transactionPurposes.map((p) => ({ value: p.id, label: p.transaction_purpose_name })),]}
            value={form.transaction_purpose}
            onChange={(e) => set('transaction_purpose', e.target.value)}
            error={errors.transaction_purpose}
          />
        </div>
        <div className="sm:col-span-2">
          <Input 
            label="Expense Head" 
            placeholder="e.g., Fuel, Maintenance, Salary"
            value={form.expense_head} 
            onChange={(e) => set('expense_head', e.target.value)}
            error={errors.expense_head} 
          />
        </div>
        <div className="sm:col-span-2">
          <Input 
            label="Bill No" 
            placeholder="Optional bill number"
            value={form.bill_no} 
            onChange={(e) => set('bill_no', e.target.value)}
          />
        </div>
      </div>

      <SectionDivider label="Payer Information" />
      
      <div className="space-y-2"> 
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200"> 
          <div className="flex items-center gap-2"> 
            <span className="text-sm font-medium text-zinc-600">Payer:</span> 
            <span className="text-sm font-bold text-zinc-900">Company</span> 
            {selectedCompany && ( 
              <span className="text-sm text-zinc-700">({selectedCompany.name})</span> 
            )} 
          </div> 
        </div> 
        {companies.length > 1 && ( 
          <Select 
            label="Select Company" 
            options={companies.map(c => ({ value: c.id, label: c.name }))} 
            value={form.payer_id} 
            onChange={(e) => { set('payer_id', e.target.value); set('company_id', e.target.value) }} 
          /> 
        )} 
        {errors.payer_id && <p className="text-xs font-medium text-rose-600">{errors.payer_id}</p>}
      </div> 
 
      <SectionDivider label="Additional Information" /> 
 
      {/* Customer picker */} 
      <div className="space-y-1.5"> 
        <span className="text-sm font-medium text-zinc-800">Customer</span> 
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
            <div className="min-w-0">
              <div className="font-semibold">{selectedCustomer.customer_name || selectedCustomer.name}</div>
              <div className="text-xs text-orange-400">{selectedCustomer.customer_email || selectedCustomer.mobile || ''}</div>
            </div>
            <button type="button" onClick={() => set('customer_id', '')} className="ml-2 p-1 rounded hover:bg-orange-100">
              <FiX size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search customers..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
                value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredCustomers.length > 0 ? filteredCustomers.map((c) => (
                <button key={c.id} type="button"
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('customer_id', c.id); setCustomerSearch('') }}>
                  <div className="font-medium text-zinc-900">{c.customer_name || c.name}</div>
                  <div className="text-xs text-zinc-400">{c.customer_email || c.mobile || ''}</div>
                </button>
              )) : (
                <div className="p-3 text-center text-zinc-400 text-xs">No customers</div>
              )}
            </div>
          </div>
        )} 
        {errors.payee_id && <p className="text-xs font-medium text-rose-600">{errors.payee_id}</p>}
      </div> 

      {/* Vehicle picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Vehicle No</span>
        {selectedVehicle ? (
          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
            <div className="min-w-0">
              <div className="font-semibold">{selectedVehicle.registration_number}</div>
              <div className="text-xs text-orange-400">{[selectedVehicle.vehicle_manufacture_company, selectedVehicle.vehicle_model].filter(Boolean).join(' ')}</div>
            </div>
            <button type="button" onClick={() => set('vehicle_id', '')} className="ml-2 p-1 rounded hover:bg-orange-100">
              <FiX size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search vehicles..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
                value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredVehicles.length > 0 ? filteredVehicles.map((v) => (
                <button key={v.id} type="button"
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('vehicle_id', v.id); setVehicleSearch('') }}>
                  <div className="font-medium text-zinc-900">{v.registration_number}</div>
                  <div className="text-xs text-zinc-400">{[v.vehicle_manufacture_company, v.vehicle_model].filter(Boolean).join(' ')}</div>
                </button>
              )) : (
                <div className="p-3 text-center text-zinc-400 text-xs">No vehicles</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Driver picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Driver</span>
        {selectedDriver ? (
          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
            <div className="min-w-0">
              <div className="font-semibold">{selectedDriver.name}</div>
              <div className="text-xs text-orange-400">{selectedDriver.email || selectedDriver.mobile || ''}</div>
            </div>
            <button type="button" onClick={() => set('driver_id', '')} className="ml-2 p-1 rounded hover:bg-orange-100">
              <FiX size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search drivers..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
                value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredDrivers.length > 0 ? filteredDrivers.map((d) => (
                <button key={d.id} type="button"
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('driver_id', d.id); setDriverSearch('') }}>
                  <div className="font-medium text-zinc-900">{d.name}</div>
                  <div className="text-xs text-zinc-400">{d.email || d.mobile || ''}</div>
                </button>
              )) : (
                <div className="p-3 text-center text-zinc-400 text-xs">No drivers</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <Input 
          label="Credit To" 
          placeholder="Who should be credited for this expense"
          value={form.credit_to} 
          onChange={(e) => set('credit_to', e.target.value)}
        />
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </form>
  )
}
