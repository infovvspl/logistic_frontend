import { useState, useMemo } from 'react'
import { FiSearch, FiX, FiFileText, FiCheckCircle, FiCheck } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function BillForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  challans = [],
  challanMeta = {},
}) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    bill_no:     defaultValues?.bill_no     ?? '',
    challan_id:  defaultValues?.challan_id  ?? '',
  })
  // multi-select only used in create mode
  const [selectedIds, setSelectedIds] = useState([])
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const toggleChallan = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setErrors((e) => ({ ...e, challan_id: '' }))
  }

  const uniqueFromPlaces = useMemo(() => Array.from(new Set(challans.map(t => challanMeta[String(t.id)]?.fromPlace).filter(Boolean))).sort(), [challans, challanMeta])
  const uniqueToPlaces = useMemo(() => Array.from(new Set(challans.map(t => challanMeta[String(t.id)]?.toPlace).filter(Boolean))).sort(), [challans, challanMeta])
  const uniqueCustomers = useMemo(() => Array.from(new Set(challans.map(t => challanMeta[String(t.id)]?.customerName).filter(Boolean))).sort(), [challans, challanMeta])

  const filteredChallans = useMemo(() => {
    const q = search.toLowerCase()
    return challans.filter((c) => {
      const m = challanMeta[String(c.id)] ?? {}
      if (filterFrom && m.fromPlace !== filterFrom) return false
      if (filterTo && m.toPlace !== filterTo) return false
      if (filterCustomer && m.customerName !== filterCustomer) return false
      return (
        (c.challan_no ?? '').toLowerCase().includes(q) ||
        (m.customerName ?? '').toLowerCase().includes(q) ||
        (m.route ?? '').toLowerCase().includes(q)
      )
    })
  }, [challans, search, challanMeta, filterFrom, filterTo, filterCustomer])

  const selectedChallan = isEdit
    ? challans.find((c) => String(c.id) === String(form.challan_id))
    : null

  const validate = () => {
    const e = {}
    if (!form.bill_no.trim()) e.bill_no = 'Bill number is required'
    if (isEdit && !form.challan_id) e.challan_id = 'Challan is required'
    if (!isEdit && selectedIds.length === 0) e.challan_id = 'Select at least one challan'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (isEdit) {
      onSubmit(form)
    } else {
      // one bill per selected challan
      onSubmit({ bill_no: form.bill_no, challan_ids: selectedIds })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <Input
        label="Bill No."
        required
        placeholder="BILL-2026-001"
        leftIcon={<FiFileText />}
        value={form.bill_no}
        onChange={(e) => set('bill_no', e.target.value)}
        error={errors.bill_no}
      />
      {!isEdit && selectedIds.length > 1 && form.bill_no && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 -mt-2">
          Multiple challans selected — bills will be created as&nbsp;
          <strong>{selectedIds.map((_, i) => `${form.bill_no}-${i + 1}`).join(', ')}</strong>
        </p>
      )}

      {/* Edit mode: single challan (read-only picker) */}
      {isEdit ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-zinc-800">Challan</span>
          {selectedChallan ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
              <div className="min-w-0">
                <div className="font-semibold">{selectedChallan.challan_no}</div>
                <div className="text-xs text-blue-500">
                  {(challanMeta[String(selectedChallan.id)]?.customerName) ?? ''}
                  {(challanMeta[String(selectedChallan.id)]?.route) ? ` · ${challanMeta[String(selectedChallan.id)].route}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => set('challan_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100">
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <ChallanPicker
              challans={filteredChallans}
              challanMeta={challanMeta}
              search={search}
              onSearch={setSearch}
              onSelect={(id) => set('challan_id', id)}
              filterFrom={filterFrom} setFilterFrom={setFilterFrom}
              filterTo={filterTo} setFilterTo={setFilterTo}
              filterCustomer={filterCustomer} setFilterCustomer={setFilterCustomer}
              uniqueFromPlaces={uniqueFromPlaces} uniqueToPlaces={uniqueToPlaces} uniqueCustomers={uniqueCustomers}
            />
          )}
          {errors.challan_id && <p className="text-xs text-rose-600 font-medium">{errors.challan_id}</p>}
        </div>
      ) : (
        /* Create mode: multi-select */
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-800">
              Challans <span className="text-rose-500">*</span>
            </span>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const c = challans.find((x) => String(x.id) === String(id))
                return (
                  <span key={id} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
                    {c?.challan_no ?? id}
                    <button type="button" onClick={() => toggleChallan(id)} className="ml-0.5 hover:text-blue-900">
                      <FiX size={11} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search challans..."
              className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

          <div className="max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
            {filteredChallans.length > 0 ? filteredChallans.map((c) => {
              const m = challanMeta[String(c.id)] ?? {}
              const isSelected = selectedIds.includes(c.id)
              return (
                <button key={c.id} type="button"
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-zinc-50'
                  }`}
                  onClick={() => toggleChallan(c.id)}>
                  <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-300'
                  }`}>
                    {isSelected && <FiCheck size={10} className="text-white stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900">{c.challan_no}</div>
                    <div className="text-xs text-zinc-400">
                      {m.customerName ?? ''}
                      {m.route ? ` · ${m.route}` : ''}
                      {c.total_amount ? ` · ₹${Number(c.total_amount).toLocaleString('en-IN')}` : ''}
                    </div>
                  </div>
                </button>
              )
            }) : (
              <div className="p-3 text-center text-zinc-400 text-xs">No challans found</div>
            )}
          </div>
          {errors.challan_id && <p className="text-xs text-rose-600 font-medium">{errors.challan_id}</p>}
        </div>
      )}

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && (
          <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>
        )}
        <Button type="submit" loading={loading} className="min-w-[140px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Bill' : `Create Bill${selectedIds.length > 1 ? `s (${selectedIds.length})` : ''}`}
        </Button>
      </div>
    </form>
  )
}

function ChallanPicker({ challans, challanMeta, search, onSearch, onSelect, filterFrom, setFilterFrom, filterTo, setFilterTo, filterCustomer, setFilterCustomer, uniqueFromPlaces, uniqueToPlaces, uniqueCustomers }) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
        <input
          type="text"
          placeholder="Search by challan no or customer..."
          className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
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
      <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
        {challans.length > 0 ? challans.map((c) => {
          const m = challanMeta[String(c.id)] ?? {}
          return (
            <button key={c.id} type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => onSelect(c.id)}>
              <div className="font-medium text-zinc-900">{c.challan_no}</div>
              <div className="text-xs text-zinc-400">
                {m.customerName ?? ''}
                {m.route ? ` · ${m.route}` : ''}
                {c.total_amount ? ` · ₹${Number(c.total_amount).toLocaleString('en-IN')}` : ''}
              </div>
            </button>
          )
        }) : (
          <div className="p-3 text-center text-zinc-400 text-xs">No challans found</div>
        )}
      </div>
    </div>
  )
}
