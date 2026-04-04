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
import WagesForm from '../../components/forms/WagesForm.jsx'
import * as wagesAPI from '../../features/wages/wagesAPI.js'
import * as userAPI from '../../features/users/userAPI.js'

export default function Wages() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, record: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const wagesQuery = useQuery({ queryKey: ['wages'], queryFn: wagesAPI.listWages })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: userAPI.listUsers })

  const createMutation = useMutation({
    mutationFn: wagesAPI.createWages,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wages'] }); setModal({ open: false, record: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => wagesAPI.updateWages(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wages'] }); setModal({ open: false, record: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: wagesAPI.deleteWages,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wages'] }),
  })

  const users = usersQuery.data?.items ?? []
  const userById = useMemo(() => { const m = new Map(); users.forEach((u) => m.set(String(u.id), u)); return m }, [users])
  const allRows = wagesQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => {
      const u = userById.get(String(r.user_id))
      return (u?.name ?? '').toLowerCase().includes(q) || (u?.email ?? '').toLowerCase().includes(q)
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
              <span className="text-[11px] text-zinc-400">{u?.email || ''}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'normal_wages',
      header: 'Normal Wages',
      render: (r) => <span className="text-sm font-black text-zinc-900 tabular-nums">₹{Number(r.normal_wages || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'ot_wages',
      header: 'OT Rate',
      render: (r) => <span className="text-xs font-semibold text-zinc-600">₹{Number(r.ot_wages || 0).toLocaleString('en-IN')}/hr</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (r) => (
        <div className="flex gap-2 text-[11px] font-semibold text-zinc-500">
          <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">PF {r.pf_percentage}%</span>
          <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">ESIC {r.esic_percentage}%</span>
        </div>
      ),
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
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Wages</h1>
            {/* <p className="text-zinc-500 font-medium">Define wage structures for employees.</p> */}
          </div>
          <Button variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}>
            Add Wages
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Records" value={allRows.length} gradient="from-indigo-500 to-blue-500" icon={<FaRupeeSign />} />
          <StatCard title="Avg Normal Wages" value={allRows.length ? `₹${Math.round(allRows.reduce((s,r) => s + Number(r.normal_wages||0), 0) / allRows.length).toLocaleString('en-IN')}` : '—'} gradient="from-emerald-500 to-teal-500" icon={<FaRupeeSign />} />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by employee..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {wagesQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState title={searchTerm ? 'No results' : 'No wages records'} description="Add a wage structure to get started."
                actionLabel={!searchTerm ? 'Add Wages' : undefined} onAction={() => setModal({ open: true, record: null })} />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.record ? 'Edit Wages' : 'New Wages'} onClose={() => setModal({ open: false, record: null })}>
        <WagesForm defaultValues={modal.record} users={users}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (v) => { if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values: v }); else await createMutation.mutateAsync(v) }} />
      </Modal>

      <ConfirmDialog open={confirm.open} title="Delete wages?" description="This wages record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }} />

      {view.record && (() => {
        const u = userById.get(String(view.record.user_id))
        return (
          <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Wages Details"
            data={{
              'Employee': u?.name || u?.email || view.record.user_id,
              'Normal Wages': `₹${Number(view.record.normal_wages||0).toLocaleString('en-IN')}`,
              'OT Wages': `₹${Number(view.record.ot_wages||0).toLocaleString('en-IN')}/hr`,
              'PF %': view.record.pf_percentage,
              'ESIC %': view.record.esic_percentage,
              'Senior Allowance': `₹${Number(view.record.senior_allowance||0).toLocaleString('en-IN')}`,
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
