import { useState, useMemo } from 'react'
import { FiSearch, FiX, FiFileText, FiCalendar, FiCheckCircle, FiTruck } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  )
}

export default function ChallanForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  trips = [],
  tripMeta = {}, // { [trip_id]: { customerName, fromPlace, toPlace, metric, ratePerUnit, driverName } }
}) {
  const isEdit = !!defaultValues

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    challan_no: defaultValues?.challan_no ?? '',
    bill_no: defaultValues?.bill_no ?? '',
    challan_date: defaultValues?.challan_date ?? today,
    trip_id: defaultValues?.trip_id ?? '',
    unloading_date: defaultValues?.unloading_date ?? '',
    permit_number: defaultValues?.permit_number ?? '',
    transport: defaultValues?.transport ?? '',
    vehicle_number: defaultValues?.vehicle_number ?? '',
    description: defaultValues?.description ?? '',
    weight_at_loading: defaultValues?.weight_at_loading ?? '',
    weight_at_unloading: defaultValues?.weight_at_unloading ?? '',
    shortage: defaultValues?.shortage ?? '',
    hsn_code: defaultValues?.hsn_code ?? '',
    total_amount: defaultValues?.total_amount ?? '',
    tds: defaultValues?.tds ?? '',
    remark: defaultValues?.remark ?? '',
    advance: defaultValues?.advance ?? '',
    tc_date: defaultValues?.tc_date ?? '',
    balance: defaultValues?.balance ?? '',
  })
  const [errors, setErrors] = useState({})
  const [tripSearch, setTripSearch] = useState('')

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      // auto-calc balance whenever financial fields change
      if (['total_amount', 'tds', 'advance'].includes(key)) {
        const total = Number(key === 'total_amount' ? val : prev.total_amount) || 0
        const tds = Number(key === 'tds' ? val : prev.tds) || 0
        const advance = Number(key === 'advance' ? val : prev.advance) || 0
        next.balance = String(total + tds - advance)
      }
      // auto-calc shortage = weight_at_loading - weight_at_unloading
      if (['weight_at_loading', 'weight_at_unloading'].includes(key)) {
        const loading = Number(key === 'weight_at_loading' ? val : prev.weight_at_loading)
        const unloading = Number(key === 'weight_at_unloading' ? val : prev.weight_at_unloading)
        if (loading > 0 && unloading > 0) {
          next.shortage = String(Math.max(0, loading - unloading))
        }
      }
      return next
    })
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  // Auto-fill from trip when trip_id changes
  const handleTripSelect = (tripId) => {
    const m = tripMeta[String(tripId)] ?? {}
    setForm((prev) => {
      const total = Number(m.tripAmount) || 0
      const tds = Number(prev.tds) || 0
      const advance = Number(prev.advance) || 0
      return {
        ...prev,
        trip_id: tripId,
        vehicle_number: m.vehicleNumber || prev.vehicle_number,
        unloading_date: m.endDateTime || prev.unloading_date,
        transport: m.transport || prev.transport,
        total_amount: m.tripAmount !== '' ? String(m.tripAmount) : prev.total_amount,
        balance: String(total + tds - advance),
      }
    })
    setTripSearch('')
  }

  const selectedTrip = trips.find((t) => String(t.id) === String(form.trip_id))
  const meta = form.trip_id ? (tripMeta[String(form.trip_id)] ?? {}) : {}

  const filteredTrips = useMemo(() => {
    const q = tripSearch.toLowerCase()
    return trips.filter((t) => {
      const m = tripMeta[String(t.id)] ?? {}
      return (
        (m.fromPlace ?? '').toLowerCase().includes(q) ||
        (m.toPlace ?? '').toLowerCase().includes(q) ||
        (m.customerName ?? '').toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)
      )
    })
  }, [trips, tripSearch, tripMeta])

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
    ;['weight_at_loading', 'weight_at_unloading', 'shortage', 'total_amount', 'tds', 'advance', 'balance'].forEach((f) => {
      if (payload[f] !== '' && payload[f] !== undefined) payload[f] = Number(payload[f])
    })
    onSubmit(payload)
  }

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
      {/* Trip picker */}
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
            <div className="max-h-36 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredTrips.length > 0 ? filteredTrips.map((t) => {
                const m = tripMeta[String(t.id)] ?? {}
                return (
                  <button key={t.id} type="button"
                    className="w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                    onClick={() => { handleTripSelect(t.id) }}>
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

      {/* Trip info read-only display */}
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
        <Input label="Transport" placeholder="Self / Contractor" leftIcon={<FiTruck />}
          value={form.transport} onChange={(e) => set('transport', e.target.value)} />
        <Input label="Vehicle Number" placeholder="WB-01-AB-1234" leftIcon={<FiTruck />}
          value={form.vehicle_number} onChange={(e) => set('vehicle_number', e.target.value)} />
        <Input label="Permit Number" placeholder="PRM-12345"
          value={form.permit_number} onChange={(e) => set('permit_number', e.target.value)} />
        <Input label="Unloading Date" type="date" leftIcon={<FiCalendar />}
          value={form.unloading_date} onChange={(e) => set('unloading_date', e.target.value)} />
      </div>

      <SectionDivider label="Cargo" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Description" placeholder="Industrial Goods"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        <Input label="HSN Code" placeholder="HSN-8877"
          value={form.hsn_code} onChange={(e) => set('hsn_code', e.target.value)} />
        <Input label="Weight at Loading" type="number" placeholder="20.5"
          value={form.weight_at_loading} onChange={(e) => set('weight_at_loading', e.target.value)} />
        <Input label="Weight at Unloading" type="number" placeholder="20.2"
          value={form.weight_at_unloading} onChange={(e) => set('weight_at_unloading', e.target.value)} />
        <Input label="Shortage" type="number" placeholder="Auto-calculated"
          value={form.shortage} onChange={(e) => set('shortage', e.target.value)} />
      </div>

      <SectionDivider label="Financials" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Total Amount (₹)" type="number" placeholder="24240"
          value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} />
        <Input label="TDS (₹)" type="number" placeholder="242.40"
          value={form.tds} onChange={(e) => set('tds', e.target.value)} />
        <Input label="Advance (₹)" type="number" placeholder="5000"
          value={form.advance} onChange={(e) => set('advance', e.target.value)} />
        {/* Balance read-only display */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Balance (₹)</label>
          <div className={`flex items-center h-10 px-3 rounded-lg border text-sm font-semibold transition-colors ${
            form.balance ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-400'
          }`}>
            {form.balance ? `₹${Number(form.balance).toLocaleString('en-IN')}` : 'Auto-calculated'}
          </div>
          {form.total_amount && (
            <p className="text-[11px] text-zinc-400">
              ₹{Number(form.total_amount).toLocaleString('en-IN')} + ₹{Number(form.tds || 0).toLocaleString('en-IN')} TDS − ₹{Number(form.advance || 0).toLocaleString('en-IN')} advance
            </p>
          )}
        </div>
        <Input label="TC Date" type="date" leftIcon={<FiCalendar />}
          value={form.tc_date} onChange={(e) => set('tc_date', e.target.value)} />
        <div className="col-span-full">
          <Input label="Remark" placeholder="Good condition"
            value={form.remark} onChange={(e) => set('remark', e.target.value)} />
        </div>
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
