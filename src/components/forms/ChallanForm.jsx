import { useState, useMemo, useRef } from 'react'
import { FiSearch, FiX, FiFileText, FiCalendar, FiCheckCircle, FiTruck, FiAlertTriangle, FiCreditCard } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

const ADVANCE_TYPES = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH_BOOK',     label: 'Cash Book' },
  { value: 'DRIVER',        label: 'Driver' },
]

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  )
}

function ReadOnlyField({ label, value, highlight }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className={`flex items-center h-10 px-3 rounded-lg border text-sm font-semibold transition-colors ${
        highlight === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
        highlight === 'red'     ? 'border-red-200 bg-red-50 text-red-800' :
        highlight === 'amber'   ? 'border-amber-200 bg-amber-50 text-amber-800' :
        value ? 'border-zinc-200 bg-zinc-50 text-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-400'
      }`}>
        {value || 'Auto-calculated'}
      </div>
    </div>
  )
}

function recalc(f, focusedDieselKey = null) {
  const next = { ...f }

  const loadingTon = Number(f.weight_at_loading)  || 0
  const unloadTon  = Number(f.weight_at_unloading) || 0
  if (loadingTon > 0 && unloadTon > 0) {
    next.shortage = String(Math.max(0, (loadingTon - unloadTon) * 1000))
  }

  // auto-calculate diesel: any 2 of 3 filled → compute the third
  // never overwrite the field currently being typed into (focusedDieselKey)
  const price = Number(f.diesel_price_per_litre) || 0
  const qty   = Number(f.diesel_quantity) || 0
  const adv   = Number(f.diesel_advance) || 0
  if (focusedDieselKey !== 'diesel_advance' && price > 0 && qty > 0) {
    next.diesel_advance = String((price * qty).toFixed(2))
  } else if (focusedDieselKey !== 'diesel_quantity' && adv > 0 && price > 0) {
    next.diesel_quantity = String((adv / price).toFixed(2))
  } else if (focusedDieselKey !== 'diesel_price_per_litre' && adv > 0 && qty > 0) {
    next.diesel_price_per_litre = String((adv / qty).toFixed(2))
  }

  const shortageKg   = Number(next.shortage) || 0
  const shortageRate = Number(f.shortage_rate) || 0
  next.shortage_amount = shortageKg > 150 && shortageRate > 0
    ? String((shortageKg * shortageRate).toFixed(2))
    : ''

  const total       = Number(f.total_amount) || 0
  const tdsPct      = Number(f.tds_percentage) || 0
  const cgstPct     = Number(f.cgst_percentage) || 0
  const sgstPct     = Number(f.sgst_percentage) || 0
  const dieselAdv   = Number(next.diesel_advance) || 0
  const driverAdv   = Number(f.advance) || 0
  const shortageAmt = Number(next.shortage_amount) || 0
  const otherExp    = Number(f.other_expense) || 0
  const advanceAmt  = Number(f.advance_amount) || 0

  next.tds_amount  = tdsPct  > 0 ? String(((total * tdsPct)  / 100).toFixed(2)) : ''
  next.cgst_amount = cgstPct > 0 ? String(((total * cgstPct) / 100).toFixed(2)) : ''
  next.sgst_amount = sgstPct > 0 ? String(((total * sgstPct) / 100).toFixed(2)) : ''

  const tdsAmt  = Number(next.tds_amount)  || 0
  const cgstAmt = Number(next.cgst_amount) || 0
  const sgstAmt = Number(next.sgst_amount) || 0

  next.balance = String(
    (total - tdsAmt - dieselAdv - driverAdv - shortageAmt - otherExp - advanceAmt + cgstAmt + sgstAmt).toFixed(2)
  )

  return next
}

