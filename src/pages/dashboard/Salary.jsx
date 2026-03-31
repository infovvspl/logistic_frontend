import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import SalaryForm from '../../components/forms/SalaryForm.jsx'
import * as salaryAPI from '../../features/salary/salaryAPI.js'
import * as wagesAPI from '../../features/wages/wagesAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as attendanceAPI from '../../features/attendance/attendanceAPI.js'

export default function Salary() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, record: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const salaryQuery    = useQuery({ queryKey: ['salary'],     queryFn: salaryAPI.listSalary })
  const wagesQuery     = useQuery({ queryKey: ['wages'],      queryFn: wagesAPI.listWages })
  const usersQuery     = useQuery({ queryKey: ['users'],      queryFn: userAPI.listUsers })
  const attendanceQuery = useQuery({ queryKey: ['attendance'], queryFn: attendanceAPI.listAttendance })

  const createMutation = useMutation({
    mutationFn: salaryAPI.createSalary,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary'] }); setModal({ open: false, record: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => salaryAPI.updateSalary(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary'] }); setModal({ open: false, record: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: salaryAPI.deleteSalary,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary'] }),
  })

  const users = usersQuery.data?.items ?? []
  const wages = wagesQuery.data?.items ?? []
  const attendance = attendanceQuery.data?.items ?? []
  const userById = useMemo(() => { const m = new Map(); users.forEach((u) => m.set(String(u.id), u)); return m }, [users])
  const allRows = salaryQuery.data?.items ?? []
  const totalPayout = allRows.reduce((s, r) => s + (Number(r.total_wages) || 0), 0)

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => {
      const u = userById.get(String(r.user_id))
      return (u?.name ?? '').toLowerCase().includes(q) || (r.month ?? '').toLowerCase().includes(q)
    })
  }, [allRows, searchTerm, userById])

  const columns = useMemo(() => [
    {
      key: 'user',
      header: 'Employee',
      render: (r) => {
        const u = userById.get(String(r.user_id))
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
              {(u?.name ?? u?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-900 text-sm">{u?.name || u?.email || '—'}</span>
              <span className="text-[11px] text-zinc-400">{r.month || ''}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'days',
      header: 'Days / Hours',
      render: (r) => (
        <div className="flex flex-col gap-0.5 text-xs font-semibold text-zinc-600">
          <span>{r.no_of_working_days} days · {r.no_of_leave_days} leave</span>
          <span className="text-zinc-400">{r.no_of_working_hours}h · OT {r.no_of_ot_hours}h</span>
        </div>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (r) => (
        <div className="flex gap-1.5 text-[11px] font-semibold flex-wrap">
          <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-700">PF ₹{Number(r.pf||0).toLocaleString('en-IN')}</span>
          <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-700">ESIC ₹{Number(r.esic||0).toLocaleString('en-IN')}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Wages',
      render: (r) => <span className="text-sm font-black text-emerald-700 tabular-nums">₹{Number(r.total_wages||0).toLocaleString('en-IN')}</span>,
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
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Salary</h1>
            <p className="text-zinc-500 font-medium">Generate and manage monthly salary records.</p>
          </div>
          <Button variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}>
            Generate Salary
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Records" value={allRows.length} gradient="from-indigo-500 to-blue-500" icon={<FaRupeeSign />} />
          <StatCard title="Total Payout" value={`₹${totalPayout.toLocaleString('en-IN')}`} gradient="from-emerald-500 to-teal-500" icon={<FaRupeeSign />} />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by employee or month..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {salaryQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState title={searchTerm ? 'No results' : 'No salary records'} description="Generate the first salary record."
                actionLabel={!searchTerm ? 'Generate Salary' : undefined} onAction={() => setModal({ open: true, record: null })} />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} size="lg" title={modal.record ? 'Edit Salary' : 'Generate Salary'} onClose={() => setModal({ open: false, record: null })}>
        <SalaryForm defaultValues={modal.record} users={users} wages={wages} attendance={attendance}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (v) => { if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values: v }); else await createMutation.mutateAsync(v) }} />
      </Modal>

      <ConfirmDialog open={confirm.open} title="Delete salary?" description="This salary record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }} />

      {view.record && (() => {
        const u = userById.get(String(view.record.user_id))
        const r = view.record
        return (
          <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Salary Details"
            data={{
              'Employee': u?.name || u?.email || r.user_id,
              'Month': r.month,
              'Working Hours': r.no_of_working_hours,
              'Working Days': r.no_of_working_days,
              'Leave Days': r.no_of_leave_days,
              'OT Hours': r.no_of_ot_hours,
              'Regular Wages': `₹${Number(r.regular_wages||0).toLocaleString('en-IN')}`,
              'OT Wages': `₹${Number(r.ot_wages||0).toLocaleString('en-IN')}`,
              'PF': `₹${Number(r.pf||0).toLocaleString('en-IN')}`,
              'ESIC': `₹${Number(r.esic||0).toLocaleString('en-IN')}`,
              'Senior Allowance': `₹${Number(r.senior_allowance||0).toLocaleString('en-IN')}`,
              'Total Wages': `₹${Number(r.total_wages||0).toLocaleString('en-IN')}`,
            }} />
        )
      })()}
    </div>
  )
}

function StatCard({ title, value, icon, gradient }) {
  return (
    <div className="group bg-white p-7 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg`}>{icon}</div>
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
