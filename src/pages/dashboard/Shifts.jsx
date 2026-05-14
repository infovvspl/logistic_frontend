import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiClock } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import ShiftForm from '../../components/forms/ShiftForm.jsx'
import * as shiftAPI from '../../features/shifts/shiftAPI.js'

export default function Shifts() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const shiftsQuery = useQuery({ 
    queryKey: ['shifts'], 
    queryFn: shiftAPI.listShifts 
  })

  const createMutation = useMutation({
    mutationFn: shiftAPI.createShift,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['shifts'] })
      setModal({ open: false, record: null }) 
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => shiftAPI.updateShift(id, values),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['shifts'] })
      setModal({ open: false, record: null }) 
    },
  })

  const deleteMutation = useMutation({
    mutationFn: shiftAPI.deleteShift,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  })

  const allRows = shiftsQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => 
      (r.shift_name ?? '').toLowerCase().includes(q)
    )
  }, [allRows, searchTerm])

  const columns = useMemo(() => [
    {
      key: 'shift_name',
      header: 'Shift Name',
      render: (r) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
            <FiClock size={18} />
          </div>
          <span className="font-bold text-zinc-900 text-sm">{r.shift_name}</span>
        </div>
      ),
    },
    {
      key: 'start_time',
      header: 'Start Time',
      render: (r) => <span className="text-sm font-semibold text-zinc-600">{r.start_time}</span>,
    },
    {
      key: 'end_time',
      header: 'End Time',
      render: (r) => <span className="text-sm font-semibold text-zinc-600">{r.end_time}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn 
            icon={<FiEdit2 />} 
            onClick={() => setModal({ open: true, record: r })} 
            hover="hover:text-amber-600 hover:bg-amber-50" 
          />
          <ActionBtn 
            icon={<FiTrash2 />} 
            onClick={() => setConfirm({ open: true, id: r.id })} 
            hover="hover:text-red-600 hover:bg-red-50" 
          />
        </div>
      ),
    },
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Shifts</h1>
            <p className="text-zinc-500 font-medium">Manage daily work schedules and timings.</p>
          </div>
          <Button variant="primary"
            className="bg-zinc-900 hover:bg-blue-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}>
            Add New Shift
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PageStatCard 
            title="Total Shifts" 
            value={allRows.length} 
            gradient="from-blue-500 to-indigo-500" 
            icon={<FiClock size={20} />} 
          />
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input type="text" placeholder="Search by shift name..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {shiftsQuery.isLoading ? (
              <div className="p-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-blue-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState 
                title={searchTerm ? 'No results' : 'No shifts defined'} 
                description="Start by creating the first shift schedule."
                actionLabel={!searchTerm ? 'Add New Shift' : undefined} 
                onAction={() => setModal({ open: true, record: null })} 
              />
            )}
          </div>
        </div>
      </div>

      <Modal 
        open={modal.open} 
        size="md" 
        title={modal.record ? 'Edit Shift' : 'Add New Shift'} 
        onClose={() => setModal({ open: false, record: null })}
      >
        <ShiftForm 
          defaultValues={modal.record}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (v) => { 
            if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values: v })
            else await createMutation.mutateAsync(v) 
          }} 
        />
      </Modal>

      <ConfirmDialog 
        open={confirm.open} 
        title="Delete shift?" 
        description="This shift schedule will be permanently removed. This may affect attendance records."
        danger 
        confirmText="Delete" 
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { 
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null }) 
        }} 
      />
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
