import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiTag, FiCheckCircle } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/ui/Input.jsx'
import * as api from '../../features/transactionPurposes/transactionPurposeAPI.js'

function PurposeForm({ defaultValues, onSubmit, loading, serverError }) {
  const [name, setName] = useState(defaultValues?.transaction_purpose_name ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    onSubmit({ transaction_purpose_name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Purpose Name" required placeholder="e.g. Payment, Refund"
        leftIcon={<FiTag />} value={name} onChange={(e) => { setName(e.target.value); setError('') }} error={error} />
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[140px]" leftIcon={<FiCheckCircle size={16} />}>
          {defaultValues ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default function TransactionPurposes() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const query = useQuery({ queryKey: ['transaction-purposes'], queryFn: api.listTransactionPurposes })

  const createMutation = useMutation({
    mutationFn: api.createTransactionPurpose,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transaction-purposes'] }); setModal({ open: false, record: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => api.updateTransactionPurpose(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transaction-purposes'] }); setModal({ open: false, record: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: api.deleteTransactionPurpose,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transaction-purposes'] }),
  })

  const allRows = query.data?.items ?? []
  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => (r.transaction_purpose_name ?? '').toLowerCase().includes(q))
  }, [allRows, searchTerm])

  const columns = [
    {
      key: 'name',
      header: 'Purpose Name',
      render: (r) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {(r.transaction_purpose_name ?? 'P')[0].toUpperCase()}
          </div>
          <span className="font-semibold text-zinc-900">{r.transaction_purpose_name}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, record: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Transaction Purposes</h1>
            {/* <p className="text-zinc-500 font-medium">Manage purpose categories for transactions.</p> */}
          </div>
          <Button variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}>
            Add Purpose
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group bg-white p-7 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Purposes</p>
              <p className="text-3xl font-bold text-zinc-900">{allRows.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-lg"><FiTag /></div>
          </div>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search purposes..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          {query.isLoading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
          ) : filteredRows.length ? (
            <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
              headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
              rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
          ) : (
            <EmptyState title={searchTerm ? 'No results' : 'No purposes yet'} description="Add a transaction purpose to get started."
              actionLabel={!searchTerm ? 'Add Purpose' : undefined} onAction={() => setModal({ open: true, record: null })} />
          )}
        </div>
      </div>

      <Modal open={modal.open} title={modal.record ? 'Edit Purpose' : 'New Purpose'} onClose={() => setModal({ open: false, record: null })}>
        <PurposeForm defaultValues={modal.record}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (v) => {
            if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values: v })
            else await createMutation.mutateAsync(v)
          }} />
      </Modal>

      <ConfirmDialog open={confirm.open} title="Delete purpose?" description="This purpose will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }} />
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
