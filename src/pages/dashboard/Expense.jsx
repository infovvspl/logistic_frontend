import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiArrowDownLeft, FiFilter, FiCheck, FiX } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import ExpenseForm from '../../components/forms/ExpenseForm.jsx'
import * as ledgerAPI from '../../features/ledger/ledgerAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as txnPurposeAPI from '../../features/transactionPurposes/transactionPurposeAPI.js'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'

export default function Expense() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [customFilterOpen, setCustomFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const customFilterRef = useRef(null)
  const [customFilter, setCustomFilter] = useState({ startDate: '', endDate: '' })
  const [modal, setModal] = useState({ open: false, entry: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  useEffect(() => {
    function handler(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
      if (customFilterRef.current && !customFilterRef.current.contains(e.target)) setCustomFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const expenseQuery = useQuery({ queryKey: ['expenses'], queryFn: ledgerAPI.listExpenses })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: userAPI.listUsers })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const txnPurposesQuery = useQuery({ queryKey: ['transaction-purposes'], queryFn: txnPurposeAPI.listTransactionPurposes })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })

  const createMutation = useMutation({
    mutationFn: ledgerAPI.createExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setModal({ open: false, entry: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => ledgerAPI.updateExpense(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setModal({ open: false, entry: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: ledgerAPI.deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  const customers = customersQuery.data?.items ?? []
  const users = usersQuery.data?.items ?? []
  const companies = companiesQuery.data?.items ?? []
  const vehicles = vehiclesQuery.data?.items ?? []

  const vehicleById = useMemo(() => {
    const m = new Map()
    vehicles.forEach((v) => m.set(String(v.id), v))
    return m
  }, [vehicles])

  const customerById = useMemo(() => {
    const m = new Map()
    customers.forEach((c) => m.set(String(c.id), c))
    return m
  }, [customers])

  const userById = useMemo(() => {
    const m = new Map()
    users.forEach((u) => m.set(String(u.id), u))
    return m
  }, [users])

  // Build entity lookup for display
  const entityLabel = useMemo(() => {
    const map = {}
    customers.forEach((c) => { map[`customer:${c.id}`] = c.customer_name || c.name || c.id })
    users.forEach((u) => { map[`user:${u.id}`] = u.name || u.email || u.id })
    companies.forEach((c) => { map[`company:${c.id}`] = c.name || c.id })
    return map
  }, [customers, users, companies])

  const getEntityName = (type, id) => entityLabel[`${type}:${id}`] || id || '—'

  const allRows = expenseQuery.data?.items ?? []

  const totalAmount = allRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

  const filteredRows = useMemo(() => {
    let rows = allRows

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter((r) =>
        (r.transaction_type ?? '').toLowerCase().includes(q) ||
        (r.expense_head ?? '').toLowerCase().includes(q) ||
        (r.bill_no ?? '').toLowerCase().includes(q) ||
        getEntityName(r.payer_type, r.payer_id).toLowerCase().includes(q)
      )
    }

    const getDate = (r) => {
      const raw = r.created_at ?? r.date ?? r.transaction_date ?? ''
      return raw ? new Date(raw) : null
    }

    if (activeFilter === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
      rows = rows.filter((r) => { const d = getDate(r); return d && d >= today && d < tomorrow })
    } else if (activeFilter === 'yesterday') {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      rows = rows.filter((r) => { const d = getDate(r); return d && d >= yesterday && d < today })
    } else if (activeFilter === '7days') {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); sevenDaysAgo.setHours(0, 0, 0, 0)
      rows = rows.filter((r) => { const d = getDate(r); return d && d >= sevenDaysAgo })
    } else if (activeFilter === 'custom' && customFilter.startDate && customFilter.endDate) {
      const start = new Date(customFilter.startDate); start.setHours(0, 0, 0, 0)
      const end = new Date(customFilter.endDate); end.setHours(23, 59, 59, 999)
      rows = rows.filter((r) => { const d = getDate(r); return d && d >= start && d <= end })
    }

    return rows
  }, [allRows, searchTerm, entityLabel, activeFilter, customFilter])

  const columns = useMemo(() => [
    {
      key: 'expense_head',
      header: 'Expense Head',
      render: (r) => (
        <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 font-semibold text-xs">
          {r.expense_head || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <span className="text-sm font-black tabular-nums text-zinc-900">
          ₹{Number(r.amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'txn_type',
      header: 'Method',
      render: (r) => (
        <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 font-semibold text-xs capitalize">
          {(r.transaction_type ?? '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (r) => {
        const p = (txnPurposesQuery.data?.items ?? []).find((x) => String(x.id) === String(r.transaction_purpose))
        return (
          <span className="text-xs font-medium text-zinc-700">
            {p?.transaction_purpose_name || '—'}
          </span>
        )
      },
    },
    {
      key: 'bill_no',
      header: 'Bill No',
      render: (r) => (
        <span className="text-xs font-mono text-zinc-600">
          {r.bill_no || '—'}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (r) => {
        if (!r.vehicle_id) return <span className="text-zinc-400 text-xs">—</span>
        const v = vehicleById.get(String(r.vehicle_id))
        return v ? (
          <span className="text-xs font-medium text-zinc-700">{v.registration_number}</span>
        ) : <span className="text-zinc-400 text-xs">{r.vehicle_id}</span>
      },
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => {
        if (!r.customer_id) return <span className="text-zinc-400 text-xs">—</span>
        const c = customerById.get(String(r.customer_id))
        return c ? (
          <span className="text-xs font-medium text-zinc-700">{c.customer_name || c.name}</span>
        ) : <span className="text-zinc-400 text-xs">{r.customer_id}</span>
      },
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (r) => {
        if (!r.driver_id) return <span className="text-zinc-400 text-xs">—</span>
        const d = userById.get(String(r.driver_id))
        return d ? (
          <span className="text-xs font-medium text-zinc-700">{d.name}</span>
        ) : <span className="text-zinc-400 text-xs">{r.driver_id}</span>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-orange-600 hover:bg-orange-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, entry: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [entityLabel, txnPurposesQuery.data, vehicleById, customerById, userById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Expenses</h1>
            <p className="text-zinc-500 font-medium">Track and manage all company expenses.</p>
          </div>
          <Button
            variant="primary"
            className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, entry: null })}
          >
            New Expense
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Expenses" value={allRows.length} color="from-orange-500 to-red-500" />
          <StatCard title="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} color="from-orange-500 to-amber-500" icon={<FiArrowDownLeft />} />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input type="text" placeholder="Search by expense head, bill no, or payer..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* Date Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl font-semibold text-sm transition-all shadow-sm border
                ${activeFilter && activeFilter !== 'custom' ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200'}`}
            >
              <FiFilter size={16} />
              {activeFilter === 'today' ? 'Today' : activeFilter === 'yesterday' ? 'Yesterday' : activeFilter === '7days' ? '7 Days' : activeFilter === 'custom' ? 'Custom' : 'Filter'}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 p-2 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-20"
                >
                  {[
                    { key: 'today',     label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: '7days',     label: 'Last 7 Days' },
                    { key: 'custom',    label: 'Custom Filter' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (opt.key === 'custom') {
                          setCustomFilterOpen(true)
                        } else {
                          setActiveFilter(activeFilter === opt.key ? null : opt.key)
                        }
                        setFilterOpen(false)
                      }}
                      className="w-full flex items-center justify-between p-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {opt.label}
                      {activeFilter === opt.key && <FiCheck size={14} className="text-zinc-900" />}
                    </button>
                  ))}
                  {activeFilter && (
                    <button
                      onClick={() => { setActiveFilter(null); setCustomFilter({ startDate: '', endDate: '' }); setFilterOpen(false) }}
                      className="w-full px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100 text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom date range picker */}
          <div className="relative" ref={customFilterRef}>
            <AnimatePresence>
              {customFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 p-4 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900">Custom Date Range</h3>
                      <button onClick={() => setCustomFilterOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                        <FiX size={16} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">Start Date</label>
                        <input
                          type="date"
                          value={customFilter.startDate}
                          onChange={(e) => setCustomFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">End Date</label>
                        <input
                          type="date"
                          value={customFilter.endDate}
                          onChange={(e) => setCustomFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          min={customFilter.startDate}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setActiveFilter('custom'); setCustomFilterOpen(false) }}
                        disabled={!customFilter.startDate || !customFilter.endDate}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={() => { setCustomFilter({ startDate: '', endDate: '' }); setCustomFilterOpen(false) }}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {expenseQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-orange-50/30 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No expenses yet'}
                description={searchTerm ? `No expense matches "${searchTerm}"` : 'Create your first expense entry.'}
                actionLabel={!searchTerm ? 'New Expense' : undefined}
                onAction={() => setModal({ open: true, entry: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} size="lg" title={modal.entry ? 'Edit Expense' : 'New Expense'} onClose={() => setModal({ open: false, entry: null })}>
        <ExpenseForm
          defaultValues={modal.entry}
          customers={customers}
          drivers={users}
          vehicles={vehicles}
          companies={companies}
          transactionPurposes={txnPurposesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.entry) await updateMutation.mutateAsync({ id: modal.entry.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete expense?" description="This expense will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (
        <DetailModal
          open={view.open}
          onClose={() => setView({ open: false, record: null })}
          title="Expense Details"
          data={{
            'Expense Head': view.record.expense_head || '—',
            'Amount': view.record.amount ? `₹${Number(view.record.amount).toLocaleString('en-IN')}` : '—',
            'Method': view.record.transaction_type ? view.record.transaction_type.replace(/_/g, ' ') : '—',
            'Transaction Purpose': (() => {
              const p = (txnPurposesQuery.data?.items ?? []).find((x) => String(x.id) === String(view.record.transaction_purpose))
              return p?.transaction_purpose_name || '—'
            })(),
            'Bill No': view.record.bill_no || '—',
            'Payer': getEntityName(view.record.payer_type, view.record.payer_id),
            'Customer': (() => {
              if (!view.record.customer_id) return '—'
              const c = customerById.get(String(view.record.customer_id))
              return c?.customer_name || c?.name || view.record.customer_id
            })(),
            'Vehicle': (() => {
              if (!view.record.vehicle_id) return '—'
              const v = vehicleById.get(String(view.record.vehicle_id))
              return v?.registration_number || view.record.vehicle_id
            })(),
            'Driver': (() => {
              if (!view.record.driver_id) return '—'
              const d = userById.get(String(view.record.driver_id))
              return d?.name || view.record.driver_id
            })(),
            'Credit To': view.record.credit_to || '—',
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
