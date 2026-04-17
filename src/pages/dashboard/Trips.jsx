import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiEye, FiSearch, FiTruck, FiActivity, FiChevronDown, FiFilter, FiCheck, FiX } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
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
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 min-w-[150px]">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${s === current ? 'opacity-40 cursor-default' : 'hover:bg-zinc-50'}`}
                onMouseDown={(e) => { e.preventDefault(); if (s !== current) { onUpdate(tripId, s); setOpen(false) } }}
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

export default function Trips() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const dateFilterRef = useRef(null)
  const [dateRange, setDateRange] = useState({ type: 'single', startDate: '', endDate: '' })
  const [modal, setModal] = useState({ open: false, trip: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  useEffect(() => {
    function handler(e) { 
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target)) setDateFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const customerById = useMemo(() => { const m = new Map(); (customersQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c)); return m }, [customersQuery.data])
  const assignmentById = useMemo(() => { const m = new Map(); (assignmentsQuery.data?.items ?? []).forEach((a) => m.set(String(a.id), a)); return m }, [assignmentsQuery.data])
  const userById = useMemo(() => { const m = new Map(); (usersQuery.data?.items ?? []).forEach((u) => m.set(String(u.id), u)); return m }, [usersQuery.data])
  const vehicleById = useMemo(() => { const m = new Map(); (vehiclesQuery.data?.items ?? []).forEach((v) => m.set(String(v.id), v)); return m }, [vehiclesQuery.data])
  const placeById = useMemo(() => { const m = new Map(); (placesQuery.data?.items ?? []).forEach((p) => m.set(String(p.id), p.name)); return m }, [placesQuery.data])
  const consignmentById = useMemo(() => { const m = new Map(); (consignmentsQuery.data?.items ?? []).forEach((c) => m.set(String(c.id), c.name)); return m }, [consignmentsQuery.data])
  const metricById = useMemo(() => { const m = new Map(); (metricsQuery.data?.items ?? []).forEach((x) => m.set(String(x.id), x.name)); return m }, [metricsQuery.data])

  const allRows = tripsQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    let rows = allRows

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter((t) =>
        placeById.get(String(t.source))?.toLowerCase().includes(q) ||
        placeById.get(String(t.destination))?.toLowerCase().includes(q) ||
        consignmentById.get(String(t.consignment))?.toLowerCase().includes(q) ||
        customerById.get(String(t.customer_id))?.customer_name?.toLowerCase().includes(q)
      )
    }

    // Apply status filter
    if (activeFilter === 'completed') {
      rows = rows.filter(t => t.status === 'COMPLETED')
    } else if (activeFilter === 'ongoing') {
      rows = rows.filter(t => t.status === 'IN_TRANSIT')
    } else if (activeFilter === 'scheduled') {
      rows = rows.filter(t => t.status === 'SCHEDULED')
    } else if (activeFilter === 'cancelled') {
      rows = rows.filter(t => t.status === 'CANCELLED')
    } else if (activeFilter === 'custom_date') {
      // Apply date filter
      rows = rows.filter(t => {
        if (!t.start_date_time) return false
        const tripDate = new Date(t.start_date_time)
        
        if (dateRange.type === 'single' && dateRange.startDate) {
          const filterDate = new Date(dateRange.startDate)
          return tripDate.toDateString() === filterDate.toDateString()
        } else if (dateRange.type === 'range' && dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate)
          const endDate = new Date(dateRange.endDate)
          return tripDate >= startDate && tripDate <= endDate
        }
        return true
      })
    }

    // Apply source/destination/customer filters
    if (filterFrom) {
      rows = rows.filter(t => String(t.source) === filterFrom)
    }
    if (filterTo) {
      rows = rows.filter(t => String(t.destination) === filterTo)
    }
    if (filterCustomer) {
      rows = rows.filter(t => String(t.customer_id) === filterCustomer)
    }

    return rows
  }, [allRows, searchTerm, activeFilter, placeById, consignmentById, customerById, dateRange, filterFrom, filterTo, filterCustomer])

  const ongoingCount = allRows.filter((t) => t.status === 'IN_TRANSIT').length
  const completedCount = allRows.filter((t) => t.status === 'COMPLETED').length
  const totalAmount = allRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const columns = useMemo(() => [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <div className="flex flex-col gap-0.5 py-1">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <span>{placeById.get(String(r.source)) ?? '—'}</span>
            <span className="text-zinc-300">→</span>
            <span>{placeById.get(String(r.destination)) ?? '—'}</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">
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
            <span className="text-xs font-bold text-zinc-700">{c?.customer_name ?? '—'}</span>
            <span className="text-[11px] text-zinc-400">{c?.customer_phone ?? ''}</span>
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
            <FiTruck size={12} className="text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-zinc-700">{vehicle?.registration_number ?? '—'}</span>
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
        <span className="text-xs font-bold text-zinc-900">
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
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, trip: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [customerById, assignmentById, vehicleById, userById, placeById, consignmentById, metricById, statusMutation])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Trips</h1>
            {/* <p className="text-zinc-500 font-medium">Track and manage vehicle logistics operations.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-blue-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, trip: null })}
          >
            Create Trip
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PageStatCard title="Ongoing Trips" value={ongoingCount} icon={<FiActivity size={20} />} gradient="from-blue-500 to-indigo-600" />
          <PageStatCard title="Completed" value={completedCount} icon={<FiTruck size={20} />} gradient="from-emerald-500 to-teal-500" />
          <PageStatCard title="Total Revenue" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={<FaRupeeSign size={20} />} gradient="from-amber-500 to-orange-500" />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by place, consignment or customer..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All From</option>
              {(placesQuery.data?.items ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All To</option>
              {(placesQuery.data?.items ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Customers</option>
              {(customersQuery.data?.items ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl font-semibold text-sm transition-all shadow-sm border
                ${activeFilter && activeFilter !== 'custom_date' ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200'}`}
            >
              <FiFilter size={16} />
              {activeFilter === 'completed' ? 'Completed' : activeFilter === 'ongoing' ? 'Ongoing' : activeFilter === 'scheduled' ? 'Scheduled' : activeFilter === 'cancelled' ? 'Cancelled' : activeFilter === 'custom_date' ? 'Custom Date' : 'Filter'}
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
                    { key: 'completed',  label: 'Completed Trips' },
                    { key: 'ongoing',    label: 'Ongoing (In Transit)' },
                    { key: 'scheduled',  label: 'Scheduled Trips' },
                    { key: 'cancelled',  label: 'Cancelled Trips' },
                    { key: 'custom_date', label: 'Custom Date Range' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { 
                        if (opt.key === 'custom_date') {
                          setDateFilterOpen(true)
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
                      onClick={() => { setActiveFilter(null); setDateRange({ type: 'single', startDate: '', endDate: '' }); setFilterOpen(false) }}
                      className="w-full px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100 text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Date Filter dropdown */}
          <div className="relative" ref={dateFilterRef}>
            <AnimatePresence>
              {dateFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 p-4 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900">Custom Date Filter</h3>
                      <button
                        onClick={() => setDateFilterOpen(false)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-700">Filter Type</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, type: 'single' }))}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            dateRange.type === 'single' 
                              ? 'bg-zinc-900 text-white border-zinc-900' 
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          Single Date
                        </button>
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, type: 'range' }))}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            dateRange.type === 'range' 
                              ? 'bg-zinc-900 text-white border-zinc-900' 
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          Date Range
                        </button>
                      </div>
                    </div>

                    {dateRange.type === 'single' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">Select Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-700">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                        <label className="text-xs font-medium text-zinc-700">End Date</label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setActiveFilter('custom_date')
                          setDateFilterOpen(false)
                        }}
                        disabled={(dateRange.type === 'single' && !dateRange.startDate) || (dateRange.type === 'range' && (!dateRange.startDate || !dateRange.endDate))}
                        className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={() => {
                          setDateRange({ type: 'single', startDate: '', endDate: '' })
                          setDateFilterOpen(false)
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
            {tripsQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-blue-50/30 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No trips recorded'}
                description={searchTerm ? `No trip matches "${searchTerm}"` : 'Launch your first trip to start tracking logistics.'}
                actionLabel={!searchTerm ? 'Create Trip' : undefined}
                onAction={() => setModal({ open: true, trip: null })}
              />
            )}
          </div>
        </div>
      </div>

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
        open={confirm.open} title="Remove trip?" description="This record will be permanently deleted."
        danger confirmText="Remove" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

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

function ActionBtn({ icon, onClick, hover }) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-xl text-zinc-400 transition-all active:scale-90 ${hover}`}>
      <div className="text-lg">{icon}</div>
    </button>
  )
}
