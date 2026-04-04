import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBarChart2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Input from '../../components/ui/Input.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import PageActionBtn from '../../components/common/PageActionBtn.jsx'
import * as metricAPI from '../../features/metrics/metricAPI.js'

function MetricForm({ defaultValues, onSubmit, loading }) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Metric name is required'); return }
    setError('')
    onSubmit({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Metric Name"
        placeholder="e.g. TON"
        value={name}
        onChange={(e) => { setName(e.target.value); setError('') }}
        error={error}
      />
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <Button type="submit" loading={loading} className="w-full md:w-auto">
          {defaultValues ? 'Update' : 'Add Metric'}
        </Button>
      </div>
    </form>
  )
}

export default function Metrics() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const query = useQuery({ queryKey: ['metrics'], queryFn: metricAPI.listMetrics })

  const createMutation = useMutation({
    mutationFn: metricAPI.createMetric,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrics'] }); setModal({ open: false, item: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => metricAPI.updateMetric(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrics'] }); setModal({ open: false, item: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: metricAPI.deleteMetric,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metrics'] }),
  })

  const allRows = query.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    return allRows.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [allRows, searchTerm])

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Metric Name',
      render: (r) => (
        <div className="flex items-center gap-4 py-1">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
            <FiBarChart2 size={16} />
          </div>
          <span className="font-semibold text-zinc-900">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <PageActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, item: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <PageActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Metrics</h1>
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, item: null })}
          >
            Add Metric
          </Button>
        </header>

        <PageStatCard title="Total Metrics" value={allRows.length} icon={<FiBarChart2 />} gradient="from-emerald-500 to-teal-500" />

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search metrics..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {query.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-emerald-50/30 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No metrics yet'}
                description={searchTerm ? `No metric matches "${searchTerm}"` : 'Add your first measurement unit.'}
                actionLabel={!searchTerm ? 'Add Metric' : undefined}
                onAction={() => setModal({ open: true, item: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.item ? 'Edit Metric' : 'Add Metric'} onClose={() => setModal({ open: false, item: null })}>
        <MetricForm
          defaultValues={modal.item}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.item) await updateMutation.mutateAsync({ id: modal.item.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete metric?" description="This action cannot be undone."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
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
