import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiEye, FiSearch, FiTruck, FiDollarSign, FiActivity } from 'react-icons/fi'
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
import { formatDate } from '../../utils/formatDate.js'

const STATUS_COLORS = {
  ONGOING: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  COMPLETED: 'bg-green-50 text-green-700 ring-green-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/10',
  PENDING: 'bg-zinc-50 text-zinc-600 ring-zinc-500/10',
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

  const completeMutation = useMutation({
    mutationFn: (id) => tripAPI.updateTrip(id, { status: 'COMPLETED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })

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

  const allRows = tripsQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter(
      (t) =>
        t.source?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.consignment?.toLowerCase().includes(q),
    )
  }, [allRows, searchTerm])

  const columns = useMemo(
    () => [
      {
        key: 'route',
        header: 'Route',
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <span>{r.source}</span>
              <span className="text-zinc-300">→</span>
              <span>{r.destination}</span>
            </div>
            <span className="text-xs text-zinc-400 line-clamp-1">{r.consignment || 'No consignment info'}</span>
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
              <span className="text-sm font-medium text-zinc-900">{c?.customer_name || '—'}</span>
              <span className="text-xs text-zinc-400">{c?.customer_phone || ''}</span>
            </div>
          )
        },
      },
      {
        key: 'fleet',
        header: 'Fleet & Driver',
        render: (r) => {
          const assign = assignmentById.get(String(r.vehicle_assign_to_driver_id))
          const vehicle = assign ? vehicleById.get(String(assign.vehicle_id)) : null
          const driver = assign ? userById.get(String(assign.user_id)) : null
          return (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-zinc-100 rounded text-zinc-500"><FiTruck size={13} /></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-700">{vehicle?.registration_number || 'No vehicle'}</span>
                <span className="text-[10px] text-zinc-400">{driver?.name || 'No driver'}</span>
              </div>
            </div>
          )
        },
      },
      {
        key: 'schedule',
        header: 'Schedule',
        render: (r) => (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <FiCalendar size={12} className="text-zinc-400" />
            {r.start_date_time ? formatDate(r.start_date_time) : 'N/A'}
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (r) => (
          <span className="font-semibold text-zinc-900">
            {r.amount ? `₹${Number(r.amount).toLocaleString()}` : '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[r.status] || STATUS_COLORS.PENDING}`}>
              {r.status}
            </span>
            {r.status === 'ONGOING' && (
              <button
                onClick={() => completeMutation.mutate(r.id)}
                disabled={completeMutation.isPending}
                className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                ✓ Complete
              </button>
            )}
          </div>
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
    ],
    [customerById, assignmentById, vehicleById, userById, completeMutation],
  )

  const ongoingCount = allRows.filter((t) => t.status === 'ONGOING').length
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
        <StatCard label="Total Revenue" value={`₹${totalAmount.toLocaleString()}`} icon={<FiDollarSign />} color="amber" />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by source, destination or consignment..."
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

      <Modal open={modal.open} title={modal.trip ? 'Edit Trip Record' : 'New Trip Assignment'} onClose={() => setModal({ open: false, trip: null })}>
        <TripForm
          defaultValues={modal.trip ? {
            ...modal.trip,
            start_date_time: modal.trip.start_date_time ? new Date(modal.trip.start_date_time).toISOString().slice(0, 16) : '',
            end_date_time: modal.trip.end_date_time ? new Date(modal.trip.end_date_time).toISOString().slice(0, 16) : '',
          } : null}
          customers={customersQuery.data?.items ?? []}
          assignments={assignmentsQuery.data?.items ?? []}
          drivers={usersQuery.data?.items ?? []}
          vehicles={vehiclesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.trip) {
              await updateMutation.mutateAsync({ id: modal.trip.id, values })
            } else {
              await createMutation.mutateAsync(values)
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove trip record?"
        description="This record will be permanently deleted from the logs."
        danger
        confirmText="Remove"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />

      {(() => {
        const r = view.record
        if (!r) return null
        const customer = customerById.get(String(r.customer_id))
        const assign = assignmentById.get(String(r.vehicle_assign_to_driver_id))
        const vehicle = assign ? vehicleById.get(String(assign.vehicle_id)) : null
        const driver = assign ? userById.get(String(assign.user_id)) : null
        const extra = []
        if (customer) extra.push({ title: 'Customer', data: { name: customer.customer_name, phone: customer.customer_phone, email: customer.customer_email } })
        if (vehicle) extra.push({ title: 'Vehicle', data: { registration: vehicle.registration_number, type: vehicle.vehicle_type, model: vehicle.vehicle_model } })
        if (driver) extra.push({ title: 'Driver', data: { name: driver.name, mobile: driver.mobile, license: driver.license_number } })
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Trip Details"
            data={r}
            extraSections={extra}
          />
        )
      })()}
    </div>
  )
}
