import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiClock, FiFilter, FiCheck, FiX, FiCalendar } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import AttendanceForm from '../../components/forms/AttendanceForm.jsx'
import * as attendanceAPI from '../../features/attendance/attendanceAPI.js'
import * as userAPI from '../../features/users/userAPI.js'

function formatDT(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch { return v }
}

function calcDuration(inAt, outAt) {
  if (!inAt || !outAt) return null
  const diff = new Date(outAt) - new Date(inAt)
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hrs}h ${mins}m`
}

export default function Attendance() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [customFilterOpen, setCustomFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const customFilterRef = useRef(null)
  const [customFilter, setCustomFilter] = useState({ startDate: '', endDate: '' })
  const [modal, setModal] = useState({ open: false, record: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  useEffect(() => {
    function handler(e) { 
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
      if (customFilterRef.current && !customFilterRef.current.contains(e.target)) setCustomFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const attendanceQuery = useQuery({ queryKey: ['attendance'], queryFn: attendanceAPI.listAttendance })
  const usersQuery      = useQuery({ queryKey: ['users'],      queryFn: userAPI.listUsers })

  const createMutation = useMutation({
    mutationFn: attendanceAPI.createAttendance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); setModal({ open: false, record: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => attendanceAPI.updateAttendance(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); setModal({ open: false, record: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: attendanceAPI.deleteAttendance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  })

  const users = usersQuery.data?.items ?? []
  const userById = useMemo(() => { const m = new Map(); users.forEach((u) => m.set(String(u.id), u)); return m }, [users])

  const allRows = attendanceQuery.data?.items ?? []
  const todayCount = allRows.filter((r) => {
    if (!r.punch_in_at) return false
    const d = new Date(r.punch_in_at)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filteredRows = useMemo(() => {
    let rows = allRows

    // Debug: Log the raw data and date parsing
    console.log('All rows:', allRows)
    console.log('Active filter:', activeFilter)
    console.log('Custom filter:', customFilter)
    
    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter((r) => {
        const u = userById.get(String(r.user_id))
        return (u?.name ?? '').toLowerCase().includes(q) || (u?.email ?? '').toLowerCase().includes(q)
      })
    }

    // Apply date filters (using punch_in_at date)
    if (activeFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1) // Start of tomorrow
      
      console.log('Today filter:', { today, tomorrow })
      rows = rows.filter(r => {
        if (!r.punch_in_at) {
          console.log('No punch_in_at for record:', r)
          return false
        }
        const punchDate = new Date(r.punch_in_at)
        console.log('Punch date for record:', punchDate, 'Original:', r.punch_in_at)
        return punchDate >= today && punchDate < tomorrow
      })
    } else if (activeFilter === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0) // Start of yesterday
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      console.log('Yesterday filter:', { yesterday, today })
      rows = rows.filter(r => {
        if (!r.punch_in_at) {
          console.log('No punch_in_at for record:', r)
          return false
        }
        const punchDate = new Date(r.punch_in_at)
        console.log('Punch date for record:', punchDate, 'Original:', r.punch_in_at)
        return punchDate >= yesterday && punchDate < today
      })
    } else if (activeFilter === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0) // Start of 7 days ago
      
      console.log('7 days filter:', { sevenDaysAgo })
      rows = rows.filter(r => {
        if (!r.punch_in_at) {
          console.log('No punch_in_at for record:', r)
          return false
        }
        const punchDate = new Date(r.punch_in_at)
        console.log('Punch date for record:', punchDate, 'Original:', r.punch_in_at)
        return punchDate >= sevenDaysAgo
      })
    } else if (activeFilter === 'custom') {
      console.log('Custom date range filter:', customFilter)
      rows = rows.filter(r => {
        if (!r.punch_in_at) {
          console.log('No punch_in_at for record:', r)
          return false
        }
        const punchDate = new Date(r.punch_in_at)
        console.log('Punch date for record:', punchDate, 'Original:', r.punch_in_at)
        
        if (customFilter.startDate && customFilter.endDate) {
          const start = new Date(customFilter.startDate)
          start.setHours(0, 0, 0, 0) // Start of start date
          const end = new Date(customFilter.endDate)
          end.setHours(23, 59, 59, 999) // End of end date
          console.log('Date range filter:', { start, end })
          return punchDate >= start && punchDate <= end
        }
        return true
      })
    }

    console.log('Filtered rows count:', rows.length)
    return rows
  }, [allRows, searchTerm, userById, activeFilter, customFilter])

  const columns = useMemo(() => [
    {
      key: 'user',
      header: 'User',
      render: (r) => {
        const u = userById.get(String(r.user_id))
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
              {(u?.name ?? u?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-900 text-sm truncate">{u?.name || u?.email || '—'}</span>
              <span className="text-[11px] text-zinc-400">{u?.email || ''}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'punch_in',
      header: 'Punch In',
      render: (r) => <span className="text-xs font-semibold text-zinc-700">{formatDT(r.punch_in_at)}</span>,
    },
    {
      key: 'punch_out',
      header: 'Punch Out',
      render: (r) => r.punch_out_at
        ? <span className="text-xs font-semibold text-zinc-700">{formatDT(r.punch_out_at)}</span>
        : <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Active</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r) => {
        const dur = calcDuration(r.punch_in_at, r.punch_out_at)
        return dur
          ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{dur}</span>
          : <span className="text-xs text-zinc-400">—</span>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, record: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [userById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Attendance</h1>
            {/* <p className="text-zinc-500 font-medium">Track employee punch-in and punch-out records.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}
          >
            Mark Attendance
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageStatCard title="Total Records" value={allRows.length} icon={<FiClock size={20} />} gradient="from-indigo-500 to-blue-500" />
          <PageStatCard title="Today's Attendance" value={todayCount} icon={<FiClock size={20} />} gradient="from-emerald-500 to-teal-500" />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input type="text" placeholder="Search by user name or email..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* Date Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl font-semibold text-sm transition-all shadow-sm border
                ${activeFilter && activeFilter !== 'custom' ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200'}`}
            >
              <FiFilter size={16} />
              {activeFilter === 'today' ? 'Today' : activeFilter === 'yesterday' ? 'Yesterday' : activeFilter === '7days' ? '7 Days' : activeFilter === 'custom' ? 'Custom' : 'Filter'}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 p-2 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-20"
                >
                  {[
                    { key: 'today',     label: 'Today' },
                    { key: 'yesterday',  label: 'Yesterday' },
                    { key: '7days',     label: 'Last 7 Days' },
                    { key: 'custom',    label: 'Custom Filter' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { 
                        if (opt.key === 'custom') {
                          setCustomFilterOpen(true)
                        } else {
                          setActiveFilter(activeFilter === opt.key ? null : opt.key)
                        }
                        setFilterOpen(false) 
                      }}
                      className="w-full flex items-center justify-between p-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {opt.label}
                      {activeFilter === opt.key && <FiCheck size={14} className="text-zinc-900" />}
                    </button>
                  ))}
                  {activeFilter && (
                    <button
                      onClick={() => { setActiveFilter(null); setCustomFilter({ startDate: '', endDate: '' }); setFilterOpen(false) }}
                      className="w-full px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100 text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Filter dropdown */}
          <div className="relative" ref={customFilterRef}>
            <AnimatePresence>
              {customFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 p-4 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900">Custom Date Range</h3>
                      <button
                        onClick={() => setCustomFilterOpen(false)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">Start Date</label>
                        <input
                          type="date"
                          value={customFilter.startDate}
                          onChange={(e) => setCustomFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">End Date</label>
                        <input
                          type="date"
                          value={customFilter.endDate}
                          onChange={(e) => setCustomFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          min={customFilter.startDate}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setActiveFilter('custom')
                          setCustomFilterOpen(false)
                        }}
                        disabled={!customFilter.startDate || !customFilter.endDate}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={() => {
                          setCustomFilter({ startDate: '', endDate: '' })
                          setCustomFilterOpen(false)
                        }}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {attendanceQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No attendance records yet'}
                description={searchTerm ? `No record matches "${searchTerm}"` : 'Mark the first attendance.'}
                actionLabel={!searchTerm ? 'Mark Attendance' : undefined}
                onAction={() => setModal({ open: true, record: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.record ? 'Edit Attendance' : 'Mark Attendance'} onClose={() => setModal({ open: false, record: null })}>
        <AttendanceForm
          defaultValues={modal.record}
          users={users}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete record?" description="This attendance record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (() => {
        const r = view.record
        const u = userById.get(String(r.user_id))
        return (
          <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })}
            title="Attendance Details"
            data={{
              'User': u?.name || u?.email || r.user_id,
              'Punch In': formatDT(r.punch_in_at),
              'Punch Out': formatDT(r.punch_out_at),
              'Duration': calcDuration(r.punch_in_at, r.punch_out_at) || '—',
            }}
          />
        )
      })()}
    </div>
  )
}

function ActionBtn({ icon, onClick, hover }) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-xl text-zinc-400 transition-all active:scale-90 ${hover}`}>
      <div className="text-lg">{icon}</div>
    </button>
  )
}
