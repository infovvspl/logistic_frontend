import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import {
  FiUsers, FiTruck, FiUser, FiFileText, FiBriefcase,
  FiSearch, FiArrowUpRight, FiArrowDownLeft, FiTrendingUp,
  FiChevronDown, FiChevronUp, FiDownload, FiFilter, FiPrinter,
} from 'react-icons/fi'
import { FaBalanceScale } from 'react-icons/fa'
import * as ledgerAPI from '../../features/ledger/ledgerAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as billAPI from '../../features/bills/billAPI.js'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as txnPurposeAPI from '../../features/transactionPurposes/transactionPurposeAPI.js'

const VIEWS = [
  { id: 'customer', label: 'Customer Wise', icon: FiUsers, color: 'from-violet-500 to-purple-600' },
  { id: 'vehicle',  label: 'Vehicle Wise',  icon: FiTruck,  color: 'from-blue-500 to-cyan-600' },
  { id: 'user',     label: 'User Wise',     icon: FiUser,   color: 'from-emerald-500 to-teal-600' },
  { id: 'bill',     label: 'Bill Wise',     icon: FiFileText, color: 'from-amber-500 to-orange-600' },
  { id: 'company',  label: 'Company Wise',  icon: FiBriefcase, color: 'from-rose-500 to-pink-600' },
]

function fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
function fmtAbs(n) { const v = Number(n || 0); return { text: fmt(Math.abs(v)), pos: v >= 0 } }

