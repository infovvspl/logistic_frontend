import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowRight } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import RateChartForm from '../../components/forms/RateChartForm.jsx'
import * as rateChartAPI from '../../features/rateCharts/rateChartAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as metricAPI from '../../features/metrics/metricAPI.js'

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

  const placeById = useMemo(() => { const m = new Map(); places.forEach((p) => m.set(String(p.id), p.name)); return m }, [places])
  const metricById = useMemo(() => { const m = new Map(); metrics.forEach((x) => m.set(String(x.id), x.name)); return m }, [metrics])

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

  const allRows = rateChartsQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) =>
      placeById.get(String(r.from_place))?.toLowerCase().includes(q) ||
      placeById.get(String(r.to_place))?.toLowerCase().includes(q) ||
      metricById.get(String(r.metrics_id))?.toLowerCase().includes(q)
    )
  }, [allRows, searchTerm, placeById, metricById])

  const columns = useMemo(() => [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <div className="flex items-center gap-2 py-1">
          <span className="font-semibold text-zinc-900">{placeById.get(String(r.from_place)) ?? '—'}</span>
          <FiArrowRight size={14} className="text-zinc-300 shrink-0" />
          <span className="font-semibold text-zinc-900">{placeById.get(String(r.to_place)) ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'metrics_id',
      header: 'Metric',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 w-fit">
          <span className="text-xs font-bold text-emerald-700">{metricById.get(String(r.metrics_id)) ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (r) => (
        <span className="text-xs font-bold text-zinc-900">₹{Number(r.rate).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, item: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [placeById, metricById])

  const isLoading = rateChartsQuery.isLoading || placesQuery.isLoading || metricsQuery.isLoading

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Rate Charts</h1>
            <p className="text-zinc-500 font-medium">Manage route-based pricing for trips.</p>
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-blue-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, item: null })}
          >
            Add Rate
          </Button>
        </header>

        <StatCard title="Total Rates" value={allRows.length} icon={<FaRupeeSign />} gradient="from-blue-500 to-indigo-600" />

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by place or metric..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-blue-50/30 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No rate charts yet'}
                description={searchTerm ? `No rate matches "${searchTerm}"` : 'Add your first route rate to get started.'}
                actionLabel={!searchTerm ? 'Add Rate' : undefined}
                onAction={() => setModal({ open: true, item: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.item ? 'Edit Rate Chart' : 'Add Rate Chart'} onClose={() => setModal({ open: false, item: null })}>
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
        open={confirm.open} title="Delete rate chart?" description="This action cannot be undone."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />
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
