import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiArrowRight } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import RateChartForm from '../../components/forms/RateChartForm.jsx'
import * as rateChartAPI from '../../features/rateCharts/rateChartAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as metricAPI from '../../features/metrics/metricAPI.js'
import { FaRupeeSign } from "react-icons/fa";

export default function RateCharts() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const rateChartsQuery = useQuery({ queryKey: ['rate-charts'], queryFn: rateChartAPI.listRateCharts })
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: placeAPI.listPlaces })
  const metricsQuery = useQuery({ queryKey: ['metrics'], queryFn: metricAPI.listMetrics })

  const places = placesQuery.data?.items ?? []
  const metrics = metricsQuery.data?.items ?? []

  const placeById = useMemo(() => {
    const map = new Map()
    places.forEach((p) => map.set(String(p.id), p.name))
    return map
  }, [places])

  const metricById = useMemo(() => {
    const map = new Map()
    metrics.forEach((m) => map.set(String(m.id), m.name))
    return map
  }, [metrics])

  const createMutation = useMutation({
    mutationFn: rateChartAPI.createRateChart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rate-charts'] }); setModal({ open: false, item: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => rateChartAPI.updateRateChart(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rate-charts'] }); setModal({ open: false, item: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: rateChartAPI.deleteRateChart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-charts'] }),
  })

  const filteredRows = useMemo(() => {
    const rows = rateChartsQuery.data?.items ?? []
    if (!searchTerm) return rows
    const q = searchTerm.toLowerCase()
    return rows.filter((r) =>
      placeById.get(String(r.from_place))?.toLowerCase().includes(q) ||
      placeById.get(String(r.to_place))?.toLowerCase().includes(q) ||
      metricById.get(String(r.metrics_id))?.toLowerCase().includes(q)
    )
  }, [rateChartsQuery.data, searchTerm, placeById, metricById])

  const columns = useMemo(() => [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
          <span>{placeById.get(String(r.from_place)) ?? '—'}</span>
          <FiArrowRight size={14} className="text-zinc-400 shrink-0" />
          <span>{placeById.get(String(r.to_place)) ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'metrics_id',
      header: 'Metric',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
          {metricById.get(String(r.metrics_id)) ?? '—'}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (r) => (
        <span className="font-bold text-zinc-900">
          ₹{Number(r.rate).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, item: r })} className="text-zinc-400 hover:text-blue-600">
            <FiEdit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: r.id })} className="text-zinc-400 hover:text-red-600">
            <FiTrash2 size={16} />
          </Button>
        </div>
      ),
    },
  ], [placeById, metricById])

  const isLoading = rateChartsQuery.isLoading || placesQuery.isLoading || metricsQuery.isLoading

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Rate Charts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage route-based pricing for trips.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, item: null })}
        >
          Add Rate
        </Button>
      </div>

      {/* Stat */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Rates</p>
          <p className="text-2xl font-bold text-zinc-900">{(rateChartsQuery.data?.items ?? []).length}</p>
        </div>
        <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-100">
          <FaRupeeSign  size={20} />
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by place or metric..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading rate charts...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No rate charts yet'}
            description={searchTerm ? `No rate matches "${searchTerm}"` : 'Add your first route rate to get started.'}
            actionLabel={!searchTerm ? 'Add Rate' : undefined}
            onAction={() => setModal({ open: true, item: null })}
          />
        )}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Rate Chart' : 'Add Rate Chart'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <RateChartForm
          defaultValues={modal.item}
          places={places}
          metrics={metrics}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.item) await updateMutation.mutateAsync({ id: modal.item.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete rate chart?"
        description="This action cannot be undone."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />
    </div>
  )
}
