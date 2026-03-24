import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiEye, FiSearch, FiTruck, FiDollarSign, FiActivity, FiChevronDown } from 'react-icons/fi'
import { FaRupeeSign } from "react-icons/fa";
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import TripForm from '../../components/forms/TripForm.jsx'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as consignmentAPI from '../../features/consignments/consignmentAPI.js'
import * as metricAPI from '../../features/metrics/metricAPI.js'
import * as rateChartAPI from '../../features/rateCharts/rateChartAPI.js'
import { formatDate } from '../../utils/formatDate.js'

const STATUS_COLORS = {
  SCHEDULED: 'bg-zinc-50 text-zinc-600 ring-zinc-500/10',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  COMPLETED: 'bg-green-50 text-green-700 ring-green-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/10',
}

const STATUS_OPTIONS = ['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function StatusDropdown({ tripId, current, onUpdate, loading }) {
  const [open, setOpen] = useState(false)

  if (current === 'COMPLETED') return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[current]}`}>
      {STATUS_LABELS[current] ?? current}
    </span>
  )

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors disabled:opacity-50 ${STATUS_COLORS[current] ?? STATUS_COLORS.SCHEDULED}`}
      >
        {STATUS_LABELS[current] ?? current}
        <FiChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 min-w-[150px] pointer-events-auto">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                  s === current ? 'opacity-40 cursor-default' : 'hover:bg-zinc-50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (s !== current) { onUpdate(tripId, s); setOpen(false) }
                }}
              >
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 ring-1 ring-inset ${STATUS_COLORS[s]}`}>{STATUS_LABELS[s] ?? s}</span>
                {s === current && <span className="text-[10px] text-zinc-400 ml-1">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }
  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl border ${colors[color]}`}>{icon}</div>
    </div>
  )
}

