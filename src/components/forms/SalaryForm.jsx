import { useState, useMemo, useEffect } from 'react'
import { FiSearch, FiX, FiCheckCircle } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm shadow-blue-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
  )
}

function ReadOnly({ label, value, highlight }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className={`flex items-center h-10 px-3 rounded-xl border text-sm font-semibold ${
        highlight === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
        highlight === 'amber'   ? 'border-amber-200 bg-amber-50 text-amber-800' :
        value ? 'border-zinc-200 bg-zinc-50 text-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-400'
      }`}>
        {value || 'Auto-filled from wages'}
      </div>
    </div>
  )
}

export default function SalaryForm({ defaultValues, onSubmit, loading, serverError = null, users = [], wages = [], attendance = [] }) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    user_id:              defaultValues?.user_id              ?? '',
    wages_id:             defaultValues?.wages_id             ?? '',
    month:                defaultValues?.month                ?? '',
    no_of_working_hours:  defaultValues?.no_of_working_hours  ?? '',
    no_of_working_days:   defaultValues?.no_of_working_days   ?? '',
    no_of_leave_days:     defaultValues?.no_of_leave_days     ?? '',
    no_of_ot_hours:       defaultValues?.no_of_ot_hours       ?? '',
    regular_wages:        defaultValues?.regular_wages        ?? '',
    ot_wages:             defaultValues?.ot_wages             ?? '',
    pf:                   defaultValues?.pf                   ?? '',
    esic:                 defaultValues?.esic                 ?? '',
    senior_allowance:     defaultValues?.senior_allowance     ?? '',
    total_wages:          defaultValues?.total_wages          ?? '',
  })
  const [errors, setErrors] = useState({})
  const [userSearch, setUserSearch] = useState('')

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  // When wages_id changes, auto-fill wage fields
  const selectedWage = wages.find((w) => String(w.id) === String(form.wages_id))
  useEffect(() => {
    const wage = wages.find((w) => String(w.id) === String(form.wages_id))
    if (!wage) return
    setForm((prev) => ({
      ...prev,
      regular_wages:    String(wage.normal_wages    ?? ''),
      ot_wages:         String(wage.ot_wages        ?? ''),
      senior_allowance: String(wage.senior_allowance ?? ''),
    }))
  }, [form.wages_id, wages])

  // When user_id + month both set, auto-fill attendance stats
  useEffect(() => {
    if (!form.user_id || !form.month) return
    const [year, mon] = form.month.split('-').map(Number)
    if (!year || !mon) return

    const records = attendance.filter((a) => {
      if (String(a.user_id) !== String(form.user_id)) return false
      if (!a.punch_in_at) return false
      const d = new Date(a.punch_in_at)
      return d.getFullYear() === year && d.getMonth() + 1 === mon
    })

    if (records.length === 0) return

    // Count unique working days
    const workingDays = new Set(records.map((a) => new Date(a.punch_in_at).toDateString())).size

    // Total working hours and OT hours (hours beyond 8 per day)
    let totalHours = 0
    let otHours = 0
    records.forEach((a) => {
      if (!a.punch_in_at || !a.punch_out_at) return
      const diff = (new Date(a.punch_out_at) - new Date(a.punch_in_at)) / 3600000
      if (diff > 0) {
        totalHours += diff
        if (diff > 8) otHours += diff - 8
      }
    })

    // Days in month for leave calculation
    const daysInMonth = new Date(year, mon, 0).getDate()
    const leaveDays = Math.max(0, daysInMonth - workingDays)

    setForm((prev) => ({
      ...prev,
      no_of_working_days:  String(workingDays),
      no_of_working_hours: String(Math.round(totalHours)),
      no_of_leave_days:    String(leaveDays),
      no_of_ot_hours:      String(Math.round(otHours * 10) / 10),
    }))
  }, [form.user_id, form.month, attendance])

  // Recalculate derived fields
  useEffect(() => {
    const regularWages   = Number(form.regular_wages) || 0
    const otWages        = Number(form.ot_wages) || 0
    const otHours        = Number(form.no_of_ot_hours) || 0
    const pfPct          = Number(selectedWage?.pf_percentage) || 0
    const esicPct        = Number(selectedWage?.esic_percentage) || 0
    const seniorAllow    = Number(form.senior_allowance) || 0

    const otTotal  = otWages * otHours
    const pfAmt    = pfPct > 0 ? ((regularWages + otTotal) * pfPct) / 100 : 0
    const esicAmt  = esicPct > 0 ? ((regularWages + otTotal) * esicPct) / 100 : 0
    const total    = regularWages + otTotal + seniorAllow - pfAmt - esicAmt

    setForm((prev) => ({
      ...prev,
      pf:          pfAmt > 0    ? String(pfAmt.toFixed(2))   : prev.pf,
      esic:        esicAmt > 0  ? String(esicAmt.toFixed(2)) : prev.esic,
      total_wages: total > 0    ? String(total.toFixed(2))   : prev.total_wages,
    }))
  }, [form.regular_wages, form.ot_wages, form.no_of_ot_hours, form.senior_allowance, form.wages_id])

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    return users.filter((u) => (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
  }, [users, userSearch])

  const selectedUser = users.find((u) => String(u.id) === String(form.user_id))

  // Filter wages for selected user
  const userWages = useMemo(() => {
    if (!form.user_id) return wages
    return wages.filter((w) => String(w.user_id) === String(form.user_id))
  }, [wages, form.user_id])

  // Auto-select wages when user is picked and has exactly one record
  useEffect(() => {
    if (!form.user_id) return
    const uw = wages.filter((w) => String(w.user_id) === String(form.user_id))
    if (uw.length === 1 && !form.wages_id) {
      set('wages_id', uw[0].id)
    }
  }, [form.user_id, wages])

  const wagesOptions = [{ value: '', label: 'Select wages record...' }, ...userWages.map((w) => ({
    value: w.id,
    label: `₹${Number(w.normal_wages).toLocaleString('en-IN')}/mo · OT ₹${w.ot_wages}/hr`,
  }))]

  const validate = () => {
    const e = {}
    if (!form.user_id) e.user_id = 'User is required'
    if (!form.wages_id) e.wages_id = 'Wages record is required'
    if (!form.month) e.month = 'Month is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  const fmt = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : ''

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <SectionDivider label="Employee & Period" />

      {/* User picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">User <span className="text-rose-500">*</span></span>
        {selectedUser ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div>
              <div className="font-semibold">{selectedUser.name || selectedUser.email}</div>
              <div className="text-xs text-blue-400">{selectedUser.email || ''}</div>
            </div>
            <button type="button" onClick={() => { set('user_id', ''); set('wages_id', '') }} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search users..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
              {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                <button key={u.id} type="button"
                  className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => { set('user_id', u.id); setUserSearch('') }}>
                  <div className="font-medium text-zinc-900">{u.name || u.email}</div>
                  <div className="text-xs text-zinc-400">{u.email || ''}</div>
                </button>
              )) : <div className="p-3 text-center text-zinc-400 text-xs">No users found</div>}
            </div>
          </div>
        )}
        {errors.user_id && <p className="text-xs text-rose-600 font-medium">{errors.user_id}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Wages Record <span className="text-rose-500">*</span></label>
          <select
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            value={form.wages_id} onChange={(e) => set('wages_id', e.target.value)}>
            {wagesOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.wages_id && <p className="text-xs text-rose-600 font-medium">{errors.wages_id}</p>}
        </div>
        <div className="space-y-1">
          <Input label="Month" type="month" placeholder="2026-03"
            value={form.month} onChange={(e) => set('month', e.target.value)} />
          {errors.month && <p className="text-xs text-rose-600 font-medium">{errors.month}</p>}
          {form.user_id && form.month && form.no_of_working_days && (
            <p className="text-[11px] text-emerald-600 font-semibold">✓ Attendance auto-filled from records</p>
          )}
        </div>
      </div>

      <SectionDivider label="Working Hours & Days" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Input label="Working Hours" type="number" placeholder="176"
          value={form.no_of_working_hours} onChange={(e) => set('no_of_working_hours', e.target.value)} />
        <Input label="Working Days" type="number" placeholder="22"
          value={form.no_of_working_days} onChange={(e) => set('no_of_working_days', e.target.value)} />
        <Input label="Leave Days" type="number" placeholder="2"
          value={form.no_of_leave_days} onChange={(e) => set('no_of_leave_days', e.target.value)} />
        <Input label="OT Hours" type="number" placeholder="8"
          value={form.no_of_ot_hours} onChange={(e) => set('no_of_ot_hours', e.target.value)} />
      </div>

      <SectionDivider label="Financials" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Regular Wages (₹)" type="number" placeholder="Auto from wages"
          value={form.regular_wages} onChange={(e) => set('regular_wages', e.target.value)} />
        <Input label="OT Wages (₹)" type="number" placeholder="Auto-calculated"
          value={form.ot_wages} onChange={(e) => set('ot_wages', e.target.value)} />
        <ReadOnly label="PF (₹)" value={fmt(form.pf)} highlight="amber" />
        <ReadOnly label="ESIC (₹)" value={fmt(form.esic)} highlight="amber" />
        <Input label="Senior Allowance (₹)" type="number" placeholder="Auto from wages"
          value={form.senior_allowance} onChange={(e) => set('senior_allowance', e.target.value)} />
        <ReadOnly label="Total Wages (₹)" value={fmt(form.total_wages)} highlight="emerald" />
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Salary' : 'Generate Salary'}
        </Button>
      </div>
    </form>
  )
}
