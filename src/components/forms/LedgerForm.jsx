import { useState, useMemo, useCallback } from 'react'
import { FiCheckCircle, FiSearch, FiX, FiArrowRight } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm shadow-blue-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
  )
}

const TRANSACTION_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
]

const PAYER_PAYEE_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'customer', label: 'Customer' },
  { value: 'user', label: 'User (Admin / Accountant)' },
  { value: 'company', label: 'Company' },
]

function EntityPicker({ label, type, entities, selectedId, onSelect, onClear, getLabel, getSub }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!type || !entities[type]) return []
    const q = search.toLowerCase()
    return entities[type].filter((e) =>
      getLabel(type, e).toLowerCase().includes(q) ||
      String(e.id).toLowerCase().includes(q)
    )
  }, [type, entities, search, getLabel])

  const selected = type && entities[type]
    ? entities[type].find((e) => String(e.id) === String(selectedId))
    : null

  if (!type) return null

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          <div className="min-w-0">
            <div className="font-semibold">{getLabel(type, selected)}</div>
            {getSub && <div className="text-xs text-blue-400">{getSub(type, selected)}</div>}
          </div>
          <button type="button" onClick={onClear} className="ml-2 p-1 rounded hover:bg-blue-100">
            <FiX size={13} />
          </button>
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
            {filtered.length > 0 ? filtered.map((e) => (
              <button key={e.id} type="button"
                className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                onClick={() => { onSelect(e.id); setSearch('') }}>
                <div className="font-medium text-zinc-900">{getLabel(type, e)}</div>
                {getSub && <div className="text-xs text-zinc-400">{getSub(type, e)}</div>}
              </button>
            )) : (
              <div className="p-3 text-center text-zinc-400 text-xs">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LedgerForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  trips = [],
  tripMeta = {},
  bills = [],
  billByTripId = new Map(),
  customers = [],
  users = [],
  companies = [],
  transactionPurposes = [],
}) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    trip_id:          defaultValues?.trip_id          ?? '',
    bill_no:          defaultValues?.bill_no          ?? '',
    company_id:       defaultValues?.company_id       ?? '',
    payer_type:       defaultValues?.payer_type       ?? '',
    payer_id:         defaultValues?.payer_id         ?? '',
    payee_type:       defaultValues?.payee_type       ?? '',
    payee_id:         defaultValues?.payee_id         ?? '',
    amount:           defaultValues?.amount           ?? '',
    transaction_type: defaultValues?.transaction_type ?? '',
    transaction_purpose: defaultValues?.transaction_purpose ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      // reset entity id when type changes
      if (key === 'payer_type') next.payer_id = ''
      if (key === 'payee_type') next.payee_id = ''
      return next
    })
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  // entity maps by type
  const entities = useMemo(() => ({
    customer: customers,
    user: users,
    company: companies,
  }), [customers, users, companies])

  const getLabel = useCallback((type, e) => {
    if (type === 'customer') return e.customer_name || e.name || e.id
    if (type === 'user') return e.name || e.email || e.id
    if (type === 'company') return e.name || e.id
    return e.id
  }, [])

  const getSub = useCallback((type, e) => {
    if (type === 'customer') return e.customer_email || e.mobile || ''
    if (type === 'user') return e.email || e.role || ''
    if (type === 'company') return e.email || e.gst_no || ''
    return ''
  }, [])

  // trip display
  const selectedTrip = trips.find((t) => String(t.id) === String(form.trip_id))
  const [tripSearch, setTripSearch] = useState('')
  const filteredTrips = useMemo(() => {
    const q = tripSearch.toLowerCase()
    return trips.filter((t) => {
      const m = tripMeta[String(t.id)] ?? {}
      return (
        (m.label ?? '').toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)
      )
    })
  }, [trips, tripSearch, tripMeta])

  const handleTripSelect = (tripId) => {
    const bill = billByTripId.get(String(tripId))
    setForm((prev) => ({
      ...prev,
      trip_id: tripId,
      bill_no: bill ? bill.bill_no : prev.bill_no,
    }))
    setTripSearch('')
  }

  // bill display — form.bill_no now stores the bill_no string (e.g. "BILL-001")
  const selectedBill = bills.find((b) => String(b.bill_no) === String(form.bill_no))
  const [billSearch, setBillSearch] = useState('')
  const filteredBills = useMemo(() => {
    const q = billSearch.toLowerCase()
    return bills.filter((b) =>
      (b.bill_no ?? '').toLowerCase().includes(q) ||
      String(b.id).toLowerCase().includes(q)
    )
  }, [bills, billSearch])

  // company for this ledger entry
  const selectedCompany = companies.find((c) => String(c.id) === String(form.company_id))
  const [companySearch, setCompanySearch] = useState('')
  const filteredCompanies = useMemo(() => {
    const q = companySearch.toLowerCase()
    return companies.filter((c) => (c.name ?? '').toLowerCase().includes(q))
  }, [companies, companySearch])

  const validate = () => {
    const e = {}
    if (!form.payer_type) e.payer_type = 'Required'
    if (!form.payer_id) e.payer_id = 'Select a payer'
    if (!form.payee_type) e.payee_type = 'Required'
    if (!form.payee_id) e.payee_id = 'Select a payee'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.transaction_type) e.transaction_type = 'Required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, amount: Number(form.amount) }
    if (!payload.transaction_purpose) delete payload.transaction_purpose
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <SectionDivider label="Transaction" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Transaction Type" options={TRANSACTION_TYPES}
          value={form.transaction_type} onChange={(e) => set('transaction_type', e.target.value)}
          error={errors.transaction_type} />
        <Input label="Amount (₹)" type="number" placeholder="5000"
          value={form.amount} onChange={(e) => set('amount', e.target.value)}
          error={errors.amount} />
        <div className="sm:col-span-2">
          <Select
            label="Transaction Purpose"
            options={[{ value: '', label: 'Select purpose...' }, ...transactionPurposes.map((p) => ({ value: p.id, label: p.transaction_purpose_name }))]}
            value={form.transaction_purpose}
            onChange={(e) => set('transaction_purpose', e.target.value)}
          />
        </div>
      </div>

      <SectionDivider label="Payer → Payee" />

      {/* Payer */}
      <div className="space-y-2">
        <Select label="Payer Type" options={PAYER_PAYEE_TYPES}
          value={form.payer_type} onChange={(e) => set('payer_type', e.target.value)}
          error={errors.payer_type} />
        <EntityPicker
          label="Payer"
          type={form.payer_type}
          entities={entities}
          selectedId={form.payer_id}
          onSelect={(id) => set('payer_id', id)}
          onClear={() => set('payer_id', '')}
          getLabel={getLabel}
          getSub={getSub}
        />
        {errors.payer_id && <p className="text-xs text-rose-600 font-medium">{errors.payer_id}</p>}
      </div>

      {/* Arrow indicator */}
      {form.payer_type && form.payee_type && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600">
            <FiArrowRight size={13} /> Transfer
          </div>
        </div>
      )}

      {/* Payee */}
      <div className="space-y-2">
        <Select label="Payee Type" options={PAYER_PAYEE_TYPES}
          value={form.payee_type} onChange={(e) => set('payee_type', e.target.value)}
          error={errors.payee_type} />
        <EntityPicker
          label="Payee"
          type={form.payee_type}
          entities={entities}
          selectedId={form.payee_id}
          onSelect={(id) => set('payee_id', id)}
          onClear={() => set('payee_id', '')}
          getLabel={getLabel}
          getSub={getSub}
        />
        {errors.payee_id && <p className="text-xs text-rose-600 font-medium">{errors.payee_id}</p>}
      </div>

      <SectionDivider label="References (Optional)" />

      {/* Trip picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Trip</span>
        {selectedTrip ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div className="min-w-0">
              <div className="font-semibold">{(tripMeta[String(selectedTrip.id)]?.label) ?? selectedTrip.id}</div>
            </div>
            <button type="button" onClick={() => set('trip_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search trips..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={tripSearch} onChange={(e) => setTripSearch(e.target.value)} />
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredTrips.length > 0 ? filteredTrips.map((t) => {
                const m = tripMeta[String(t.id)] ?? {}
                return (
                  <button key={t.id} type="button"
                    className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                    onClick={() => handleTripSelect(t.id)}>
                    <div className="font-medium text-zinc-900 text-sm">{m.label || t.id}</div>
                  </button>
                )
              }) : <div className="p-3 text-center text-zinc-400 text-xs">No trips</div>}
            </div>
          </div>
        )}
      </div>

      {/* Bill picker */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-800">Bill</span>
          {form.trip_id && form.bill_no && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Auto-filled from trip</span>
          )}
        </div>
        {selectedBill ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <span className="font-semibold">{selectedBill.bill_no}</span>
            <button type="button" onClick={() => set('bill_no', '')} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search bills..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={billSearch} onChange={(e) => setBillSearch(e.target.value)} />
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredBills.length > 0 ? filteredBills.map((b) => (
                <button key={b.id} type="button"
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('bill_no', b.bill_no); setBillSearch('') }}>
                  <div className="font-medium text-zinc-900">{b.bill_no}</div>
                </button>
              )) : <div className="p-3 text-center text-zinc-400 text-xs">No bills</div>}
            </div>
          </div>
        )}
      </div>

      {/* Company picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Company</span>
        {selectedCompany ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <span className="font-semibold">{selectedCompany.name}</span>
            <button type="button" onClick={() => set('company_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search companies..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredCompanies.length > 0 ? filteredCompanies.map((c) => (
                <button key={c.id} type="button"
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('company_id', c.id); setCompanySearch('') }}>
                  <div className="font-medium text-zinc-900">{c.name}</div>
                  <div className="text-xs text-zinc-400">{c.email || ''}</div>
                </button>
              )) : <div className="p-3 text-center text-zinc-400 text-xs">No companies</div>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  )
}
