import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FiClock, FiDollarSign, FiPackage, FiShoppingCart,
  FiArrowRight, FiMap, FiFilter, FiBarChart2,
} from 'react-icons/fi'
import { MdOutlineAccountBalance } from "react-icons/md";
import { FaRupeeSign } from 'react-icons/fa'
import * as reportAPI from '../../features/reports/reportAPI.js'

const REPORT_CONFIG = {
  attendance:          { label: 'Attendance',        icon: FiClock,        gradient: 'from-indigo-500 to-blue-600',   fetcher: reportAPI.fetchAttendanceReport },
  salary:              { label: 'Salary',            icon: FaRupeeSign,    gradient: 'from-emerald-500 to-teal-600',  fetcher: reportAPI.fetchSalaryReport },
  ledger:              { label: 'Ledger',            icon: MdOutlineAccountBalance ,   gradient: 'from-violet-500 to-purple-600', fetcher: reportAPI.fetchLedgerReport },
  products:            { label: 'Products',          icon: FiPackage,      gradient: 'from-amber-500 to-orange-600',  fetcher: reportAPI.fetchProductsReport },
  purchase:            { label: 'Purchase',          icon: FiShoppingCart, gradient: 'from-pink-500 to-rose-600',     fetcher: reportAPI.fetchPurchaseReport },
  'product-transfers': { label: 'Product Transfers', icon: FiArrowRight,   gradient: 'from-cyan-500 to-sky-600',      fetcher: reportAPI.fetchProductTransferReport },
  trips:               { label: 'Trips',             icon: FiMap,          gradient: 'from-lime-500 to-green-600',    fetcher: reportAPI.fetchTripsReport },
}

const DATE_MODES = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily',   label: 'Daily' },
  { key: 'yearly',  label: 'Yearly' },
  { key: 'custom',  label: 'Custom' },
]

function buildFilters(mode, monthVal, dayVal, yearVal, customFrom, customTo) {
  if (mode === 'monthly') return { month: monthVal }
  if (mode === 'daily')   return { date: dayVal }
  if (mode === 'yearly')  return { year: yearVal }
  if (mode === 'custom')  return { from: customFrom, to: customTo }
  return {}
}

const todayStr     = () => new Date().toISOString().slice(0, 10)
const thisMonthStr = () => new Date().toISOString().slice(0, 7)
const thisYearStr  = () => String(new Date().getFullYear())

function fmt(v) { return v === null || v === undefined ? '—' : String(v) }

function SummaryCards({ summary, gradient }) {
  if (!summary || !Object.keys(summary).length) return null
  const gradients = [
    'from-indigo-500 to-blue-600', 'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600', 'from-cyan-500 to-sky-600',
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(summary).map(([k, v], i) => (
        <div key={k} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{k.replace(/_/g, ' ')}</p>
          <p className="text-2xl font-bold text-zinc-900 tabular-nums">{fmt(v)}</p>
          <div className={`h-1 rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} opacity-60`} />
        </div>
      ))}
    </div>
  )
}

