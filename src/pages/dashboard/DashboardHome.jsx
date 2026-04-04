import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiTrendingUp, FiTrendingDown, FiActivity,
  FiTruck, FiShoppingBag, FiCreditCard, FiAlertCircle,
  FiCalendar, FiChevronDown, FiCheck,
} from 'react-icons/fi'
import { FaRupeeSign } from "react-icons/fa";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { fetchProfitLoss } from '../../features/reports/reportAPI.js'

const fmt = (n) => {
  const num = Number(n) || 0
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`
  return `₹${num.toLocaleString('en-IN')}`
}

const fmtFull = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

// ── Date range helpers ───────────────────────────────────────
const toISO = (d) => d.toISOString().slice(0, 10)

function getPresetRange(key) {
  const now = new Date()
  const today = toISO(now)
  switch (key) {
    case 'today': return { start_date: today, end_date: today }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      const yd = toISO(y); return { start_date: yd, end_date: yd }
    }
    case '7d': {
      const s = new Date(now); s.setDate(s.getDate() - 6)
      return { start_date: toISO(s), end_date: today }
    }
    case '1m': {
      const s = new Date(now); s.setMonth(s.getMonth() - 1)
      return { start_date: toISO(s), end_date: today }
    }
    case '3m': {
      const s = new Date(now); s.setMonth(s.getMonth() - 3)
      return { start_date: toISO(s), end_date: today }
    }
    case '6m': {
      const s = new Date(now); s.setMonth(s.getMonth() - 6)
      return { start_date: toISO(s), end_date: today }
    }
    case '1y': {
      const s = new Date(now); s.setFullYear(s.getFullYear() - 1)
      return { start_date: toISO(s), end_date: today }
    }
    default: return {}
  }
}

const PRESETS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d',        label: 'Last 7 Days' },
  { key: '1m',        label: '1 Month' },
  { key: '3m',        label: '3 Months' },
  { key: '6m',        label: '6 Months' },
  { key: '1y',        label: '1 Year' },
  { key: 'custom',    label: 'Custom Date' },
]

// ── Summary Stat Card ────────────────────────────────────────
function SummaryCard({ label, value, sub, icon: Icon, gradient, trend }) {
  return (
    <motion.div variants={fadeUp}
      className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
          {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold">
          {trend >= 0
            ? <FiTrendingUp size={13} />
            : <FiTrendingDown size={13} />}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs last period</span>
        </div>
      )}
      {/* decorative blob */}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />
    </motion.div>
  )
}

// ── Breakdown Row ────────────────────────────────────────────
function BreakdownRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-zinc-600">
        <span>{label}</span>
        <span>{fmtFull(value)} <span className="text-zinc-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Trip Row ─────────────────────────────────────────────────
function TripRow({ trip, index }) {
  const profit = Number(trip.trip_profit)
  const isLoss = profit < 0
  return (
    <motion.tr
      variants={fadeUp}
      className="border-b border-zinc-50 last:border-none hover:bg-zinc-50/60 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500">
            {index + 1}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-800 leading-tight">{trip.customer_name}</p>
            <p className="text-[10px] text-zinc-400">
              {trip.source && trip.destination ? `${trip.source} → ${trip.destination}` : 'Route N/A'}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs font-semibold text-zinc-700">{fmtFull(trip.revenue)}</td>
      <td className="py-3 px-4 text-xs font-semibold text-zinc-500">{fmtFull(trip.challan_expense)}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold
          ${isLoss ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {isLoss ? <FiTrendingDown size={11} /> : <FiTrendingUp size={11} />}
          {fmtFull(Math.abs(profit))}
        </span>
      </td>
    </motion.tr>
  )
}

// ── Main Dashboard ───────────────────────────────────────────
export default function DashboardHome() {
  const [preset, setPreset] = useState(null)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filters = preset === 'custom'
    ? { start_date: customStart, end_date: customEnd }
    : preset ? getPresetRange(preset) : {}

  const activeLabel = preset === 'custom'
    ? (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Custom Date')
    : PRESETS.find(p => p.key === preset)?.label ?? 'All Time'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profit-loss', filters],
    queryFn: () => fetchProfitLoss(filters),
    staleTime: 5 * 60 * 1000,
    enabled: preset !== 'custom' || (!!customStart && !!customEnd),
  })

  const summary = data?.summary ?? {}
  const rev = data?.revenue_breakdown ?? {}
  const exp = data?.expense_breakdown ?? {}
  const trips = data?.per_trip ?? []
  const isProfit = summary.status === 'PROFIT'

  // Revenue breakdown for pie chart
  const revPieData = [
    { name: 'Trip Revenue', value: rev.trip_revenue ?? 0, color: '#6366f1' },
    { name: 'Bill Revenue', value: rev.bill_revenue ?? 0, color: '#3b82f6' },
    { name: 'Ledger Credit', value: rev.ledger_credit ?? 0, color: '#10b981' },
  ].filter(d => d.value > 0)

  // Expense breakdown for bar chart
  const expBarData = [
    { name: 'Salary', value: exp.salary ?? 0 },
    { name: 'Purchase', value: exp.purchase ?? 0 },
    { name: 'Challan Adv', value: exp.challan_advance ?? 0 },
    { name: 'Diesel', value: exp.challan_diesel ?? 0 },
    { name: 'TDS', value: exp.challan_tds ?? 0 },
    { name: 'Ledger Debit', value: exp.ledger_debit ?? 0 },
  ].filter(d => d.value > 0)

  const expColors = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']

  // Trip profit area chart (last 10 trips reversed for chronological order)
  const tripChartData = [...trips].reverse().slice(-10).map((t, i) => ({
    name: `T${i + 1}`,
    profit: Number(t.trip_profit),
    revenue: Number(t.revenue),
    expense: Number(t.challan_expense),
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <FiAlertCircle size={36} className="text-red-400" />
          <p className="text-sm text-zinc-500">Failed to load dashboard data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Profit & Loss overview across all operations</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* P&L status badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
            ${isProfit ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {isProfit ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
            {summary.status ?? '—'}
          </div>

          {/* Date filter dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all shadow-sm
                ${preset ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
            >
              <FiCalendar size={14} />
              <span>{activeLabel}</span>
              <FiChevronDown size={13} className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-30 p-1.5"
                >
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        setPreset(p.key)
                        if (p.key !== 'custom') setDropOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      {p.label}
                      {preset === p.key && <FiCheck size={13} className="text-zinc-900" />}
                    </button>
                  ))}

                  {/* Custom date inputs */}
                  {preset === 'custom' && (
                    <div className="px-3 pb-2 pt-1 space-y-2 border-t border-zinc-100 mt-1">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">From</label>
                        <input type="date" value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">To</label>
                        <input type="date" value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </div>
                      <button
                        onClick={() => setDropOpen(false)}
                        disabled={!customStart || !customEnd}
                        className="w-full py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold disabled:opacity-40 hover:bg-zinc-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {preset && (
                    <button
                      onClick={() => { setPreset(null); setCustomStart(''); setCustomEnd(''); setDropOpen(false) }}
                      className="w-full px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors border-t border-zinc-100 mt-1 text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Top Summary Cards ── */}
      <motion.div initial="hidden" animate="show" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={fmt(summary.total_revenue)}
          sub={fmtFull(summary.total_revenue)}
          icon={FaRupeeSign}
          gradient="from-indigo-500 to-blue-600"
        />
        <SummaryCard
          label="Total Expense"
          value={fmt(summary.total_expense)}
          sub={fmtFull(summary.total_expense)}
          icon={FiCreditCard}
          gradient="from-rose-500 to-pink-600"
        />
        <SummaryCard
          label="Net Profit / Loss"
          value={fmt(Math.abs(summary.profit_loss))}
          sub={isProfit ? 'In profit' : 'In loss'}
          icon={isProfit ? FiTrendingUp : FiTrendingDown}
          gradient={isProfit ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-500'}
        />
        <SummaryCard
          label="Total Trips"
          value={trips.length}
          sub="Tracked in this period"
          icon={FiTruck}
          gradient="from-violet-500 to-purple-600"
        />
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Trip Profit Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-zinc-800">Trip Profit Trend</p>
              <p className="text-xs text-zinc-400">Revenue vs Expense per trip</p>
            </div>
            <FiActivity className="text-indigo-400" size={18} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={tripChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v, name) => [fmtFull(v), name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2}
                fill="url(#gRevenue)" dot={false} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2}
                fill="url(#gProfit)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {[{ color: '#6366f1', label: 'Revenue' }, { color: '#10b981', label: 'Profit' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Pie */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-zinc-800">Revenue Sources</p>
            <p className="text-xs text-zinc-400">Breakdown by type</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={revPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                paddingAngle={3} dataKey="value">
                {revPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v) => [fmtFull(v)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {revPieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-zinc-500">{d.name}</span>
                </div>
                <span className="font-semibold text-zinc-700">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Breakdown + Expense Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue & Expense Breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-5">
          <div>
            <p className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
              <FaRupeeSign className="text-indigo-400" size={15} /> Revenue Breakdown
            </p>
            <div className="space-y-3">
              <BreakdownRow label="Trip Revenue" value={rev.trip_revenue ?? 0} total={summary.total_revenue} color="#6366f1" />
              <BreakdownRow label="Bill Revenue" value={rev.bill_revenue ?? 0} total={summary.total_revenue} color="#3b82f6" />
              <BreakdownRow label="Ledger Credit" value={rev.ledger_credit ?? 0} total={summary.total_revenue} color="#10b981" />
            </div>
          </div>
          <div className="border-t border-zinc-50 pt-4">
            <p className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
              <FiCreditCard className="text-rose-400" size={15} /> Expense Breakdown
            </p>
            <div className="space-y-3">
              <BreakdownRow label="Salary" value={exp.salary ?? 0} total={summary.total_expense} color="#f59e0b" />
              <BreakdownRow label="Purchase" value={exp.purchase ?? 0} total={summary.total_expense} color="#ef4444" />
              <BreakdownRow label="Challan Advance" value={exp.challan_advance ?? 0} total={summary.total_expense} color="#8b5cf6" />
              <BreakdownRow label="Diesel" value={exp.challan_diesel ?? 0} total={summary.total_expense} color="#06b6d4" />
              <BreakdownRow label="TDS" value={exp.challan_tds ?? 0} total={summary.total_expense} color="#ec4899" />
            </div>
          </div>
        </div>

        {/* Expense Bar Chart */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-zinc-800">Expense Distribution</p>
              <p className="text-xs text-zinc-400">By category</p>
            </div>
            <FiShoppingBag className="text-amber-400" size={18} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={expBarData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v) => [fmtFull(v), 'Amount']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                {expBarData.map((_, i) => (
                  <Cell key={i} fill={expColors[i % expColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Per Trip Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <FiTruck className="text-indigo-400" size={15} /> Per Trip Breakdown
            </p>
            <p className="text-xs text-zinc-400">{trips.length} trips in this period</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <FiTrendingUp size={12} /> Profitable: {trips.filter(t => Number(t.trip_profit) >= 0).length}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <FiTrendingDown size={12} /> Loss: {trips.filter(t => Number(t.trip_profit) < 0).length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-black">
                <th className="py-3 px-4 text-left">Trip / Customer</th>
                <th className="py-3 px-4 text-left">Revenue</th>
                <th className="py-3 px-4 text-left">Expense</th>
                <th className="py-3 px-4 text-left">Net Profit</th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="show" variants={stagger}>
              {trips.map((trip, i) => (
                <TripRow key={trip.id} trip={trip} index={i} />
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
