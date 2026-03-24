import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiFileText } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import ChallanForm from '../../components/forms/ChallanForm.jsx'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as metricAPI from '../../features/metrics/metricAPI.js'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as rateChartAPI from '../../features/rateCharts/rateChartAPI.js'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'

function StatCard({ label, value, color }) {
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
      <div className={`p-3 rounded-xl border ${colors[color]}`}><FiFileText /></div>
    </div>
  )
}

export default function Challans() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, challan: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const challansQuery = useQuery({ queryKey: ['challans'], queryFn: challanAPI.listChallans })
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: tripAPI.listTrips })
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: placeAPI.listPlaces })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })
  const metricsQuery = useQuery({ queryKey: ['metrics'], queryFn: metricAPI.listMetrics })
  const assignmentsQuery = useQuery({ queryKey: ['assignments'], queryFn: assignmentAPI.listAssignments })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: userAPI.listUsers })
  const rateChartsQuery = useQuery({ queryKey: ['rate-charts'], queryFn: rateChartAPI.listRateCharts })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })

  const createMutation = useMutation({
    mutationFn: challanAPI.createChallan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challans'] }); setModal({ open: false, challan: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => challanAPI.updateChallan(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challans'] }); setModal({ open: false, challan: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: challanAPI.deleteChallan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challans'] }),
  })

  // Lookup maps
  const placeById = useMemo(() => {
    const m = new Map(); (placesQuery.data?.items ?? []).forEach((p) => m.set(String(p.id), p.name)); return m
  }, [placesQuery.data])

  const customerById = useMemo(() => {
    const m = new Map(); (customersQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c)); return m
  }, [customersQuery.data])

  const metricById = useMemo(() => {
    const m = new Map(); (metricsQuery.data?.items ?? []).forEach((x) => m.set(String(x.id), x.name)); return m
  }, [metricsQuery.data])

  const assignmentById = useMemo(() => {
    const m = new Map(); (assignmentsQuery.data?.items ?? []).forEach((a) => m.set(String(a.id), a)); return m
  }, [assignmentsQuery.data])

  const userById = useMemo(() => {
    const m = new Map(); (usersQuery.data?.items ?? []).forEach((u) => m.set(String(u.id), u)); return m
  }, [usersQuery.data])

  const vehicleById = useMemo(() => {
    const m = new Map(); (vehiclesQuery.data?.items ?? []).forEach((v) => m.set(String(v.id), v)); return m
  }, [vehiclesQuery.data])

  const branchById = useMemo(() => {
    const m = new Map(); (branchesQuery.data?.items ?? []).forEach((b) => m.set(String(b.id), b)); return m
  }, [branchesQuery.data])

  const companyById = useMemo(() => {
    const m = new Map(); (companiesQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c)); return m
  }, [companiesQuery.data])

  const rateChartByKey = useMemo(() => {
    const m = new Map()
    ;(rateChartsQuery.data?.items ?? []).forEach((rc) => {
      m.set(`${rc.from_place}|${rc.to_place}|${rc.metrics_id}`, rc)
    })
    return m
  }, [rateChartsQuery.data])

  // Build trip metadata map for the form
  const tripMeta = useMemo(() => {
    const meta = {}
    ;(tripsQuery.data?.items ?? []).forEach((t) => {
      const customer = customerById.get(String(t.customer_id))
      const assign = assignmentById.get(String(t.vehicle_assign_id))
      const driver = assign ? userById.get(String(assign.driver_id || assign.user_id)) : null
      const vehicle = assign ? vehicleById.get(String(assign.vehicle_id)) : null
      const branch = vehicle ? branchById.get(String(vehicle.branch_id)) : null
      const company = branch ? companyById.get(String(branch.company_id)) : null
      const rc = rateChartByKey.get(`${t.source}|${t.destination}|${t.metrics}`)
      meta[String(t.id)] = {
        customerName: customer?.customer_name ?? '',
        fromPlace: placeById.get(String(t.source)) ?? '',
        toPlace: placeById.get(String(t.destination)) ?? '',
        metric: metricById.get(String(t.metrics)) ?? '',
        ratePerUnit: rc?.rate ?? '',
        driverName: driver?.name ?? '',
        vehicleNumber: vehicle?.registration_number ?? '',
        endDateTime: t.end_date_time ? t.end_date_time.slice(0, 10) : '',
        tripAmount: t.amount ?? '',
        transport: company?.name ?? '',
      }
    })
    return meta
  }, [tripsQuery.data, customerById, assignmentById, userById, vehicleById, branchById, companyById, placeById, metricById, rateChartByKey])

  const allRows = challansQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((c) =>
      (c.challan_no ?? '').toLowerCase().includes(q) ||
      (c.vehicle_number ?? '').toLowerCase().includes(q) ||
      (tripMeta[String(c.trip_id)]?.customerName ?? '').toLowerCase().includes(q)
    )
  }, [allRows, searchTerm, tripMeta])

  const columns = useMemo(() => [
    {
      key: 'challan_no',
      header: 'Challan No.',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{r.challan_no}</span>
          <span className="text-xs text-zinc-400">{r.tc_date ?? ''}</span>
        </div>
      ),
    },
    {
      key: 'trip',
      header: 'Trip',
      render: (r) => {
        const m = tripMeta[String(r.trip_id)] ?? {}
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900">{m.fromPlace ?? '—'} → {m.toPlace ?? '—'}</span>
            <span className="text-xs text-zinc-400">{m.customerName ?? ''}</span>
          </div>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (r) => <span className="text-sm text-zinc-700">{r.vehicle_number ?? '—'}</span>,
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (r) => (
        <div className="flex flex-col text-xs text-zinc-600">
          <span>Load: {r.weight_at_loading ?? '—'}</span>
          <span>Unload: {r.weight_at_unloading ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-zinc-900">{r.total_amount ? `₹${Number(r.total_amount).toLocaleString('en-IN')}` : '—'}</span>
          <span className="text-zinc-400">Bal: {r.balance ? `₹${Number(r.balance).toLocaleString('en-IN')}` : '—'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setView({ open: true, record: r })} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><FiEye size={15} /></button>
          <button onClick={() => setModal({ open: true, challan: r })} className="p-2 rounded-lg hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"><FiEdit2 size={15} /></button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
        </div>
      ),
    },
  ], [tripMeta])

  const totalAmount = allRows.reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
  const totalBalance = allRows.reduce((s, c) => s + (Number(c.balance) || 0), 0)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Challans</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage delivery challans and billing records.</p>
        </div>
        <Button variant="primary" className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />} onClick={() => setModal({ open: true, challan: null })}>
          New Challan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Challans" value={allRows.length} color="blue" />
        <StatCard label="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} color="emerald" />
        <StatCard label="Total Balance" value={`₹${totalBalance.toLocaleString('en-IN')}`} color="amber" />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input type="text" placeholder="Search by challan no, vehicle or customer..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {challansQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading challans...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No challans yet'}
            description={searchTerm ? `No challan matches "${searchTerm}"` : 'Create your first challan to get started.'}
            actionLabel={!searchTerm ? 'New Challan' : undefined}
            onAction={() => setModal({ open: true, challan: null })}
          />
        )}
      </div>

      {/* Form Modal */}
      <Modal open={modal.open} size="lg" title={modal.challan ? 'Edit Challan' : 'New Challan'} onClose={() => setModal({ open: false, challan: null })}>
        <ChallanForm
          defaultValues={modal.challan}
          trips={tripsQuery.data?.items ?? []}
          tripMeta={tripMeta}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.challan) await updateMutation.mutateAsync({ id: modal.challan.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete challan?" description="This record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {/* Detail Modal */}
      {view.record && (() => {
        const r = view.record
        const m = tripMeta[String(r.trip_id)] ?? {}
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Challan Details"
            data={{
              'Challan No': r.challan_no,
              'TC Date': r.tc_date,
              'Customer': m.customerName || '—',
              'Route': m.fromPlace && m.toPlace ? `${m.fromPlace} → ${m.toPlace}` : '—',
              'Driver': m.driverName || '—',
              'Metric': m.metric || '—',
              'Rate/Unit': m.ratePerUnit ? `₹${m.ratePerUnit}` : '—',
              'Transport': r.transport,
              'Vehicle No': r.vehicle_number,
              'Permit No': r.permit_number,
              'Unloading Date': r.unloading_date,
              'Description': r.description,
              'HSN Code': r.hsn_code,
              'Weight (Load)': r.weight_at_loading,
              'Weight (Unload)': r.weight_at_unloading,
              'Shortage': r.shortage,
              'Total Amount': r.total_amount ? `₹${Number(r.total_amount).toLocaleString('en-IN')}` : '—',
              'TDS': r.tds ? `₹${Number(r.tds).toLocaleString('en-IN')}` : '—',
              'Advance': r.advance ? `₹${Number(r.advance).toLocaleString('en-IN')}` : '—',
              'Balance': r.balance ? `₹${Number(r.balance).toLocaleString('en-IN')}` : '—',
              'Remark': r.remark,
            }}
          />
        )
      })()}
    </div>
  )
}
