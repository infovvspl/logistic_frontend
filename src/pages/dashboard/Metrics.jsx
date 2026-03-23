import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBarChart2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Input from '../../components/ui/Input.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
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

  const filteredRows = useMemo(() => {
    const rows = query.data?.items ?? []
    if (!searchTerm) return rows
    return rows.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [query.data, searchTerm])

  return (
    <div className="space-y-6 max-w-[900px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Metrics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage measurement units used in trips.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, item: null })}
        >
          Add Metric
        </Button>
      </div>

      {/* Stat */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Metrics</p>
          <p className="text-2xl font-bold text-zinc-900">{(query.data?.items ?? []).length}</p>
        </div>
        <div className="p-3 rounded-xl border bg-emerald-50 text-emerald-600 border-emerald-100">
          <FiBarChart2 size={20} />
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search metrics..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {query.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading...</p>
          </div>
        ) : filteredRows.length ? (
          <ul className="divide-y divide-zinc-100">
            {filteredRows.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <FiBarChart2 size={16} />
                  </div>
                  <span className="font-medium text-zinc-900">{item.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, item })} className="text-zinc-400 hover:text-blue-600">
                    <FiEdit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: item.id })} className="text-zinc-400 hover:text-red-600">
                    <FiTrash2 size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No metrics yet'}
            description={searchTerm ? `No metric matches "${searchTerm}"` : 'Add your first measurement unit.'}
            actionLabel={!searchTerm ? 'Add Metric' : undefined}
            onAction={() => setModal({ open: true, item: null })}
          />
        )}
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
        open={confirm.open}
        title="Delete metric?"
        description="This action cannot be undone."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />
    </div>
  )
}