export default function BalanceSheet() {
  const [activeView, setActiveView] = useState('customer')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [txnTypeFilter, setTxnTypeFilter] = useState('')
  const [filterPurpose, setFilterPurpose] = useState('')

  const ledgerQuery     = useQuery({ queryKey: ['ledger'],     queryFn: ledgerAPI.listLedger })
  const tripsQuery      = useQuery({ queryKey: ['trips'],      queryFn: tripAPI.listTrips })
  const billsQuery      = useQuery({ queryKey: ['bills'],      queryFn: billAPI.listBills })
  const challansQuery   = useQuery({ queryKey: ['challans'],   queryFn: challanAPI.listChallans })
  const customersQuery  = useQuery({ queryKey: ['customers'],  queryFn: customerAPI.listCustomers })
  const usersQuery      = useQuery({ queryKey: ['users'],      queryFn: userAPI.listUsers })
  const companiesQuery  = useQuery({ queryKey: ['companies'],  queryFn: companyAPI.listCompanies })
  const placesQuery     = useQuery({ queryKey: ['places'],     queryFn: placeAPI.listPlaces })
  const vehiclesQuery   = useQuery({ queryKey: ['vehicles'],   queryFn: vehicleAPI.listVehicles })
  const txnPurposeQuery = useQuery({ queryKey: ['transaction-purposes'], queryFn: txnPurposeAPI.listTransactionPurposes })

  const isLoading = ledgerQuery.isLoading || customersQuery.isLoading

  const customers  = customersQuery.data?.items  ?? []
  const users      = usersQuery.data?.items      ?? []
  const companies  = companiesQuery.data?.items  ?? []
  const vehicles   = vehiclesQuery.data?.items   ?? []
  const bills      = billsQuery.data?.items      ?? []
  const challans   = challansQuery.data?.items   ?? []
  const trips      = tripsQuery.data?.items      ?? []
  const places     = placesQuery.data?.items     ?? []
  const purposes   = txnPurposeQuery.data?.items ?? []

  const placeById = useMemo(() => {
    const m = new Map(); places.forEach(p => m.set(String(p.id), p.name)); return m
  }, [places])

  const customerById = useMemo(() => {
    const m = new Map(); customers.forEach(c => m.set(String(c.id), c)); return m
  }, [customers])

  const vehicleById = useMemo(() => {
    const m = new Map(); vehicles.forEach(v => m.set(String(v.id), v)); return m
  }, [vehicles])

  const userById = useMemo(() => {
    const m = new Map(); users.forEach(u => m.set(String(u.id), u)); return m
  }, [users])

  const companyById = useMemo(() => {
    const m = new Map(); companies.forEach(c => m.set(String(c.id), c)); return m
  }, [companies])

  const billById = useMemo(() => {
    const m = new Map(); bills.forEach(b => m.set(String(b.id), b)); return m
  }, [bills])

  const purposeById = useMemo(() => {
    const m = new Map(); purposes.forEach(p => m.set(String(p.id), p.transaction_purpose_name)); return m
  }, [purposes])

  // challan → trip lookup
  const challanTripMap = useMemo(() => {
    const m = new Map(); challans.forEach(c => { if (c.trip_id) m.set(String(c.id), String(c.trip_id)) }); return m
  }, [challans])

  // trip meta
  const tripMeta = useMemo(() => {
    const meta = {}
    trips.forEach(t => {
      const customer = customerById.get(String(t.customer_id))
      const from = placeById.get(String(t.source)) ?? ''
      const to   = placeById.get(String(t.destination)) ?? ''
      meta[String(t.id)] = { customer, from, to, vehicleId: t.vehicle_id }
    })
    return meta
  }, [trips, customerById, placeById])

  // Apply date & type filters on raw ledger rows
  const allLedger = useMemo(() => {
    let rows = ledgerQuery.data?.items ?? []
    if (dateFrom) rows = rows.filter(r => r.created_at && new Date(r.created_at) >= new Date(dateFrom))
    if (dateTo)   rows = rows.filter(r => r.created_at && new Date(r.created_at) <= new Date(dateTo + 'T23:59:59'))
    if (txnTypeFilter) rows = rows.filter(r => r.transaction_type === txnTypeFilter)
    if (filterPurpose) rows = rows.filter(r => String(r.transaction_purpose) === filterPurpose)
    return rows
  }, [ledgerQuery.data, dateFrom, dateTo, txnTypeFilter, filterPurpose])

  const setRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setDateFrom(start.toISOString().slice(0, 10))
    setDateTo(end.toISOString().slice(0, 10))
  }

  const setThisMonth = () => {
    const d = new Date()
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    setDateFrom(start.toISOString().slice(0, 10))
    setDateTo(d.toISOString().slice(0, 10))
  }

  // Resolve entity name
  const getName = (type, id) => {
    if (!id) return null
    if (type === 'customer') return customerById.get(String(id))?.customer_name || `Customer #${id}`
    if (type === 'user')     return userById.get(String(id))?.name || userById.get(String(id))?.email || `User #${id}`
    if (type === 'company')  return companyById.get(String(id))?.name || `Company #${id}`
    if (type === 'vehicle')  {
      const v = vehicleById.get(String(id))
      return v ? [v.registration_number, v.vehicle_model].filter(Boolean).join(' · ') : `Vehicle #${id}`
    }
    return `${type} #${id}`
  }

  // ─── Group ledger rows by entity ──────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups = {}

    const addEntry = (key, label, sub, entry, directionLabel) => {
      if (!groups[key]) groups[key] = { key, label, sub, entries: [], totalIn: 0, totalOut: 0 }
      groups[key].entries.push({ ...entry, _dirLabel: directionLabel })
      const amt = Number(entry.amount || 0)
      if (directionLabel === 'in') groups[key].totalIn  += amt
      else                          groups[key].totalOut += amt
    }

    allLedger.forEach(entry => {
      const payerName = getName(entry.payer_type, entry.payer_id)
      const payeeName = getName(entry.payee_type, entry.payee_id)

      if (activeView === 'customer') {
        const custIds = new Set()
        // payer
        if (entry.payer_type === 'customer' && entry.payer_id) {
          const id = String(entry.payer_id)
          if (!custIds.has(id)) {
            custIds.add(id)
            const c = customerById.get(id)
            addEntry(id, c?.customer_name || `Customer #${id}`, c?.email || '', entry, 'out')
          }
        }
        // payee
        if (entry.payee_type === 'customer' && entry.payee_id) {
          const id = String(entry.payee_id)
          if (!custIds.has(id)) {
            const c = customerById.get(id)
            addEntry(id, c?.customer_name || `Customer #${id}`, c?.email || '', entry, 'in')
          }
        }
        // derive from trip
        if (entry.trip_id) {
          const tm = tripMeta[String(entry.trip_id)]
          if (tm?.customer) {
            const id = String(tm.customer.id)
            if (!custIds.has(id)) {
              custIds.add(id)
              addEntry(id, tm.customer.customer_name, '', entry, 'in')
            }
          }
        }
      }

      if (activeView === 'vehicle') {
        const vIds = new Set()
        if (entry.vehicle_id) {
          const id = String(entry.vehicle_id)
          if (!vIds.has(id)) {
            vIds.add(id)
            const v = vehicleById.get(id)
            const label = v ? [v.registration_number, v.vehicle_model].filter(Boolean).join(' · ') : `Vehicle #${id}`
            addEntry(id, label, v?.vehicle_manufacture_company || '', entry,
              entry.payee_type === 'vehicle' ? 'in' : 'out')
          }
        }
        // derive from trip vehicle
        if (entry.trip_id) {
          const tm = tripMeta[String(entry.trip_id)]
          if (tm?.vehicleId) {
            const id = String(tm.vehicleId)
            if (!vIds.has(id)) {
              vIds.add(id)
              const v = vehicleById.get(id)
              const label = v ? [v.registration_number, v.vehicle_model].filter(Boolean).join(' · ') : `Vehicle #${id}`
              addEntry(id, label, '', entry, 'out')
            }
          }
        }
      }

      if (activeView === 'user') {
        const uIds = new Set()
        if (entry.payer_type === 'user' && entry.payer_id) {
          const id = String(entry.payer_id)
          if (!uIds.has(id)) {
            uIds.add(id)
            const u = userById.get(id)
            addEntry(id, u?.name || u?.email || `User #${id}`, u?.email || '', entry, 'out')
          }
        }
        if (entry.payee_type === 'user' && entry.payee_id) {
          const id = String(entry.payee_id)
          if (!uIds.has(id)) {
            const u = userById.get(id)
            addEntry(id, u?.name || u?.email || `User #${id}`, u?.email || '', entry, 'in')
          }
        }
      }

      if (activeView === 'bill') {
        let billId = entry.bill_id ?? entry.bill_no ?? null
        if (!billId && entry.trip_id) {
          const tm = tripMeta[String(entry.trip_id)]
          // find challan for that trip
          const challan = challans.find(c => String(c.trip_id) === String(entry.trip_id))
          if (challan) {
            const b = bills.find(b => String(b.challan_id) === String(challan.id))
            if (b) billId = b.id
          }
        }
        if (billId) {
          const b = billById.get(String(billId))
          const label = b?.bill_no || `Bill #${billId}`
          addEntry(String(billId), label, '', entry, 'in')
        } else {
          addEntry('__unlinked', 'Unlinked Entries', 'No bill associated', entry, 'out')
        }
      }

      if (activeView === 'company') {
        const cIds = new Set()
        if (entry.company_id) {
          const id = String(entry.company_id)
          if (!cIds.has(id)) {
            cIds.add(id)
            const c = companyById.get(id)
            addEntry(id, c?.name || `Company #${id}`, c?.gstin || '', entry,
              entry.payee_type === 'company' ? 'in' : 'out')
          }
        }
        if (entry.payer_type === 'company' && entry.payer_id) {
          const id = String(entry.payer_id)
          if (!cIds.has(id)) {
            cIds.add(id)
            const c = companyById.get(id)
            addEntry(id, c?.name || `Company #${id}`, c?.gstin || '', entry, 'out')
          }
        }
        if (entry.payee_type === 'company' && entry.payee_id) {
          const id = String(entry.payee_id)
          if (!cIds.has(id)) {
            const c = companyById.get(id)
            addEntry(id, c?.name || `Company #${id}`, c?.gstin || '', entry, 'in')
          }
        }
      }
    })

    return Object.values(groups).map(g => ({
      ...g,
      balance: g.totalIn - g.totalOut,
    }))
  }, [allLedger, activeView, customerById, vehicleById, userById, companyById, billById, tripMeta, challans, bills])

  // Filter by search
  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return grouped
    return grouped.filter(g => g.label.toLowerCase().includes(q) || g.sub?.toLowerCase().includes(q))
  }, [grouped, search])

  // Summary totals
  const totals = useMemo(() => ({
    in:  filteredGroups.reduce((s, g) => s + g.totalIn,  0),
    out: filteredGroups.reduce((s, g) => s + g.totalOut, 0),
    balance: filteredGroups.reduce((s, g) => s + g.balance, 0),
  }), [filteredGroups])

  const currentView = VIEWS.find(v => v.id === activeView)
  const txnTypes = useMemo(() => [...new Set((ledgerQuery.data?.items ?? []).map(r => r.transaction_type).filter(Boolean))], [ledgerQuery.data])

  // Data for charts
  const chartData = useMemo(() => {
    return filteredGroups
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 8)
      .map(g => ({
        name: g.label.length > 15 ? g.label.slice(0, 12) + '...' : g.label,
        Inflow: g.totalIn,
        Outflow: g.totalOut,
        Balance: g.balance,
      }))
  }, [filteredGroups])

  const pieData = useMemo(() => [
    { name: 'Inflow', value: totals.in, color: '#10b981' },
    { name: 'Outflow', value: totals.out, color: '#f43f5e' },
  ], [totals])

  const handleExport = () => {
    const headers = ['Name', 'Sub-label', 'Inflow', 'Outflow', 'Balance', 'Entries Count']
    const rows = filteredGroups.map(g => [
      `"${g.label.replace(/"/g, '""')}"`,
      `"${(g.sub || '').replace(/"/g, '""')}"`,
      g.totalIn,
      g.totalOut,
      g.balance,
      g.entries.length
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `balance_sheet_${activeView}_${new Date().toISOString().slice(0,10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen p-6 print:p-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .min-h-screen { min-height: auto !important; }
          body { background: white !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .shadow-xl, .shadow-sm, .shadow-lg { box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200">
                <FaBalanceScale size={22} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Balance Sheet</h1>
                <p className="text-zinc-500 font-medium mt-0.5">Multi-dimensional financial ledger view</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all shadow-sm"
            >
              <FiPrinter size={15} />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all shadow-sm"
            >
              <FiDownload size={15} />
              Export
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all shadow-sm ${
                showFilters || dateFrom || dateTo || txnTypeFilter
                  ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
              }`}
            >
              <FiFilter size={15} />
              Filters
              {(dateFrom || dateTo || txnTypeFilter) && (
                <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {[dateFrom, dateTo, txnTypeFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      min={dateFrom}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transaction Type</label>
                    <select value={txnTypeFilter} onChange={e => setTxnTypeFilter(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 bg-white">
                      <option value="">All Types</option>
                      {txnTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Purpose</label>
                    <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 bg-white">
                      <option value="">All Purposes</option>
                      {purposes.map(p => <option key={p.id} value={p.id}>{p.transaction_purpose_name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setRange(0)}   className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold">Today</button>
                  <button onClick={() => setRange(7)}   className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold">Last 7 Days</button>
                  <button onClick={() => setRange(30)}  className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold">Last 30 Days</button>
                  <button onClick={() => setRange(90)}  className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold">Last 90 Days</button>
                  <button onClick={setThisMonth}        className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold">This Month</button>
                  {(dateFrom || dateTo || txnTypeFilter || filterPurpose) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setTxnTypeFilter(''); setFilterPurpose('') }}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded text-xs font-bold">
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2 no-print">
          {VIEWS.map(v => {
            const Icon = v.icon
            const active = activeView === v.id
            return (
              <button
                key={v.id}
                onClick={() => { setActiveView(v.id); setExpandedId(null); setSearch('') }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  active
                    ? `bg-gradient-to-r ${v.color} text-white shadow-lg shadow-zinc-200`
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <Icon size={15} />
                {v.label}
              </button>
            )
          })}
        </div>

        {/* Charts Section */}
        {filteredGroups.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
            <div className="lg:col-span-8 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Volume Analysis (Top 8)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Flow Distribution</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                      formatter={(v) => fmt(v)}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Inflow" value={totals.in} icon={<FiArrowDownLeft size={18}/>} color="emerald" />
          <SummaryCard label="Total Outflow" value={totals.out} icon={<FiArrowUpRight size={18}/>} color="rose" />
          <SummaryCard label="Net Balance" value={totals.balance} icon={<FiTrendingUp size={18}/>}
            color={totals.balance >= 0 ? 'blue' : 'amber'} showSign />
        </div>

        {/* Search */}
        <div className="relative no-print">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder={`Search ${currentView?.label ?? ''}...`}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none font-medium text-zinc-700 placeholder:text-zinc-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Balance Sheet Table */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden print:border-none">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-4 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.15em] print:bg-zinc-100 print:text-zinc-900">
            <div className="col-span-4">Name</div>
            <div className="col-span-2 text-right">Inflow</div>
            <div className="col-span-2 text-right">Outflow</div>
            <div className="col-span-2 text-right font-black">Balance</div>
            <div className="col-span-2 text-right no-print">Entries</div>
          </div>

          {isLoading ? (
            <div className="p-20 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-16 text-center">
              <FaBalanceScale size={40} className="text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-400 font-semibold">No data for this view</p>
              <p className="text-zinc-300 text-sm mt-1">Try changing the view or adjusting filters</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {filteredGroups.map((group, idx) => {
                const isExpanded = expandedId === group.key
                const balFmt = fmtAbs(group.balance)
                return (
                  <div key={group.key}>
                    {/* Row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : group.key)}
                      className="w-full grid grid-cols-12 px-6 py-4 hover:bg-violet-50/40 transition-colors text-left"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${currentView?.color || 'from-zinc-400 to-zinc-500'} text-white shadow-sm`}>
                          {currentView && <currentView.icon size={13} />}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-sm">{group.label}</div>
                          {group.sub && <div className="text-[11px] text-zinc-400 truncate max-w-[160px]">{group.sub}</div>}
                        </div>
                      </div>
                      <div className="col-span-2 text-right self-center">
                        <span className="text-emerald-600 font-bold tabular-nums text-sm">{fmt(group.totalIn)}</span>
                      </div>
                      <div className="col-span-2 text-right self-center">
                        <span className="text-rose-500 font-bold tabular-nums text-sm">{fmt(group.totalOut)}</span>
                      </div>
                      <div className="col-span-2 text-right self-center">
                        <span className={`font-black tabular-nums text-sm ${balFmt.pos ? 'text-blue-600' : 'text-amber-600'}`}>
                          {balFmt.pos ? '+' : '-'}{balFmt.text}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-400 font-semibold bg-zinc-100 px-2 py-0.5 rounded-full">
                          {group.entries.length}
                        </span>
                        {isExpanded ? <FiChevronUp size={14} className="text-zinc-400" /> : <FiChevronDown size={14} className="text-zinc-400" />}
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden bg-zinc-50/60"
                        >
                          <div className="px-6 py-3 border-t border-dashed border-zinc-200">
                            {/* Sub-header */}
                            <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-zinc-400 pb-2 mb-1">
                              <div className="col-span-3">Purpose</div>
                              <div className="col-span-2">Type</div>
                              <div className="col-span-2">Payer</div>
                              <div className="col-span-2">Payee</div>
                              <div className="col-span-2 text-right">Amount</div>
                              <div className="col-span-1 text-right">Flow</div>
                            </div>
                            {group.entries.map((entry, ei) => {
                              const purposeLabel = purposeById.get(String(entry.transaction_purpose)) || '—'
                              return (
                                <div key={ei} className="grid grid-cols-12 py-2 border-t border-zinc-100 text-sm items-center">
                                  <div className="col-span-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700 font-semibold text-xs">
                                      {purposeLabel}
                                    </span>
                                  </div>
                                  <div className="col-span-2 text-xs text-zinc-500 capitalize">
                                    {(entry.transaction_type || '—').replace(/_/g, ' ')}
                                  </div>
                                  <div className="col-span-2 text-xs text-zinc-600 truncate">
                                    {getName(entry.payer_type, entry.payer_id) || entry.payer_type || '—'}
                                  </div>
                                  <div className="col-span-2 text-xs text-zinc-600 truncate">
                                    {getName(entry.payee_type, entry.payee_id) || entry.payee_type || '—'}
                                  </div>
                                  <div className="col-span-2 text-right font-bold tabular-nums text-xs text-zinc-900">
                                    {fmt(entry.amount)}
                                  </div>
                                  <div className="col-span-1 flex justify-end">
                                    {entry._dirLabel === 'in'
                                      ? <span className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]"><FiArrowDownLeft size={12}/> IN</span>
                                      : <span className="flex items-center gap-0.5 text-rose-500 font-bold text-[10px]"><FiArrowUpRight size={12}/> OUT</span>
                                    }
                                  </div>
                                </div>
                              )
                            })}
                            {/* Sub-total row */}
                            <div className="grid grid-cols-12 py-2.5 mt-1 border-t-2 border-zinc-200 font-bold text-sm">
                              <div className="col-span-7 text-zinc-500 text-xs uppercase tracking-wider">Subtotal</div>
                              <div className="col-span-2 text-right tabular-nums text-emerald-600">{fmt(group.totalIn)}</div>
                              <div className="col-span-2 text-right tabular-nums text-rose-500">{fmt(group.totalOut)}</div>
                              <div className="col-span-1"></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {/* Grand Total Footer */}
          {filteredGroups.length > 0 && (
            <div className="grid grid-cols-12 px-6 py-4 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
              <div className="col-span-4 font-black text-sm uppercase tracking-wider">Grand Total</div>
              <div className="col-span-2 text-right font-black tabular-nums text-emerald-400">{fmt(totals.in)}</div>
              <div className="col-span-2 text-right font-black tabular-nums text-rose-400">{fmt(totals.out)}</div>
              <div className={`col-span-2 text-right font-black tabular-nums text-sm ${totals.balance >= 0 ? 'text-blue-300' : 'text-amber-300'}`}>
                {totals.balance >= 0 ? '+' : '-'}{fmt(Math.abs(totals.balance))}
              </div>
              <div className="col-span-2 text-right text-zinc-400 text-sm font-semibold">
                {filteredGroups.reduce((s, g) => s + g.entries.length, 0)} entries
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon, color, showSign }) {
  const colorMap = {
    emerald: { bg: 'from-emerald-50 to-teal-50', text: 'text-emerald-700', icon: 'from-emerald-500 to-teal-500', border: 'border-emerald-100' },
    rose:    { bg: 'from-rose-50 to-pink-50',    text: 'text-rose-700',    icon: 'from-rose-500 to-pink-500',    border: 'border-rose-100' },
    blue:    { bg: 'from-blue-50 to-indigo-50',  text: 'text-blue-700',    icon: 'from-blue-500 to-indigo-500',  border: 'border-blue-100' },
    amber:   { bg: 'from-amber-50 to-orange-50', text: 'text-amber-700',   icon: 'from-amber-500 to-orange-500', border: 'border-amber-100' },
  }
  const c = colorMap[color] || colorMap.blue
  const numVal = Number(value)
  const display = showSign
    ? `${numVal >= 0 ? '+' : ''}₹${Math.abs(numVal).toLocaleString('en-IN')}`
    : `₹${Math.abs(numVal).toLocaleString('en-IN')}`
  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 flex items-center justify-between`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className={`text-2xl font-black mt-1 ${c.text} tabular-nums`}>{display}</p>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${c.icon} text-white shadow-md`}>{icon}</div>
    </div>
  )
}
