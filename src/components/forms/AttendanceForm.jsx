import { useState, useMemo } from 'react'
import { FiSearch, FiX, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function AttendanceForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  users = [],
}) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    user_id:      defaultValues?.user_id      ?? '',
    punch_in_at:  defaultValues?.punch_in_at  ? new Date(defaultValues.punch_in_at).toISOString().slice(0, 16)  : '',
    punch_out_at: defaultValues?.punch_out_at ? new Date(defaultValues.punch_out_at).toISOString().slice(0, 16) : '',
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
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    )
  }, [users, userSearch])

  const selectedUser = users.find((u) => String(u.id) === String(form.user_id))

  const validate = () => {
    const e = {}
    if (!form.user_id) e.user_id = 'User is required'
    if (!form.punch_in_at) e.punch_in_at = 'Punch-in time is required'
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

      {/* User picker */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">User <span className="text-rose-500">*</span></span>
        {selectedUser ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            <div className="min-w-0">
              <div className="font-semibold">{selectedUser.name || selectedUser.email}</div>
              <div className="text-xs text-blue-400">{selectedUser.email || ''}</div>
            </div>
            <button type="button" onClick={() => set('user_id', '')} className="ml-2 p-1 rounded hover:bg-blue-100">
              <FiX size={13} />
            </button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input label="Punch In" type="datetime-local" leftIcon={<FiCalendar />}
            value={form.punch_in_at} onChange={(e) => set('punch_in_at', e.target.value)} />
          {errors.punch_in_at && <p className="text-xs text-rose-600 font-medium">{errors.punch_in_at}</p>}
        </div>
        <Input label="Punch Out" type="datetime-local" leftIcon={<FiCalendar />}
          value={form.punch_out_at} onChange={(e) => set('punch_out_at', e.target.value)} />
      </div>

      {/* Duration preview */}
      {form.punch_in_at && form.punch_out_at && (() => {
        const diff = new Date(form.punch_out_at) - new Date(form.punch_in_at)
        if (diff <= 0) return null
        const hrs = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
            <FiCalendar size={12} />
            Duration: {hrs}h {mins}m
          </div>
        )
      })()}

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Attendance' : 'Mark Attendance'}
        </Button>
      </div>
    </form>
  )
}
