import { useState, useMemo } from 'react'
import { FiSearch, FiX, FiFileText, FiCheckCircle } from 'react-icons/fi'
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
    bill_no:    defaultValues?.bill_no    ?? '',
    challan_id: defaultValues?.challan_id ?? '',
  })
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const filteredChallans = useMemo(() => {
    const q = search.toLowerCase()
    return challans.filter((c) => {
      const m = challanMeta[String(c.id)] ?? {}
      return (
        (c.challan_no ?? '').toLowerCase().includes(q) ||
        (m.customerName ?? '').toLowerCase().includes(q) ||
        (m.route ?? '').toLowerCase().includes(q)
      )
    })
  }, [challans, search, challanMeta])

  const selectedChallan = challans.find((c) => String(c.id) === String(form.challan_id))
  const selectedMeta = form.challan_id ? (challanMeta[String(form.challan_id)] ?? {}) : {}

  const validate = () => {
    const e = {}
    if (!form.bill_no.trim()) e.bill_no = 'Bill number is required'
    if (!form.challan_id) e.challan_id = 'Challan is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
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

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Challan <span className="text-rose-500">*</span></span>
        {selectedChallan ? (
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div className="min-w-0">
              <div className="font-semibold">{selectedChallan.challan_no}</div>
              <div className="text-xs text-blue-500">
                {selectedMeta.customerName ?? ''}
                {selectedMeta.route ? ` · ${selectedMeta.route}` : ''}
                {selectedChallan.total_amount ? ` · ₹${Number(selectedChallan.total_amount).toLocaleString('en-IN')}` : ''}
              </div>
            </div>
            <button type="button" onClick={() => set('challan_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100">
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search by challan no or customer..."
                className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredChallans.length > 0 ? filteredChallans.map((c) => {
                const m = challanMeta[String(c.id)] ?? {}
                return (
                  <button key={c.id} type="button"
                    className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                    onClick={() => { set('challan_id', c.id); setSearch('') }}>
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
        )}
        {errors.challan_id && <p className="text-xs text-rose-600 font-medium">{errors.challan_id}</p>}
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && (
          <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>
        )}
        <Button type="submit" loading={loading} className="min-w-[140px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Bill' : 'Create Bill'}
        </Button>
      </div>
    </form>
  )
}