export default function ChallanForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  trips = [],
  tripMeta = {},
  bankAccounts = [],
  companies = [],
}) {
  const isEdit = !!defaultValues
  const today = new Date().toISOString().slice(0, 10)

  // normalize any date value to YYYY-MM-DD
  const nd = (v) => {
    if (!v) return ''
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim()
    const d = new Date(v)
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }

  const [form, setForm] = useState(() => recalc({
    challan_no:          defaultValues?.challan_no          ?? '',
    bill_no:             defaultValues?.bill_no             ?? '',
    challan_date:        nd(defaultValues?.challan_date)    || today,
    trip_id:             defaultValues?.trip_id             ?? '',
    unloading_date:      nd(defaultValues?.unloading_date)  || '',
    permit_number:       defaultValues?.permit_number       ?? '',
    transport:           defaultValues?.transport           ?? '',
    vehicle_number:      defaultValues?.vehicle_number      ?? '',
    description:         defaultValues?.description         ?? '',
    hsn_code:            defaultValues?.hsn_code            ?? '',
    weight_at_loading:   defaultValues?.weight_at_loading   ?? '',
    weight_at_unloading: defaultValues?.weight_at_unloading ?? '',
    shortage:            defaultValues?.shortage            ?? '',
    shortage_rate:       defaultValues?.shortage_rate       ?? '',
    shortage_amount:     defaultValues?.shortage_amount     ?? '',
    total_amount:        defaultValues?.total_amount        ?? '',
    tds_percentage:      defaultValues?.tds_percentage      ?? '',
    tds_amount:          defaultValues?.tds_amount          ?? '',
    diesel_advance:      defaultValues?.diesel_advance      ?? '',
    diesel_price_per_litre: defaultValues?.diesel_price_per_litre ?? '',
    diesel_quantity:     defaultValues?.diesel_quantity     ?? '',
    advance:             defaultValues?.advance             ?? '',
    cgst_percentage:     defaultValues?.cgst_percentage     ?? '',
    cgst_amount:         defaultValues?.cgst_amount         ?? '',
    sgst_percentage:     defaultValues?.sgst_percentage     ?? '',
    sgst_amount:         defaultValues?.sgst_amount         ?? '',
    other_expense:       defaultValues?.other_expense       ?? '',
    balance:             defaultValues?.balance             ?? '',
    tc_date:             nd(defaultValues?.tc_date)         || '',
    remark:              defaultValues?.remark              ?? '',
    advance_type:        defaultValues?.advance_type        ?? '',
    advance_amount:      defaultValues?.advance_amount      ?? '',
    advance_date:        nd(defaultValues?.advance_date)    || '',
    advance_bank_account_id: defaultValues?.advance_bank_account_id ?? '',
  }))

  const [errors, setErrors] = useState({})
  const [tripSearch, setTripSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')
  const dieselFocusRef = useRef(null)

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'weight_at_unloading') {
        const m = prev.trip_id ? (tripMeta[String(prev.trip_id)] ?? {}) : {}
        const rate = Number(m.ratePerUnit)
        const unloadTon = Number(val)
        if (rate > 0 && unloadTon > 0) next.total_amount = String((unloadTon * rate).toFixed(2))
      }
      // clear account when switching away from bank transfer
      if (key === 'advance_type' && val !== 'BANK_TRANSFER') next.advance_bank_account_id = ''
      return recalc(next, dieselFocusRef.current)
    })
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  // fires on blur of a diesel field — calculates the missing third value
  const onDieselBlur = (key) => {
    setForm((prev) => recalc(calcDiesel(prev, key)))
  }

  const handleTripSelect = (tripId) => {
    const m = tripMeta[String(tripId)] ?? {}
    const rate = Number(m.ratePerUnit)
    const loadingWeight = m.quantity !== undefined && m.quantity !== '' ? String(m.quantity) : ''
    const unloadTon = Number(form.weight_at_unloading)
    let totalAmount
    if (rate > 0 && unloadTon > 0) totalAmount = String((unloadTon * rate).toFixed(2))
    else if (rate > 0 && Number(loadingWeight) > 0) totalAmount = String((Number(loadingWeight) * rate).toFixed(2))
    else totalAmount = m.tripAmount !== undefined && m.tripAmount !== '' ? String(m.tripAmount) : ''
    setForm((prev) => recalc({
      ...prev,
      trip_id:           tripId,
      vehicle_number:    m.vehicleNumber || prev.vehicle_number,
      unloading_date:    m.endDateTime   || prev.unloading_date,
      transport:         m.transport     || prev.transport,
      total_amount:      totalAmount,
      weight_at_loading: loadingWeight   || prev.weight_at_loading,
    }))
    setTripSearch('')
  }

  const selectedTrip = trips.find((t) => String(t.id) === String(form.trip_id))
  const meta = form.trip_id ? (tripMeta[String(form.trip_id)] ?? {}) : {}

  const uniqueFromPlaces = useMemo(() => Array.from(new Set(trips.map(t => tripMeta[String(t.id)]?.fromPlace).filter(Boolean))).sort(), [trips, tripMeta])
  const uniqueToPlaces = useMemo(() => Array.from(new Set(trips.map(t => tripMeta[String(t.id)]?.toPlace).filter(Boolean))).sort(), [trips, tripMeta])
  const uniqueCustomers = useMemo(() => Array.from(new Set(trips.map(t => tripMeta[String(t.id)]?.customerName).filter(Boolean))).sort(), [trips, tripMeta])

  const filteredTrips = useMemo(() => {
    const q = tripSearch.toLowerCase()
    return trips.filter((t) => {
      const m = tripMeta[String(t.id)] ?? {}
      if (filterFrom && m.fromPlace !== filterFrom) return false
      if (filterTo && m.toPlace !== filterTo) return false
      if (filterCustomer && m.customerName !== filterCustomer) return false

      if (q) {
        return (
          (m.fromPlace    ?? '').toLowerCase().includes(q) ||
          (m.toPlace      ?? '').toLowerCase().includes(q) ||
          (m.customerName ?? '').toLowerCase().includes(q) ||
          String(t.id).toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [trips, tripSearch, tripMeta, filterFrom, filterTo, filterCustomer])

  const shortageKg       = Number(form.shortage) || 0
  const showShortageRate = shortageKg > 150

  const validate = () => {
    const e = {}
    if (!form.challan_no.trim()) e.challan_no = 'Challan number required'
    if (!form.trip_id) e.trip_id = 'Trip is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form }
    const numFields = [
      'weight_at_loading', 'weight_at_unloading', 'shortage', 'shortage_rate', 'shortage_amount',
      'total_amount', 'tds_percentage', 'tds_amount', 'diesel_advance', 'advance',
      'diesel_price_per_litre', 'diesel_quantity',
      'cgst_percentage', 'cgst_amount', 'sgst_percentage', 'sgst_amount',
      'other_expense', 'advance_amount', 'balance',
    ]
    numFields.forEach((f) => {
      if (payload[f] !== '' && payload[f] !== undefined) payload[f] = Number(payload[f])
    })
    onSubmit(payload)
  }

  const fmt = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : ''

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <SectionDivider label="Challan Info" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Challan No." required placeholder="CH-2024-001" leftIcon={<FiFileText />}
          value={form.challan_no} onChange={(e) => set('challan_no', e.target.value)} error={errors.challan_no} />
        <Input label="Bill No." placeholder="BILL-001" leftIcon={<FiFileText />}
          value={form.bill_no} onChange={(e) => set('bill_no', e.target.value)} />
        <Input label="Challan Date" type="date" leftIcon={<FiCalendar />}
          value={form.challan_date} onChange={(e) => set('challan_date', e.target.value)} />
      </div>

      <SectionDivider label="Trip" />
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Trip <span className="text-rose-500">*</span></span>
        {selectedTrip ? (
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div className="min-w-0">
              <div className="font-semibold">{meta.fromPlace ?? '—'} → {meta.toPlace ?? '—'}</div>
              <div className="text-xs text-blue-500">{meta.customerName ?? ''}{meta.driverName ? ` · ${meta.driverName}` : ''}</div>
            </div>
            <button type="button" onClick={() => set('trip_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100">
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input type="text" placeholder="Search trips..."
                className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={tripSearch} onChange={(e) => setTripSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 text-zinc-700">
                <option value="">All From</option>
                {uniqueFromPlaces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 text-zinc-700">
                <option value="">All To</option>
                {uniqueToPlaces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 text-zinc-700">
                <option value="">All Customers</option>
                {uniqueCustomers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredTrips.length > 0 ? filteredTrips.map((t) => {
                const m = tripMeta[String(t.id)] ?? {}
                return (
                  <button key={t.id} type="button"
                    className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                    onClick={() => handleTripSelect(t.id)}>
                    <div className="font-medium text-zinc-900">{m.fromPlace ?? '—'} → {m.toPlace ?? '—'}</div>
                    <div className="text-xs text-zinc-400">{m.customerName ?? ''}{m.driverName ? ` · Driver: ${m.driverName}` : ''}</div>
                  </button>
                )
              }) : <div className="p-3 text-center text-zinc-400 text-xs">No trips found</div>}
            </div>
          </div>
        )}
        {errors.trip_id && <p className="text-xs text-rose-600 font-medium">{errors.trip_id}</p>}
      </div>

      {selectedTrip && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
          {[
            ['Customer', meta.customerName],
            ['From', meta.fromPlace],
            ['To', meta.toPlace],
            ['Metric', meta.metric],
            ['Rate/Unit', meta.ratePerUnit ? `₹${meta.ratePerUnit}` : undefined],
            ['Driver', meta.driverName],
            ['Vehicle', meta.vehicleNumber],
            ['End Date', meta.endDateTime],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
              <span className="text-xs font-medium text-zinc-700">{value}</span>
            </div>
          ))}
        </div>
      )}

      <SectionDivider label="Transport" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Transport</label>
          <div className="relative">
            <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
            <select
              value={form.transport}
              onChange={(e) => set('transport', e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 appearance-none"
            >
              <option value="">Self / Contractor</option>
              {companies.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Input label="Vehicle Number" placeholder="WB-01-AB-1234" leftIcon={<FiTruck />}
          value={form.vehicle_number} onChange={(e) => set('vehicle_number', e.target.value)} />
        {/* <Input label="Permit Number" placeholder="PRM-12345"
          value={form.permit_number} onChange={(e) => set('permit_number', e.target.value)} /> */}
        <Input label="Unloading Date" type="date" leftIcon={<FiCalendar />}
          value={form.unloading_date} onChange={(e) => set('unloading_date', e.target.value)} />
      </div>

      <SectionDivider label="Cargo" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Description" placeholder="Industrial Goods"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        <Input label="HSN Code" placeholder="HSN-8877"
          value={form.hsn_code} onChange={(e) => set('hsn_code', e.target.value)} />
        <Input label="Weight at Loading (Ton)" type="number" placeholder="20.5"
          value={form.weight_at_loading} onChange={(e) => set('weight_at_loading', e.target.value)} />
        <Input label="Weight at Unloading (Ton)" type="number" placeholder="20.2"
          value={form.weight_at_unloading} onChange={(e) => set('weight_at_unloading', e.target.value)} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Shortage (kg)</label>
          <div className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-semibold ${
            shortageKg > 151 ? 'border-red-200 bg-red-50 text-red-800' :
            shortageKg > 0   ? 'border-amber-200 bg-amber-50 text-amber-800' :
            'border-zinc-200 bg-zinc-50 text-zinc-400'
          }`}>
            {shortageKg > 151 && <FiAlertTriangle size={14} />}
            {form.shortage ? `${Number(form.shortage).toLocaleString('en-IN')} kg` : 'Auto-calculated'}
          </div>
          {shortageKg > 151 && (
            <p className="text-[11px] text-red-500 font-medium">Shortage exceeds 150 kg — rate required</p>
          )}
        </div>
      </div>

      <SectionDivider label="Financials" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <Input label="Total Amount (₹)" type="number" placeholder="Auto-filled from trip"
          value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} />

        {showShortageRate && (
          <>
            <Input label="Shortage Rate (₹/kg)" type="number" placeholder="e.g. 0.5"
              value={form.shortage_rate} onChange={(e) => set('shortage_rate', e.target.value)} />
            <ReadOnlyField label="Shortage Amount (₹)" value={fmt(form.shortage_amount)} highlight="red" />
          </>
        )}

        <Input label="TDS %" type="number" placeholder="2"
          value={form.tds_percentage} onChange={(e) => set('tds_percentage', e.target.value)} />
        <ReadOnlyField label="TDS Amount (₹)" value={fmt(form.tds_amount)} highlight="amber" />

        {/* Diesel 3-way: any 2 filled → 3rd auto-calculated instantly */}
        <Input label="Diesel Price/Litre (₹)" type="number" placeholder="e.g. 95"
          value={form.diesel_price_per_litre}
          onFocus={() => { dieselFocusRef.current = 'diesel_price_per_litre' }}
          onBlur={() => { dieselFocusRef.current = null; setForm((prev) => recalc(prev, null)) }}
          onChange={(e) => set('diesel_price_per_litre', e.target.value)} />
        <Input label="Diesel Quantity (Litres)" type="number" placeholder="e.g. 50"
          value={form.diesel_quantity}
          onFocus={() => { dieselFocusRef.current = 'diesel_quantity' }}
          onBlur={() => { dieselFocusRef.current = null; setForm((prev) => recalc(prev, null)) }}
          onChange={(e) => set('diesel_quantity', e.target.value)} />
        <Input label="Diesel Advance (₹)" type="number" placeholder="0"
          value={form.diesel_advance}
          onFocus={() => { dieselFocusRef.current = 'diesel_advance' }}
          onBlur={() => { dieselFocusRef.current = null; setForm((prev) => recalc(prev, null)) }}
          onChange={(e) => set('diesel_advance', e.target.value)} />
        {/* <Input label="Driver Advance (₹)" type="number" placeholder="0"
          value={form.advance} onChange={(e) => set('advance', e.target.value)} /> */}

        <Input label="CGST %" type="number" placeholder="0"
          value={form.cgst_percentage} onChange={(e) => set('cgst_percentage', e.target.value)} />
        <ReadOnlyField label="CGST Amount (₹)" value={fmt(form.cgst_amount)} highlight="emerald" />

        <Input label="SGST %" type="number" placeholder="0"
          value={form.sgst_percentage} onChange={(e) => set('sgst_percentage', e.target.value)} />
        <ReadOnlyField label="SGST Amount (₹)" value={fmt(form.sgst_amount)} highlight="emerald" />

        <div className="col-span-full">
          <Input label="Other Expense (₹)" type="number" placeholder="0"
            value={form.other_expense} onChange={(e) => set('other_expense', e.target.value)} />
        </div>

        {/* Advance type toggle buttons */}
        <div className="col-span-full space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Advance Type</label>
          <div className="flex gap-2 flex-wrap">
            {ADVANCE_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('advance_type', form.advance_type === opt.value ? '' : opt.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  form.advance_type === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {opt.value === 'BANK_TRANSFER' && <FiCreditCard size={13} />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bank account selector — only when BANK_TRANSFER */}
        {form.advance_type === 'BANK_TRANSFER' && (
          <div className="col-span-full space-y-1">
            <label className="block text-sm font-medium text-zinc-700">Select Account</label>
            {(() => {
              const filtered = form.transport
                ? bankAccounts.filter((a) => a.companyName?.toLowerCase() === form.transport.toLowerCase())
                : bankAccounts
              if (filtered.length === 0) return (
                <p className="text-xs text-zinc-400 italic">
                  {form.transport
                    ? `No bank accounts found for "${form.transport}". Add accounts in Companies.`
                    : 'No bank accounts found. Add accounts in Companies.'}
                </p>
              )
              return (
                <div className="grid grid-cols-1 gap-2">
                  {filtered.map((acc) => (
                    <button
                      key={acc.value}
                      type="button"
                      onClick={() => set('advance_bank_account_id', form.advance_bank_account_id === acc.value ? '' : acc.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                        form.advance_bank_account_id === acc.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <FiCreditCard size={13} className="shrink-0 text-zinc-400" />
                      {acc.label}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        <Input label="Advance Amount (₹)" type="number" placeholder="0"
          value={form.advance_amount} onChange={(e) => set('advance_amount', e.target.value)} />
        <Input label="Advance Date" type="date" leftIcon={<FiCalendar />}
          value={form.advance_date} onChange={(e) => set('advance_date', e.target.value)} />

        <div className="col-span-full">
          <ReadOnlyField
            label="Balance (₹)"
            value={form.balance ? `₹${Number(form.balance).toLocaleString('en-IN')}` : ''}
            highlight="emerald"
          />
          {form.total_amount && (
            <p className="text-[11px] text-zinc-400 mt-1">
              Total {fmt(form.total_amount)}
              {form.tds_amount      ? ` − TDS ${fmt(form.tds_amount)}`            : ''}
              {form.diesel_advance  ? ` − Diesel Adv ${fmt(form.diesel_advance)}` : ''}
              {form.advance         ? ` − Driver Adv ${fmt(form.advance)}`        : ''}
              {form.shortage_amount ? ` − Shortage ${fmt(form.shortage_amount)}`  : ''}
              {form.other_expense   ? ` − Other ${fmt(form.other_expense)}`       : ''}
              {form.advance_amount  ? ` − Advance ${fmt(form.advance_amount)}`    : ''}
              {form.cgst_amount     ? ` + CGST ${fmt(form.cgst_amount)}`          : ''}
              {form.sgst_amount     ? ` + SGST ${fmt(form.sgst_amount)}`          : ''}
            </p>
          )}
        </div>

        {/* <div className="col-span-full">
          <Input label="Remark" placeholder="Good condition"
            value={form.remark} onChange={(e) => set('remark', e.target.value)} />
        </div> */}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Input label="Remark" placeholder="Good condition"
          value={form.remark} onChange={(e) => set('remark', e.target.value)} />
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && (
          <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>
        )}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Challan' : 'Create Challan'}
        </Button>
      </div>
    </form>
  )
}
