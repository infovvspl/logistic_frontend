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
import BillForm from '../../components/forms/BillForm.jsx'
import * as billAPI from '../../features/bills/billAPI.js'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'

export default function Bills() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, bill: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const billsQuery    = useQuery({ queryKey: ['bills'],    queryFn: billAPI.listBills })
  const challansQuery = useQuery({ queryKey: ['challans'], queryFn: challanAPI.listChallans })
  const tripsQuery    = useQuery({ queryKey: ['trips'],    queryFn: tripAPI.listTrips })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })
  const placesQuery   = useQuery({ queryKey: ['places'],   queryFn: placeAPI.listPlaces })

  const createMutation = useMutation({
    mutationFn: billAPI.createBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setModal({ open: false, bill: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => billAPI.updateBill(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setModal({ open: false, bill: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: billAPI.deleteBill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  })

  const customerById = useMemo(() => {
    const m = new Map()
    ;(customersQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c))
    return m
  }, [customersQuery.data])

  const placeById = useMemo(() => {
    const m = new Map()
    ;(placesQuery.data?.items ?? []).forEach((p) => m.set(String(p.id), p.name))
    return m
  }, [placesQuery.data])

  const tripById = useMemo(() => {
    const m = new Map()
    ;(tripsQuery.data?.items ?? []).forEach((t) => m.set(String(t.id), t))
    return m
  }, [tripsQuery.data])

  // Build challan metadata: customer name + route from trip
  const challanMeta = useMemo(() => {
    const meta = {}
    ;(challansQuery.data?.items ?? []).forEach((c) => {
      const trip = tripById.get(String(c.trip_id))
      const customer = trip ? customerById.get(String(trip.customer_id)) : null
      const from = trip ? (placeById.get(String(trip.source)) ?? '') : ''
      const to   = trip ? (placeById.get(String(trip.destination)) ?? '') : ''
      meta[String(c.id)] = {
        customerName: customer?.customer_name ?? '',
        route: from && to ? `${from} → ${to}` : '',
      }
    })
    return meta
  }, [challansQuery.data, tripById, customerById, placeById])

  const allRows = billsQuery.data?.items ?? []
  const challans = challansQuery.data?.items ?? []

  // For new bill creation, only show challans that don't already have a bill
  const billedChallanIds = useMemo(() => new Set(allRows.map((b) => String(b.challan_id))), [allRows])
  const availableChallans = useMemo(
    () => challans.filter((c) => !billedChallanIds.has(String(c.id))),
    [challans, billedChallanIds]
  )

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((b) => {
      const challan = challans.find((c) => String(c.id) === String(b.challan_id))
      const m = challanMeta[String(b.challan_id)] ?? {}
      return (
        (b.bill_no ?? '').toLowerCase().includes(q) ||
        (challan?.challan_no ?? '').toLowerCase().includes(q) ||
        (m.customerName ?? '').toLowerCase().includes(q)
      )
    })
  }, [allRows, searchTerm, challans, challanMeta])

  const columns = useMemo(() => [
    {
      key: 'bill_no',
      header: 'Bill No.',
      render: (r) => (
        <div className="flex items-center gap-2 py-1">
          <FiFileText size={14} className="text-zinc-400 shrink-0" />
          <span className="font-bold text-zinc-900">{r.bill_no}</span>
        </div>
      ),
    },
    {
      key: 'challan',
      header: 'Challan',
      render: (r) => {
        const challan = challans.find((c) => String(c.id) === String(r.challan_id))
        const m = challanMeta[String(r.challan_id)] ?? {}
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-zinc-800">{challan?.challan_no ?? '—'}</span>
            <span className="text-[11px] text-zinc-400">{m.customerName ?? ''} <br /> {m.route ? `  ${m.route}` : ''}</span>
          </div>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => {
        const challan = challans.find((c) => String(c.id) === String(r.challan_id))
        return challan?.total_amount
          ? <span className="text-xs font-bold text-zinc-900">₹{Number(challan.total_amount).toLocaleString('en-IN')}</span>
          : <span className="text-xs text-zinc-400">—</span>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, bill: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [challans, challanMeta])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Bills</h1>
            {/* <p className="text-zinc-500 font-medium">Manage billing records linked to challans.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, bill: null })}
          >
            New Bill
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Bills" value={allRows.length} icon={<FiFileText />} gradient="from-indigo-500 to-blue-500" />
          <StatCard
            title="Total Amount"
            value={`₹${challans
              .filter((c) => allRows.some((b) => String(b.challan_id) === String(c.id)))
              .reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
              .toLocaleString('en-IN')}`}
            icon={<FaRupeeSign />}
            gradient="from-emerald-500 to-teal-500"
          />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by bill no, challan or customer..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {billsQuery.isLoading ? (
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
                title={searchTerm ? 'No results found' : 'No bills yet'}
                description={searchTerm ? `No bill matches "${searchTerm}"` : 'Create your first bill to get started.'}
                actionLabel={!searchTerm ? 'New Bill' : undefined}
                onAction={() => setModal({ open: true, bill: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.bill ? 'Edit Bill' : 'New Bill'} onClose={() => setModal({ open: false, bill: null })}>
        <BillForm
          defaultValues={modal.bill}
          challans={modal.bill ? challans : availableChallans}
          challanMeta={challanMeta}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.bill) {
              await updateMutation.mutateAsync({ id: modal.bill.id, values })
            } else {
              // create one bill per selected challan
              const { bill_no, challan_ids } = values
              await Promise.all(
                challan_ids.map((challan_id) =>
                  createMutation.mutateAsync({ bill_no, challan_id })
                )
              )
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete bill?" description="This record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (() => {
        const r = view.record
        const challan = challans.find((c) => String(c.id) === String(r.challan_id))
        const m = challanMeta[String(r.challan_id)] ?? {}
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Bill Details"
            data={{
              'Bill No': r.bill_no,
              'Challan No': challan?.challan_no ?? '—',
              'Customer': m.customerName || '—',
              'Route': m.route || '—',
              'Total Amount': challan?.total_amount ? `₹${Number(challan.total_amount).toLocaleString('en-IN')}` : '—',
              'Balance': challan?.balance ? `₹${Number(challan.balance).toLocaleString('en-IN')}` : '—',
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
