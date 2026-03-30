import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import LedgerForm from '../../components/forms/LedgerForm.jsx'
import * as ledgerAPI from '../../features/ledger/ledgerAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as billAPI from '../../features/bills/billAPI.js'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'

export default function Ledger() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, entry: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const ledgerQuery   = useQuery({ queryKey: ['ledger'],    queryFn: ledgerAPI.listLedger })
  const tripsQuery    = useQuery({ queryKey: ['trips'],     queryFn: tripAPI.listTrips })
  const billsQuery    = useQuery({ queryKey: ['bills'],     queryFn: billAPI.listBills })
  const challansQuery = useQuery({ queryKey: ['challans'],  queryFn: challanAPI.listChallans })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })
  const usersQuery    = useQuery({ queryKey: ['users'],     queryFn: userAPI.listUsers })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const placesQuery   = useQuery({ queryKey: ['places'],    queryFn: placeAPI.listPlaces })

  const createMutation = useMutation({
    mutationFn: ledgerAPI.createLedger,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger'] }); setModal({ open: false, entry: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => ledgerAPI.updateLedger(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger'] }); setModal({ open: false, entry: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: ledgerAPI.deleteLedger,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })

  const customers = customersQuery.data?.items ?? []
  const users     = usersQuery.data?.items ?? []
  const companies = companiesQuery.data?.items ?? []
  const trips     = tripsQuery.data?.items ?? []
  const bills     = billsQuery.data?.items ?? []

  const placeById = useMemo(() => {
    const m = new Map()
    ;(placesQuery.data?.items ?? []).forEach((p) => m.set(String(p.id), p.name))
    return m
  }, [placesQuery.data])

  const customerById = useMemo(() => {
    const m = new Map()
    customers.forEach((c) => m.set(String(c.id), c))
    return m
  }, [customers])

  // trip display labels: "CustomerName · From → To"
  const tripMeta = useMemo(() => {
    const meta = {}
    trips.forEach((t) => {
      const customer = customerById.get(String(t.customer_id))
      const from = placeById.get(String(t.source)) ?? ''
      const to   = placeById.get(String(t.destination)) ?? ''
      meta[String(t.id)] = {
        label: [from && to ? `${from} → ${to}` : '', customer?.customer_name ?? ''].filter(Boolean).join(' · ') || t.id,
        sub: customer?.customer_name ?? '',
      }
    })
    return meta
  }, [trips, customerById, placeById])

  // map trip_id → bill (trip → challan → bill)
  const billByTripId = useMemo(() => {
    const challans = challansQuery.data?.items ?? []
    // challan_id → trip_id
    const challanTripMap = new Map()
    challans.forEach((c) => { if (c.trip_id) challanTripMap.set(String(c.id), String(c.trip_id)) })
    // trip_id → bill
    const m = new Map()
    bills.forEach((b) => {
      if (!b.challan_id) return
      const tripId = challanTripMap.get(String(b.challan_id))
      if (tripId) m.set(tripId, b)
    })
    return m
  }, [bills, challansQuery.data])

  // Build entity lookup for display
  const entityLabel = useMemo(() => {
    const map = {}
    customers.forEach((c) => { map[`customer:${c.id}`] = c.customer_name || c.name || c.id })
    users.forEach((u) => { map[`user:${u.id}`] = u.name || u.email || u.id })
    companies.forEach((c) => { map[`company:${c.id}`] = c.name || c.id })
    return map
  }, [customers, users, companies])

  const getEntityName = (type, id) => entityLabel[`${type}:${id}`] || id || '—'

  const allRows = ledgerQuery.data?.items ?? []

  const totalCredit = allRows.filter((r) => r.transaction_type === 'credit').reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const totalDebit  = allRows.filter((r) => r.transaction_type === 'debit').reduce((s, r) => s + (Number(r.amount) || 0), 0)

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) =>
      (r.transaction_type ?? '').toLowerCase().includes(q) ||
      (r.payer_type ?? '').toLowerCase().includes(q) ||
      (r.payee_type ?? '').toLowerCase().includes(q) ||
      getEntityName(r.payer_type, r.payer_id).toLowerCase().includes(q) ||
      getEntityName(r.payee_type, r.payee_id).toLowerCase().includes(q)
    )
  }, [allRows, searchTerm, entityLabel])

  const columns = useMemo(() => [
    {
      key: 'type',
      header: 'Type',
      render: (r) => {
        const isCredit = r.transaction_type === 'credit'
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit font-bold text-xs ${
            isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {isCredit ? <FiArrowDownLeft size={13} /> : <FiArrowUpRight size={13} />}
            {isCredit ? 'Credit' : 'Debit'}
          </div>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <span className={`text-sm font-black tabular-nums ${r.transaction_type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
          {r.transaction_type === 'credit' ? '+' : '−'}₹{Number(r.amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'payer',
      header: 'Payer',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-zinc-800">{getEntityName(r.payer_type, r.payer_id)}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{r.payer_type}</span>
        </div>
      ),
    },
    {
      key: 'payee',
      header: 'Payee',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-zinc-800">{getEntityName(r.payee_type, r.payee_id)}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{r.payee_type}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, entry: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [entityLabel])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Ledger</h1>
            <p className="text-zinc-500 font-medium">Track all financial transactions and entries.</p>
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, entry: null })}
          >
            New Entry
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Entries" value={allRows.length} color="from-indigo-500 to-blue-500" />
          <StatCard title="Total Credit" value={`₹${totalCredit.toLocaleString('en-IN')}`} color="from-emerald-500 to-teal-500" icon={<FiArrowDownLeft />} />
          <StatCard title="Total Debit"  value={`₹${totalDebit.toLocaleString('en-IN')}`}  color="from-rose-500 to-red-500"     icon={<FiArrowUpRight />} />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by type, payer or payee..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {ledgerQuery.isLoading ? (
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
                title={searchTerm ? 'No results found' : 'No ledger entries yet'}
                description={searchTerm ? `No entry matches "${searchTerm}"` : 'Create your first ledger entry.'}
                actionLabel={!searchTerm ? 'New Entry' : undefined}
                onAction={() => setModal({ open: true, entry: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} size="lg" title={modal.entry ? 'Edit Entry' : 'New Ledger Entry'} onClose={() => setModal({ open: false, entry: null })}>
        <LedgerForm
          defaultValues={modal.entry}
          trips={trips}
          tripMeta={tripMeta}
          bills={bills}
          billByTripId={billByTripId}
          customers={customers}
          users={users}
          companies={companies}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.entry) await updateMutation.mutateAsync({ id: modal.entry.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete entry?" description="This ledger entry will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (
        <DetailModal
          open={view.open}
          onClose={() => setView({ open: false, record: null })}
          title="Ledger Entry"
          data={{
            'Transaction Type': view.record.transaction_type,
            'Amount': view.record.amount ? `₹${Number(view.record.amount).toLocaleString('en-IN')}` : '—',
            'Payer Type': view.record.payer_type,
            'Payer': getEntityName(view.record.payer_type, view.record.payer_id),
            'Payee Type': view.record.payee_type,
            'Payee': getEntityName(view.record.payee_type, view.record.payee_id),
            'Company': view.record.company_id ? getEntityName('company', view.record.company_id) : '—',
            'Trip ID': view.record.trip_id || '—',
            'Bill': view.record.bill_no || '—',
          }}
        />
      )}
    </div>
  )
}

function StatCard({ title, value, color, icon }) {
  return (
    <div className="group bg-white p-7 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${color} text-white shadow-lg`}>
        {icon ?? <FiArrowDownLeft />}
      </div>
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