function AttendanceTable({ rows }) {
  if (!rows?.length) return <EmptyReport />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-white">
            {['User', 'Days Present', 'Total Hours', 'Earliest Punch In', 'Latest Punch Out'].map((h) => (
              <th key={h} className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.user_id ?? i} className="border-b border-zinc-50 hover:bg-indigo-50/30 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {(r.user_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-zinc-800">{r.user_name ?? '—'}</span>
                </div>
              </td>
              <td className="px-5 py-4 font-bold text-zinc-700">{fmt(r.days_present)}</td>
              <td className="px-5 py-4">
                {r.total_hours
                  ? <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-xs">{r.total_hours}h</span>
                  : <span className="text-zinc-400 text-xs">—</span>}
              </td>
              <td className="px-5 py-4 text-zinc-600 font-medium">{fmt(r.earliest_punch_in)}</td>
              <td className="px-5 py-4 text-zinc-600 font-medium">{fmt(r.latest_punch_out)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LedgerReportTable({ rows }) {
  if (!rows?.length) return <EmptyReport />
  const headers = ['Bill No', 'From', 'To', 'Amount', 'Txn Type', 'Purpose', 'Date', 'Time']
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-white">
            {headers.map((h) => (
              <th key={h} className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const dt = r.created_at ? new Date(r.created_at) : null
            const date = dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
            const time = dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
            return (
              <tr key={r.transaction_id ?? i} className="border-b border-zinc-50 hover:bg-violet-50/20 transition-colors">
                <td className="px-5 py-4">
                  {r.bill_no
                    ? <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-xs">{r.bill_no}</span>
                    : <span className="text-zinc-400 text-xs">—</span>}
                </td>
                <td className="px-5 py-4 font-semibold text-zinc-800 capitalize">{r.payer_name ?? r.payer_type ?? '—'}</td>
                <td className="px-5 py-4 font-semibold text-zinc-800 capitalize">{r.payee_name ?? r.payee_type ?? '—'}</td>
                <td className="px-5 py-4 font-black text-zinc-900 tabular-nums whitespace-nowrap">
                  ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 font-semibold text-xs capitalize">
                    {(r.transaction_type ?? '—').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-4 text-zinc-700 font-medium">{r.transaction_purpose_name ?? '—'}</td>
                <td className="px-5 py-4 font-semibold text-zinc-800 whitespace-nowrap">{date}</td>
                <td className="px-5 py-4 text-zinc-500 text-xs whitespace-nowrap">{time}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function GenericTable({ rows }) {
  if (!rows?.length) return <EmptyReport />
  const keys = Object.keys(rows[0]).filter((k) => k !== 'id')
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-white">
            {keys.map((k) => (
              <th key={k} className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-zinc-50 hover:bg-indigo-50/30 transition-colors">
              {keys.map((k) => (
                <td key={k} className="px-5 py-4 text-zinc-700 font-medium">{fmt(r[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyReport() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
      <FiBarChart2 size={40} className="opacity-30" />
      <p className="font-semibold text-sm">No data for the selected period</p>
    </div>
  )
}

export default function Reports({ reportType }) {
  const config = REPORT_CONFIG[reportType] ?? REPORT_CONFIG.attendance
  const TabIcon = config.icon

  const [dateMode,   setDateMode]   = useState('monthly')
  const [monthVal,   setMonthVal]   = useState(thisMonthStr())
  const [dayVal,     setDayVal]     = useState(todayStr())
  const [yearVal,    setYearVal]    = useState(thisYearStr())
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo,   setCustomTo]   = useState(todayStr())
  const [submitted,  setSubmitted]  = useState(false)

  const filters = useMemo(
    () => buildFilters(dateMode, monthVal, dayVal, yearVal, customFrom, customTo),
    [dateMode, monthVal, dayVal, yearVal, customFrom, customTo]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report', reportType, filters],
    queryFn: () => config.fetcher(filters),
    enabled: submitted,
    retry: false,
  })

  function handleGenerate() {
    if (submitted) refetch()
    else setSubmitted(true)
  }

  function onDateModeChange(m) { setDateMode(m); setSubmitted(false) }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
            <TabIcon size={22} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{config.label} Report</h1>
            <p className="text-zinc-500 font-medium text-sm mt-0.5">Generate {config.label.toLowerCase()} reports by time period.</p>
          </div>
        </header>

        {/* Filter bar */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-zinc-700 font-bold text-sm">
            <FiFilter size={15} />
            <span>Filter Period</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DATE_MODES.map((m) => (
              <button key={m.key} onClick={() => onDateModeChange(m.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border
                  ${dateMode === m.key ? 'bg-zinc-900 text-white border-transparent' : 'bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100'}`}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {dateMode === 'monthly' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Month</label>
                <input type="month" value={monthVal} onChange={(e) => { setMonthVal(e.target.value); setSubmitted(false) }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            )}
            {dateMode === 'daily' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</label>
                <input type="date" value={dayVal} onChange={(e) => { setDayVal(e.target.value); setSubmitted(false) }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            )}
            {dateMode === 'yearly' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Year</label>
                <input type="number" min="2000" max="2100" value={yearVal}
                  onChange={(e) => { setYearVal(e.target.value); setSubmitted(false) }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            )}
            {dateMode === 'custom' && (<>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">From</label>
                <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setSubmitted(false) }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">To</label>
                <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setSubmitted(false) }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            </>)}

            <button onClick={handleGenerate} disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-md bg-gradient-to-r ${config.gradient} hover:opacity-90 disabled:opacity-60`}>
              <FiBarChart2 size={15} />
              {isLoading ? 'Loading…' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
            <p className="font-bold text-sm">Failed to load report</p>
            <p className="text-xs text-zinc-400">{error.message}</p>
          </div>
        )}
        {data && !isLoading && (() => {
          const rows = data.data ?? data.items ?? []
          const summary = data.summary ?? null
          return (
            <div className="space-y-6">
              {summary && <SummaryCards summary={summary} gradient={config.gradient} />}
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
                {reportType === 'attendance'
                  ? <AttendanceTable rows={rows} />
                  : reportType === 'ledger'
                    ? <LedgerReportTable rows={rows} />
                    : <GenericTable rows={rows} />}
              </div>
            </div>
          )
        })()}
        {!submitted && !isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FiBarChart2 size={56} className="text-zinc-200" />
            <p className="font-semibold text-zinc-400 text-sm">Select a period and click Generate</p>
          </div>
        )}

      </div>
    </div>
  )
}
