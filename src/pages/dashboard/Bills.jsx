import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiFileText, FiFilter, FiCheck, FiX, FiCalendar } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import BillForm from '../../components/forms/BillForm.jsx'
import * as billAPI from '../../features/bills/billAPI.js'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'

export default function Bills() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [customFilterOpen, setCustomFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const customFilterRef = useRef(null)
  const [customFilter, setCustomFilter] = useState({ startDate: '', endDate: '' })
  const [modal, setModal] = useState({ open: false, bill: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  useEffect(() => {
    function handler(e) { 
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
      if (customFilterRef.current && !customFilterRef.current.contains(e.target)) setCustomFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
        fromPlace: from,
        toPlace: to,
        tripId: trip ? String(trip.id) : '',
        sourceId: trip ? String(trip.source) : '',
        destinationId: trip ? String(trip.destination) : '',
        customerId: trip ? String(trip.customer_id) : '',
      }
    })
    return meta
  }, [challansQuery.data, tripById, customerById, placeById])

  const allRows = billsQuery.data?.items ?? []
  const challans = challansQuery.data?.items ?? []

  // For new bill creation, only show challans that don't already have a bill
  const billedChallanIds = useMemo(() => new Set(allRows.flatMap((b) => (b.challans || []).map(c => String(c.id)))), [allRows])
  const availableChallans = useMemo(
    () => challans.filter((c) => !billedChallanIds.has(String(c.id))),
    [challans, billedChallanIds]
  )

  const filteredRows = useMemo(() => {
    let rows = allRows

    // Debug: Log the raw data and date parsing
    console.log('Bills - All rows:', allRows)
    console.log('Bills - Active filter:', activeFilter)
    console.log('Bills - Custom filter:', customFilter)
    console.log('Bills - Challans data:', challans)

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter((b) => {
        const hasMatch = (b.challans || []).some((bc) => {
          const challan = challans.find((c) => String(c.id) === String(bc.id))
          const m = challanMeta[String(bc.id)] ?? {}
          return (
            (challan?.challan_no ?? '').toLowerCase().includes(q) ||
            (m.customerName ?? '').toLowerCase().includes(q) ||
            (m.fromPlace ?? '').toLowerCase().includes(q) ||
            (m.toPlace ?? '').toLowerCase().includes(q)
          )
        })
        return (b.bill_no ?? '').toLowerCase().includes(q) || hasMatch
      })
    }

    // Apply date filters (using challan_date field instead of tc_date)
    if (activeFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1) // Start of tomorrow
      
      console.log('Bills - Today filter:', { today, tomorrow })
      rows = rows.filter(b => {
        return (b.challans || []).some(bc => {
          const challan = challans.find((c) => String(c.id) === String(bc.id))
          if (!challan?.challan_date) return false
          const challanDate = new Date(challan.challan_date)
          return challanDate >= today && challanDate < tomorrow
        })
      })
    } else if (activeFilter === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0) // Start of yesterday
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      console.log('Bills - Yesterday filter:', { yesterday, today })
      rows = rows.filter(b => {
        return (b.challans || []).some(bc => {
          const challan = challans.find((c) => String(c.id) === String(bc.id))
          if (!challan?.challan_date) return false
          const challanDate = new Date(challan.challan_date)
          return challanDate >= yesterday && challanDate < today
        })
      })
    } else if (activeFilter === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0) // Start of 7 days ago
      
      console.log('Bills - 7 days filter:', { sevenDaysAgo })
      rows = rows.filter(b => {
        return (b.challans || []).some(bc => {
          const challan = challans.find((c) => String(c.id) === String(bc.id))
          if (!challan?.challan_date) return false
          const challanDate = new Date(challan.challan_date)
          return challanDate >= sevenDaysAgo
        })
      })
    } else if (activeFilter === 'custom') {
      console.log('Bills - Custom date range filter:', customFilter)
      rows = rows.filter(b => {
        return (b.challans || []).some(bc => {
          const challan = challans.find((c) => String(c.id) === String(bc.id))
          if (!challan?.challan_date) return false
          const challanDate = new Date(challan.challan_date)
          if (customFilter.startDate && customFilter.endDate) {
            const start = new Date(customFilter.startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(customFilter.endDate)
            end.setHours(23, 59, 59, 999)
            return challanDate >= start && challanDate <= end
          }
          return true
        })
      })
    }

    // Apply source/destination/customer filters
    if (filterFrom) {
      rows = rows.filter(b => (b.challans || []).some(bc => challanMeta[String(bc.id)]?.sourceId === filterFrom))
    }
    if (filterTo) {
      rows = rows.filter(b => (b.challans || []).some(bc => challanMeta[String(bc.id)]?.destinationId === filterTo))
    }
    if (filterCustomer) {
      rows = rows.filter(b => (b.challans || []).some(bc => challanMeta[String(bc.id)]?.customerId === filterCustomer))
    }

    console.log('Bills - Filtered rows count:', rows.length)
    return rows
  }, [allRows, searchTerm, challans, challanMeta, activeFilter, customFilter, filterFrom, filterTo, filterCustomer])

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
        const cList = (r.challans || []).map(bc => challans.find(c => String(c.id) === String(bc.id)))
        return (
          <div className="flex flex-col gap-0.5">
            {cList.map(c => {
              if (!c) return null
              const m = challanMeta[String(c.id)] ?? {}
              return (
                <div key={c.id}>
                  <span className="text-xs font-bold text-zinc-800">{c.challan_no ?? '—'}</span>
                  <span className="text-[11px] text-zinc-400 ml-1">({m.customerName ?? ''})</span>
                </div>
              )
            })}
          </div>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => {
        const total = (r.challans || []).reduce((acc, bc) => {
          const c = challans.find(x => String(x.id) === String(bc.id))
          return acc + (Number(c?.total_amount) || 0)
        }, 0)
        return <span className="text-xs font-bold text-zinc-900">₹{total.toLocaleString('en-IN')}</span>
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
          <PageStatCard title="Total Bills" value={allRows.length} icon={<FiFileText size={20} />} gradient="from-indigo-500 to-blue-500" />
          <PageStatCard
            title="Total Amount"
            value={`₹${challans
              .filter((c) => allRows.some((b) => (b.challans || []).some(bc => String(bc.id) === String(c.id))))
              .reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
              .toLocaleString('en-IN')}`}
            icon={<FaRupeeSign size={20} />}
            gradient="from-emerald-500 to-teal-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by bill no, challan, customer or trip route..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All From</option>
              {(placesQuery.data?.items ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All To</option>
              {(placesQuery.data?.items ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Customers</option>
              {(customersQuery.data?.items ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl font-semibold text-sm transition-all shadow-sm border
                ${activeFilter && activeFilter !== 'custom' ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200'}`}
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
                    { key: 'yesterday',  label: 'Yesterday' },
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

          {/* Custom Filter dropdown */}
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
                      <button
                        onClick={() => setCustomFilterOpen(false)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
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
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">End Date</label>
                        <input
                          type="date"
                          value={customFilter.endDate}
                          onChange={(e) => setCustomFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          min={customFilter.startDate}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setActiveFilter('custom')
                          setCustomFilterOpen(false)
                        }}
                        disabled={!customFilter.startDate || !customFilter.endDate}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={() => {
                          setCustomFilter({ startDate: '', endDate: '' })
                          setCustomFilterOpen(false)
                        }}
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
              await createMutation.mutateAsync(values)
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
        const cList = (r.challans || []).map(bc => challans.find(c => String(c.id) === String(bc.id))).filter(Boolean)
        const total = cList.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0)
        return (
          <DetailModal
            open={view.open}
            onClose={() => setView({ open: false, record: null })}
            title="Bill Details"
            data={{
              'Bill No': r.bill_no,
              'Challans': cList.map(c => c.challan_no).join(', ') || '—',
              'Total Amount': total ? `₹${total.toLocaleString('en-IN')}` : '—',
            }}
          />
        )
      })()}
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