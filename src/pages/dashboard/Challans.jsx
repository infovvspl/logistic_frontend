import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiFileText } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
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

  const placeById = useMemo(() => { const m = new Map(); (placesQuery.data?.items ?? []).forEach((p) => m.set(String(p.id), p.name)); return m }, [placesQuery.data])
  const customerById = useMemo(() => { const m = new Map(); (customersQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c)); return m }, [customersQuery.data])
  const metricById = useMemo(() => { const m = new Map(); (metricsQuery.data?.items ?? []).forEach((x) => m.set(String(x.id), x.name)); return m }, [metricsQuery.data])
  const assignmentById = useMemo(() => { const m = new Map(); (assignmentsQuery.data?.items ?? []).forEach((a) => m.set(String(a.id), a)); return m }, [assignmentsQuery.data])
  const userById = useMemo(() => { const m = new Map(); (usersQuery.data?.items ?? []).forEach((u) => m.set(String(u.id), u)); return m }, [usersQuery.data])
  const vehicleById = useMemo(() => { const m = new Map(); (vehiclesQuery.data?.items ?? []).forEach((v) => m.set(String(v.id), v)); return m }, [vehiclesQuery.data])
  const branchById = useMemo(() => { const m = new Map(); (branchesQuery.data?.items ?? []).forEach((b) => m.set(String(b.id), b)); return m }, [branchesQuery.data])
  const companyById = useMemo(() => { const m = new Map(); (companiesQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c)); return m }, [companiesQuery.data])

  const rateChartByKey = useMemo(() => {
    const m = new Map()
    ;(rateChartsQuery.data?.items ?? []).forEach((rc) => m.set(`${rc.from_place}|${rc.to_place}|${rc.metrics_id}`, rc))
    return m
  }, [rateChartsQuery.data])

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
        quantity: t.quantity ?? '',
        transport: company?.name ?? '',
      }
    })
    return meta
  }, [tripsQuery.data, customerById, assignmentById, userById, vehicleById, branchById, companyById, placeById, metricById, rateChartByKey])

  // Build bank account options from all companies
  const bankAccounts = useMemo(() => {
    const accounts = []
    ;(companiesQuery.data?.items ?? []).forEach((c) => {
      if (c.account_no_1) accounts.push({ value: c.account_no_1, companyName: c.name, label: `${c.bank_name || 'Bank 1'} — ${c.account_no_1}${c.ifsc_code ? ` (${c.ifsc_code})` : ''}` })
      if (c.account_no_2) accounts.push({ value: c.account_no_2, companyName: c.name, label: `${c.bank_name_2 || 'Bank 2'} — ${c.account_no_2}${c.ifsc_code_2 ? ` (${c.ifsc_code_2})` : ''}` })
    })
    return accounts
  }, [companiesQuery.data])

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

  const totalAmount = allRows.reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
  const totalBalance = allRows.reduce((s, c) => s + (Number(c.balance) || 0), 0)

  const columns = useMemo(() => [
    {
      key: 'challan_no',
      header: 'Challan No.',
      render: (r) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-zinc-900">{r.challan_no}</span>
          <span className="text-[11px] text-zinc-400 font-medium">{r.tc_date ?? ''}</span>
        </div>
      ),
    },
    {
      key: 'trip',
      header: 'Trip',
      render: (r) => {
        const m = tripMeta[String(r.trip_id)] ?? {}
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
              <span>{m.fromPlace ?? '—'}</span>
              <span className="text-zinc-300">→</span>
              <span>{m.toPlace ?? '—'}</span>
            </div>
            <span className="text-[11px] text-zinc-400">{m.customerName ?? ''}</span>
          </div>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          <span className="text-xs font-bold text-zinc-700">{r.vehicle_number ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (r) => (
        <div className="flex flex-col text-[11px] text-zinc-500 font-medium">
          <span>Load: {r.weight_at_loading ?? '—'}</span>
          <span>Unload: {r.weight_at_unloading ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-900">{r.total_amount ? `₹${Number(r.total_amount).toLocaleString('en-IN')}` : '—'}</span>
          <span className="text-[11px] text-zinc-400">Bal: {r.balance ? `₹${Number(r.balance).toLocaleString('en-IN')}` : '—'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, challan: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [tripMeta])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Challans</h1>
            <p className="text-zinc-500 font-medium">Manage delivery challans and billing records.</p>
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, challan: null })}
          >
            New Challan
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Challans" value={allRows.length} icon={<FiFileText />} gradient="from-indigo-500 to-blue-500" />
          <StatCard title="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={<FaRupeeSign />} gradient="from-emerald-500 to-teal-500" />
          <StatCard title="Total Balance" value={`₹${totalBalance.toLocaleString('en-IN')}`} icon={<FaRupeeSign />} gradient="from-amber-500 to-orange-500" />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by challan no, vehicle or customer..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {challansQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No challans yet'}
                description={searchTerm ? `No challan matches "${searchTerm}"` : 'Create your first challan to get started.'}
                actionLabel={!searchTerm ? 'New Challan' : undefined}
                onAction={() => setModal({ open: true, challan: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} size="lg" title={modal.challan ? 'Edit Challan' : 'New Challan'} onClose={() => setModal({ open: false, challan: null })}>
        <ChallanForm
          defaultValues={modal.challan}
          trips={modal.challan
            ? tripsQuery.data?.items ?? []
            : (tripsQuery.data?.items ?? []).filter((t) => !allRows.some((c) => String(c.trip_id) === String(t.id)))
          }
          tripMeta={tripMeta}
          bankAccounts={bankAccounts}
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

      {view.record && (() => {
        const r = view.record
        const m = tripMeta[String(r.trip_id)] ?? {}
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Challan Details"
            data={{
              'Challan No': r.challan_no, 'TC Date': r.tc_date,
              'Customer': m.customerName || '—',
              'Route': m.fromPlace && m.toPlace ? `${m.fromPlace} → ${m.toPlace}` : '—',
              'Driver': m.driverName || '—', 'Metric': m.metric || '—',
              'Rate/Unit': m.ratePerUnit ? `₹${m.ratePerUnit}` : '—',
              'Transport': r.transport, 'Vehicle No': r.vehicle_number,
              'Permit No': r.permit_number, 'Unloading Date': r.unloading_date,
              'Description': r.description, 'HSN Code': r.hsn_code,
              'Weight (Load)': r.weight_at_loading, 'Weight (Unload)': r.weight_at_unloading,
              'Shortage': r.shortage,
              'Total Amount': r.total_amount ? `₹${Number(r.total_amount).toLocaleString('en-IN')}` : '—',
              'TDS': r.tds_amount ? `₹${Number(r.tds_amount).toLocaleString('en-IN')}` : '—',
              'Diesel Advance': r.diesel_advance ? `₹${Number(r.diesel_advance).toLocaleString('en-IN')}` : '—',
              'Driver Advance': r.advance ? `₹${Number(r.advance).toLocaleString('en-IN')}` : '—',
              'Advance Type': r.advance_type || '—',
              'Advance Amount': r.advance_amount ? `₹${Number(r.advance_amount).toLocaleString('en-IN')}` : '—',
              'Advance Date': r.advance_date || '—',
              'Other Expense': r.other_expense ? `₹${Number(r.other_expense).toLocaleString('en-IN')}` : '—',
              'Balance': r.balance ? `₹${Number(r.balance).toLocaleString('en-IN')}` : '—',
              'Remark': r.remark,
            }}
          />
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