export default function Trips() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, trip: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: tripAPI.listTrips })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })
  const assignmentsQuery = useQuery({ queryKey: ['assignments'], queryFn: assignmentAPI.listAssignments })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: userAPI.listUsers })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: placeAPI.listPlaces })
  const consignmentsQuery = useQuery({ queryKey: ['consignments'], queryFn: consignmentAPI.listConsignments })
  const metricsQuery = useQuery({ queryKey: ['metrics'], queryFn: metricAPI.listMetrics })
  const rateChartsQuery = useQuery({ queryKey: ['rate-charts'], queryFn: rateChartAPI.listRateCharts })

  const createMutation = useMutation({
    mutationFn: tripAPI.createTrip,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); setModal({ open: false, trip: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => tripAPI.updateTrip(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); setModal({ open: false, trip: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: tripAPI.deleteTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => tripAPI.updateTrip(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })

  // Lookup maps
  const customerById = useMemo(() => {
    const map = new Map()
    ;(customersQuery.data?.items ?? []).forEach((c) => map.set(String(c.id), c))
    return map
  }, [customersQuery.data])

  const assignmentById = useMemo(() => {
    const map = new Map()
    ;(assignmentsQuery.data?.items ?? []).forEach((a) => map.set(String(a.id), a))
    return map
  }, [assignmentsQuery.data])

  const userById = useMemo(() => {
    const map = new Map()
    ;(usersQuery.data?.items ?? []).forEach((u) => map.set(String(u.id), u))
    return map
  }, [usersQuery.data])

  const vehicleById = useMemo(() => {
    const map = new Map()
    ;(vehiclesQuery.data?.items ?? []).forEach((v) => map.set(String(v.id), v))
    return map
  }, [vehiclesQuery.data])

  const placeById = useMemo(() => {
    const map = new Map()
    ;(placesQuery.data?.items ?? []).forEach((p) => map.set(String(p.id), p.name))
    return map
  }, [placesQuery.data])

  const consignmentById = useMemo(() => {
    const map = new Map()
    ;(consignmentsQuery.data?.items ?? []).forEach((c) => map.set(String(c.id), c.name))
    return map
  }, [consignmentsQuery.data])

  const metricById = useMemo(() => {
    const map = new Map()
    ;(metricsQuery.data?.items ?? []).forEach((m) => map.set(String(m.id), m.name))
    return map
  }, [metricsQuery.data])

  const allRows = tripsQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((t) =>
      placeById.get(String(t.source))?.toLowerCase().includes(q) ||
      placeById.get(String(t.destination))?.toLowerCase().includes(q) ||
      consignmentById.get(String(t.consignment))?.toLowerCase().includes(q) ||
      customerById.get(String(t.customer_id))?.customer_name?.toLowerCase().includes(q)
    )
  }, [allRows, searchTerm, placeById, consignmentById, customerById])

  const columns = useMemo(() => [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <span>{placeById.get(String(r.source)) ?? '—'}</span>
            <span className="text-zinc-300">→</span>
            <span>{placeById.get(String(r.destination)) ?? '—'}</span>
          </div>
          <span className="text-xs text-zinc-400">
            {consignmentById.get(String(r.consignment)) ?? '—'}
            {r.quantity ? ` · ${r.quantity} ${metricById.get(String(r.metrics)) ?? ''}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => {
        const c = customerById.get(String(r.customer_id))
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900">{c?.customer_name ?? '—'}</span>
            <span className="text-xs text-zinc-400">{c?.customer_phone ?? ''}</span>
          </div>
        )
      },
    },
    {
      key: 'fleet',
      header: 'Vehicle',
      render: (r) => {
        const assign = assignmentById.get(String(r.vehicle_assign_id))
        const vehicle = assign ? vehicleById.get(String(assign.vehicle_id)) : null
        const driver = assign ? userById.get(String(assign.driver_id || assign.user_id)) : null
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 rounded text-zinc-500"><FiTruck size={13} /></div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-700">{vehicle?.registration_number ?? '—'}</span>
              <span className="text-[10px] text-zinc-400">{driver?.name ?? 'No driver'}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'schedule',
      header: 'Start',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <FiCalendar size={12} className="text-zinc-400" />
          {r.start_date_time ? formatDate(r.start_date_time) : '—'}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <span className="font-semibold text-zinc-900">
          {r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusDropdown
          tripId={r.id}
          current={r.status}
          onUpdate={(id, status) => statusMutation.mutate({ id, status })}
          loading={statusMutation.isPending}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setView({ open: true, record: r })} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><FiEye size={15} /></button>
          <button onClick={() => setModal({ open: true, trip: r })} className="p-2 rounded-lg hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"><FiEdit2 size={15} /></button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
        </div>
      ),
    },
  ], [customerById, assignmentById, vehicleById, userById, placeById, consignmentById, metricById, statusMutation])

  const ongoingCount = allRows.filter((t) => t.status === 'IN_TRANSIT').length
  const completedCount = allRows.filter((t) => t.status === 'COMPLETED').length
  const totalAmount = allRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Trips</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track and manage vehicle logistics operations.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, trip: null })}
        >
          Create Trip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Ongoing Trips" value={ongoingCount} icon={<FiActivity />} color="blue" />
        <StatCard label="Completed" value={completedCount} icon={<FiTruck />} color="emerald" />
        <StatCard label="Total Revenue" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={<FaRupeeSign />} color="amber" />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by place, consignment or customer..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {tripsQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading trips...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No trips recorded'}
            description={searchTerm ? `No trip matches "${searchTerm}"` : 'Launch your first trip to start tracking logistics.'}
            actionLabel={!searchTerm ? 'Create Trip' : undefined}
            onAction={() => setModal({ open: true, trip: null })}
          />
        )}
      </div>

      {/* Trip Form Modal */}
      <Modal open={modal.open} size="lg" title={modal.trip ? 'Edit Trip' : 'New Trip'} onClose={() => setModal({ open: false, trip: null })}>
        <TripForm
          defaultValues={modal.trip}
          customers={customersQuery.data?.items ?? []}
          assignments={assignmentsQuery.data?.items ?? []}
          drivers={usersQuery.data?.items ?? []}
          vehicles={vehiclesQuery.data?.items ?? []}
          places={placesQuery.data?.items ?? []}
          consignments={consignmentsQuery.data?.items ?? []}
          metrics={metricsQuery.data?.items ?? []}
          rateCharts={rateChartsQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.trip) await updateMutation.mutateAsync({ id: modal.trip.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove trip?"
        description="This record will be permanently deleted."
        danger confirmText="Remove" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {/* Detail Modal */}
      {(() => {
        const r = view.record
        if (!r) return null
        const customer = customerById.get(String(r.customer_id))
        const assign = assignmentById.get(String(r.vehicle_assign_id))
        const vehicle = assign ? vehicleById.get(String(assign.vehicle_id)) : null
        const driver = assign ? userById.get(String(assign.driver_id || assign.user_id)) : null
        const extra = []
        if (customer) extra.push({ title: 'Customer', data: { Name: customer.customer_name, Phone: customer.customer_phone, Email: customer.customer_email } })
        if (vehicle) extra.push({ title: 'Vehicle', data: { Registration: vehicle.registration_number, Type: vehicle.vehicle_type, Model: vehicle.vehicle_model } })
        if (driver) extra.push({ title: 'Driver', data: { Name: driver.name, Mobile: driver.mobile } })
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Trip Details"
            data={{
              Status: r.status,
              Source: placeById.get(String(r.source)) ?? r.source,
              Destination: placeById.get(String(r.destination)) ?? r.destination,
              Consignment: consignmentById.get(String(r.consignment)) ?? r.consignment,
              Metric: metricById.get(String(r.metrics)) ?? r.metrics,
              Quantity: r.quantity ?? '—',
              Amount: r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—',
              'Start Date': r.start_date_time ? new Date(r.start_date_time).toLocaleString() : '—',
              'End Date': r.end_date_time ? new Date(r.end_date_time).toLocaleString() : '—',
            }}
            extraSections={extra}
          />
        )
      })()}
    </div>
  )
}
