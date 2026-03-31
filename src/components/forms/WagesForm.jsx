import { useState, useMemo } from 'react'
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

export default function WagesForm({ defaultValues, onSubmit, loading, serverError = null, users = [] }) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    user_id:          defaultValues?.user_id          ?? '',
    normal_wages:     defaultValues?.normal_wages     ?? '',
    ot_wages:         defaultValues?.ot_wages         ?? '',
    pf_percentage:    defaultValues?.pf_percentage    ?? '',
    esic_percentage:  defaultValues?.esic_percentage  ?? '',
    senior_allowance: defaultValues?.senior_allowance ?? '',
  })
  const [errors, setErrors] = useState({})
  const [userSearch, setUserSearch] = useState('')

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    return users.filter((u) =>
      (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    )
  }, [users, userSearch])

  const selectedUser = users.find((u) => String(u.id) === String(form.user_id))

  const validate = () => {
    const e = {}
    if (!form.user_id) e.user_id = 'User is required'
    if (!form.normal_wages) e.normal_wages = 'Normal wages required'
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

      <SectionDivider label="Employee" />
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">User <span className="text-rose-500">*</span></span>
        {selectedUser ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div>
              <div className="font-semibold">{selectedUser.name || selectedUser.email}</div>
              <div className="text-xs text-blue-400">{selectedUser.email || ''}</div>
            </div>
            <button type="button" onClick={() => set('user_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input type="text" placeholder="Search users..."
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white text-sm divide-y divide-zinc-50">
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

      <SectionDivider label="Wage Structure" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input label="Normal Wages (₹)" type="number" placeholder="5000"
            value={form.normal_wages} onChange={(e) => set('normal_wages', e.target.value)} />
          {errors.normal_wages && <p className="text-xs text-rose-600 font-medium">{errors.normal_wages}</p>}
        </div>
        <Input label="OT Wages (₹/hr)" type="number" placeholder="75"
          value={form.ot_wages} onChange={(e) => set('ot_wages', e.target.value)} />
        <Input label="PF %" type="number" placeholder="12"
          value={form.pf_percentage} onChange={(e) => set('pf_percentage', e.target.value)} />
        <Input label="ESIC %" type="number" placeholder="0.75"
          value={form.esic_percentage} onChange={(e) => set('esic_percentage', e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Senior Allowance (₹)" type="number" placeholder="2000"
            value={form.senior_allowance} onChange={(e) => set('senior_allowance', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Wages' : 'Create Wages'}
        </Button>
      </div>
    </form>
  )
}
