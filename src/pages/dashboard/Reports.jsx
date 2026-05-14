import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import {
  FiClock, FiDollarSign, FiPackage, FiShoppingCart,
  FiArrowRight, FiFileText, FiFilter, FiDownload, FiBarChart2, FiPrinter, FiEye, FiMap, FiSearch, FiTruck, FiTool, FiUsers
} from 'react-icons/fi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MdOutlineAccountBalance } from "react-icons/md";
import { FaRupeeSign } from 'react-icons/fa'
import * as reportAPI from '../../features/reports/reportAPI.js'
import * as challanAPI from '../../features/challans/challanAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as customerAPI from '../../features/customers/customerAPI.js'
import * as placeAPI from '../../features/places/placeAPI.js'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'

const REPORT_CONFIG = {
  attendance: { label: 'Attendance', icon: FiClock, gradient: 'from-indigo-500 to-blue-600', fetcher: reportAPI.fetchAttendanceReport },
  bills: { label: 'Bills', icon: FiFileText, gradient: 'from-orange-500 to-red-600', fetcher: reportAPI.fetchBillsReport },
  salary: { label: 'Salary', icon: FaRupeeSign, gradient: 'from-emerald-500 to-teal-600', fetcher: reportAPI.fetchSalaryReport },
  ledger: { label: 'Ledger', icon: MdOutlineAccountBalance, gradient: 'from-violet-500 to-purple-600', fetcher: reportAPI.fetchLedgerReport },
  products: { label: 'Inventory', icon: FiPackage, gradient: 'from-amber-500 to-orange-600', fetcher: reportAPI.fetchProductsReport },
  purchase: { label: 'Purchase', icon: FiShoppingCart, gradient: 'from-pink-500 to-rose-600', fetcher: reportAPI.fetchPurchaseReport },
  'product-transfers': { label: 'Product Transfers', icon: FiArrowRight, gradient: 'from-cyan-500 to-sky-600', fetcher: reportAPI.fetchProductTransferReport },
  trips: { label: 'Trips', icon: FiMap, gradient: 'from-lime-500 to-green-600', fetcher: reportAPI.fetchTripsReport },
  'vehicle-income': { label: 'Vehicle Income', icon: FiTruck, gradient: 'from-blue-500 to-indigo-600', fetcher: reportAPI.fetchVehicleIncomeReport },
  'vehicle-expenditure': { label: 'Vehicle Expenditure', icon: FiTool, gradient: 'from-rose-600 to-pink-700', fetcher: reportAPI.fetchVehicleExpenditureReport },
  gst: { label: 'GST', icon: FiFileText, gradient: 'from-emerald-600 to-teal-700', fetcher: reportAPI.fetchGstReport },
  'shiftwise-work': { label: 'Shiftwise Work', icon: FiClock, gradient: 'from-fuchsia-500 to-purple-600', fetcher: reportAPI.fetchShiftwiseWorkReport },
  'userwise': { label: 'Userwise', icon: FiUsers, gradient: 'from-sky-500 to-blue-600', fetcher: reportAPI.fetchUserwiseReport },
}

const DATE_MODES = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily', label: 'Daily' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
]

function buildFilters(mode, monthVal, dayVal, yearVal, customFrom, customTo, vehicleId, customerId, billNo, placeId) {
  const baseFilters = {}
  if (mode === 'monthly') baseFilters.month = monthVal
  else if (mode === 'daily') baseFilters.date = dayVal
  else if (mode === 'yearly') baseFilters.year = yearVal
  else if (mode === 'custom') { baseFilters.from = customFrom; baseFilters.to = customTo }

  // Add vehicle and customer filters for bills/challans
  if (vehicleId) baseFilters.vehicle_id = vehicleId
  if (customerId) baseFilters.customer_id = customerId
  if (billNo) baseFilters.bill_no = billNo
  if (placeId) baseFilters.place_id = placeId

  return baseFilters
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const thisMonthStr = () => new Date().toISOString().slice(0, 7)
const thisYearStr = () => String(new Date().getFullYear())

function fmt(v) { return v === null || v === undefined ? '—' : String(v) }

function SummaryCards({ summary, gradient }) {
  if (!summary || !Object.keys(summary).length) return null
  const gradients = [
    'from-indigo-500 to-blue-600', 'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600', 'from-cyan-500 to-sky-600',
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Object.entries(summary).map(([k, v], i) => {
        if (k === 'vehicle') return null
        const isMonetary = k.includes('cost') || k.includes('expenditure') || k.includes('amount') || k.includes('total')
        return (
          <div key={k} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col gap-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight h-5 overflow-hidden">
              {k.replace(/total_/g, '').replace(/_/g, ' ')}
            </p>
            <p className="text-xl font-bold text-zinc-900 tabular-nums truncate">
              {isMonetary ? `₹${Number(v || 0).toLocaleString('en-IN')}` : fmt(v)}
            </p>
            <div className={`h-1 rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} opacity-60`} />
          </div>
        )
      })}
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

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 14

    // Header Section
    doc.setFontSize(15).setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH  |  JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM)', pageWidth / 2, margin + 5, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, margin + 8, pageWidth - margin, margin + 8)

    doc.setFontSize(11).setFont('helvetica', 'bold')
    doc.text('LEDGER STATEMENT', pageWidth / 2, margin + 14, { align: 'center' })

    doc.setDrawColor(0, 0, 0)
    doc.line(margin, margin + 17, pageWidth - margin, margin + 17)

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, margin, margin + 22)

    const tableBody = rows.map((r) => {
      const dt = r.created_at ? new Date(r.created_at) : null
      return [
        r.bill_no || '—',
        r.payer_name ?? r.payer_type ?? '—',
        r.payee_name ?? r.payee_type ?? '—',
        `Rs.${Number(r.amount || 0).toLocaleString('en-IN')}`,
        (r.transaction_type ?? '—').replace(/_/g, ' ').toUpperCase(),
        r.transaction_purpose_name ?? '—',
        dt ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '—',
        dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
      ]
    })

    const totalAmount = rows.reduce((a, b) => a + (Number(b.amount) || 0), 0)
    tableBody.push(['', '', 'TOTAL', `Rs.${totalAmount.toLocaleString('en-IN')}`, '', '', '', ''])

    autoTable(doc, {
      startY: margin + 26,
      head: [headers],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 40 },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' }
      },
      didParseCell: (d) => {
        if (d.row.index === tableBody.length - 1) {
          d.cell.styles.fontStyle = 'bold'
          d.cell.styles.fillColor = [240, 240, 240]
        }
      },
      didDrawPage: (d) => {
        doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(150)
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0)
    doc.text('BANK: STATE BANK OF INDIA(ASKA RAOD) IFSC: SBIN0007931 A/C NO.:-33169091606', margin, finalY)

    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('Prepared By', margin, signY + 5)
    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })
    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) doc.save(`ledger-report-${Date.now()}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-3">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm">
          <FiEye size={14} /> Show PDF
        </button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95">
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map((h) => (
                <th key={h} className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r, i) => {
              const dt = r.created_at ? new Date(r.created_at) : null
              const date = dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
              const time = dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
              return (
                <tr key={r.transaction_id ?? i} className="hover:bg-violet-50/20 transition-colors">
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

function BillsTable({ rows, onViewDetails, challans, customers, companies, trips, places }) {
  if (!rows?.length) return <EmptyReport />

  const flattenedRows = rows.flatMap(bill =>
    (bill.challans || []).map(bc => {
      const challan = challans.find(c => String(c.id) === String(bc.id))
      if (!challan) return null
      const trip = trips.find(t => String(t.id) === String(challan.trip_id))
      return { ...challan, bill_no: bill.bill_no, trip }
    })
  ).filter(Boolean)

  const headers = [
    'Sl No', 'Date', 'Challan No', 'Unloading Date', 'Truck No',
    'From Place', 'Destination', 'Loading', 'Unload Qty', 'Rate/Unit',
    'Amount', 'Tax', 'TDS', 'Advance', 'Shortage', 'Shortage Amt', 'Balance'
  ]

  const getRowData = (c, i) => {
    const t = c.trip || {}
    const from = places?.find(p => String(p.id) === String(t.source))?.name || '—'
    const to = places?.find(p => String(p.id) === String(t.destination))?.name || '—'
    const rate = t.amount && t.quantity ? (Number(t.amount) / Number(t.quantity)) : 0
    const tax = (Number(c.cgst_amount) || 0) + (Number(c.sgst_amount) || 0)

    return [
      i + 1,
      c.challan_date ? new Date(c.challan_date).toLocaleDateString('en-IN') : '—',
      c.challan_no || '—',
      c.unloading_date ? new Date(c.unloading_date).toLocaleDateString('en-IN') : '—',
      c.vehicle_number || '—',
      from,
      to,
      c.weight_at_loading || '0',
      c.weight_at_unloading || '0',
      `₹${Number(rate).toLocaleString('en-IN')}`,
      `₹${Number(c.total_amount || 0).toLocaleString('en-IN')}`,
      `₹${Number(tax || 0).toLocaleString('en-IN')}`,
      `₹${Number(c.tds_amount || 0).toLocaleString('en-IN')}`,
      `₹${Number(c.advance || 0).toLocaleString('en-IN')}`,
      c.shortage || '0',
      `₹${Number(c.shortage_amount || 0).toLocaleString('en-IN')}`,
      `₹${Number(c.balance || 0).toLocaleString('en-IN')}`
    ]
  }

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    // 1. Header Section
    const firstBill = rows[0]
    const billChallans = flattenedRows
    const firstChallan = billChallans[0]
    const firstTrip = firstChallan?.trip
    const company = companies?.find(c => String(c.id) === String(firstChallan?.transport || firstTrip?.company_id || firstBill?.company_id))

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(company?.name?.toUpperCase() || 'R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH', margin, margin + 5)
    doc.text('JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM), PH- 9437071271', margin, margin + 10)
    doc.text(`PAN NO:- ${company?.pan_no || 'AIUPS4449P'}`, margin, margin + 15)
    doc.text(`GST NO.: ${company?.gst_no || '21AIUPS4449P1ZC'}`, margin, margin + 20)

    // 2. Sub-Header Section (ATC LOGISTICS)
    doc.line(margin, margin + 23, pageWidth - margin, margin + 23)
    doc.setFont('helvetica', 'bold')
    const customerName = firstChallan?.customer_name || (firstTrip ? customers?.find(c => String(c.id) === String(firstTrip.customer_id))?.customer_name : firstBill?.customer_name)
    doc.text(customerName?.toUpperCase() || 'ATC LOGISTICS', pageWidth / 2, margin + 28, { align: 'center' })
    doc.line(margin, margin + 30, pageWidth - margin, margin + 30)

    doc.setFontSize(9)
    doc.text(`BillNo  ${firstBill?.bill_no || 'ATC-2'}`, margin, margin + 35)
    doc.text(`Bill Date  ${firstBill?.bill_date || new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 40, margin + 35)

    // 3. Table Headers mapping for Image Design
    const imgHeaders = [
      'SLNo', 'Date', 'ChallanNo', 'Un Date', 'Truck no',
      'From Place', 'Destination', 'Loading', 'Un Qty', 'Rate',
      'Amount', 'Tax', 'TDS', 'Advanc', 'Short', 'Sh(Rs)', 'Balance'
    ]

    // 4. Data with Totals
    const tableBody = flattenedRows.map((c, i) => {
      const t = c.trip || {}
      const from = places?.find(p => String(p.id) === String(t.source))?.name || '—'
      const to = places?.find(p => String(p.id) === String(t.destination))?.name || '—'
      const rate = t.amount && t.quantity ? (Number(t.amount) / Number(t.quantity)) : 0
      const tax = (Number(c.cgst_amount) || 0) + (Number(c.sgst_amount) || 0)

      return [
        String(i + 1).padStart(2, '0') + '.',
        c.challan_date ? new Date(c.challan_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '—',
        c.challan_no || '—',
        c.unloading_date ? new Date(c.unloading_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '—',
        c.vehicle_number || '—',
        from, to,
        Number(c.weight_at_loading || 0).toFixed(2),
        Number(c.weight_at_unloading || 0).toFixed(2),
        Number(rate).toFixed(2),
        Number(c.total_amount || 0).toFixed(2),
        Number(tax || 0).toFixed(2),
        Number(c.tds_amount || 0).toFixed(2),
        Number(c.advance || 0).toFixed(2),
        Number(c.shortage || 0).toFixed(2),
        Number(c.shortage_amount || 0).toFixed(2),
        Number(c.balance || 0).toFixed(2)
      ]
    })

    // Add summary row
    const totals = {
      unQty: flattenedRows.reduce((a, b) => a + Number(b.weight_at_unloading || 0), 0),
      amount: flattenedRows.reduce((a, b) => a + Number(b.total_amount || 0), 0),
      tax: flattenedRows.reduce((a, b) => a + (Number(b.cgst_amount || 0) + Number(b.sgst_amount || 0)), 0),
      tds: flattenedRows.reduce((a, b) => a + Number(b.tds_amount || 0), 0),
      adv: flattenedRows.reduce((a, b) => a + Number(b.advance || 0), 0),
      sh: flattenedRows.reduce((a, b) => a + Number(b.shortage || 0), 0),
      shRs: flattenedRows.reduce((a, b) => a + Number(b.shortage_amount || 0), 0),
      bal: flattenedRows.reduce((a, b) => a + Number(b.balance || 0), 0)
    }

    tableBody.push([
      `No of Challans:${flattenedRows.length}`, '', '', '', '', '', '', '',
      totals.unQty.toFixed(2), '', totals.amount.toFixed(2), totals.tax.toFixed(2),
      totals.tds.toFixed(2), totals.adv.toFixed(2), totals.sh.toFixed(2),
      totals.shRs.toFixed(2), totals.bal.toFixed(2)
    ])

    autoTable(doc, {
      startY: margin + 38,
      head: [imgHeaders],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], font: 'helvetica' },
      headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5, color: [0, 0, 0] } },
      columnStyles: {
        0: { cellWidth: 10 }, 1: { cellWidth: 15 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 },
        10: { fontStyle: 'bold' }, 16: { fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y)
        }
      }
    })

    // 5. Footer Section
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text(`BANK: ${company?.bank_name || 'STATE BANK OF INDIA'}(${company?.branch || 'ASKA RAOD'}) IFSC: ${company?.ifsc_code || 'SBIN0007931'} A/C NO.:-${company?.account_no_1 || '33169091606'}`, margin, finalY)

    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('SHISHIR', margin + 5, signY)
    doc.text('Prepared By', margin, signY + 5)

    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })

    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) {
      doc.save(`bill-${firstBill?.bill_no || 'report'}.pdf`)
    } else {
      window.open(doc.output('bloburl'), '_blank')
    }
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={() => exportPDF(false)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all"
        >
          <FiEye size={14} /> Show PDF
        </button>
        <button
          onClick={() => exportPDF(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap border-r border-zinc-800 last:border-none">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {flattenedRows.map((c, i) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                {getRowData(c, i).map((val, j) => (
                  <td key={j} className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap border-r border-zinc-50 last:border-none">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BillDetailsModal({ bill, onClose, challans, trips, customers, places, companies }) {
  if (!bill) return null

  const billChallans = (bill.challans || []).map(bc => challans.find(c => String(c.id) === String(bc.id))).filter(Boolean)

  return (
    <Modal open={!!bill} title={`Bill Details: ${bill.bill_no}`} onClose={onClose} size="lg">
      <div className="space-y-6 p-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Bill No" value={bill.bill_no} />
          <DetailItem label="Date" value={bill.bill_date ?? (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '—')} />
          {(() => {
            const billChallans = (bill.challans || []).map(bc => challans.find(c => String(c.id) === String(bc.id))).filter(Boolean)
            const firstChallan = billChallans[0]
            const firstTrip = firstChallan ? trips.find(t => String(t.id) === String(firstChallan.trip_id)) : null

            // Check if challan already has customer/company names (as suggested by user)
            const customerName = firstChallan?.customer_name || (firstTrip ? customers?.find(c => String(c.id) === String(firstTrip.customer_id))?.customer_name : bill.customer_name)

            // User says company name field in challan is 'transport'
            const challanTransport = firstChallan?.transport
            const resolvedCompanyFromTransport = companies?.find(c => String(c.id) === String(challanTransport))?.name
            const companyName = firstChallan?.company_name || resolvedCompanyFromTransport || challanTransport || (firstTrip ? companies?.find(c => String(c.id) === String(firstTrip.company_id))?.name : bill.company_name)

            const totalAmount = billChallans.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0)
            const balance = billChallans.reduce((acc, c) => acc + (Number(c.balance) || 0), 0)

            return (<>
              <DetailItem label="Company" value={companyName} />
              <DetailItem label="Customer" value={customerName} />
              <DetailItem label="Total Amount" value={`₹${Number(totalAmount || 0).toLocaleString('en-IN')}`} isBold />
              <DetailItem label="Balance" value={`₹${Number(balance || 0).toLocaleString('en-IN')}`} isBold />
            </>)
          })()}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Challan Details</h3>
          <div className="border border-zinc-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  {['Challan No', 'Date', 'Route', 'Vehicle', 'Amount'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {billChallans.map(c => {
                  const trip = trips.find(t => String(t.id) === String(c.trip_id))
                  const from = trip ? places.find(p => String(p.id) === String(trip.source))?.name : ''
                  const to = trip ? places.find(p => String(p.id) === String(trip.destination))?.name : ''
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-zinc-900">{c.challan_no}</td>
                      <td className="px-4 py-3 text-zinc-600">{c.challan_date ? new Date(c.challan_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-medium text-zinc-700">
                          <span>{from || '—'}</span>
                          <FiArrowRight size={10} className="text-zinc-300" />
                          <span>{to || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">{c.vehicle_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-zinc-900 whitespace-nowrap">₹{Number(c.total_amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function TripsTable({ rows, customers, places }) {
  if (!rows?.length) return <EmptyReport />

  const headers = [
    'Customer', 'From Place', 'To Place', 'Quantity',
    'Start Date', 'End Date'
  ]

  const getRowData = (trip) => {
    const customer = customers?.find(c => String(c.id) === String(trip.customer_id))
    const fromPlace = places?.find(p => String(p.id) === String(trip.source))
    const toPlace = places?.find(p => String(p.id) === String(trip.destination))

    return [
      customer?.customer_name || trip.customer_id || '—',
      fromPlace?.name || trip.source || '—',
      toPlace?.name || trip.destination || '—',
      trip.quantity || '0',
      trip.start_date_time ? new Date(trip.start_date_time).toLocaleDateString('en-IN') : '—',
      trip.end_date_time ? new Date(trip.end_date_time).toLocaleDateString('en-IN') : '—'
    ]
  }

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    // Header Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH', margin, margin + 5)
    doc.text('JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM), PH- 9437071271', margin, margin + 10)
    doc.text('PAN NO:- AIUPS4449P', margin, margin + 15)
    doc.text('GST NO.: 21AIUPS4449P1ZC', margin, margin + 20)

    // Sub-Header Section
    doc.line(margin, margin + 23, pageWidth - margin, margin + 23)
    doc.setFont('helvetica', 'bold')
    doc.text('TRIPS REPORT', pageWidth / 2, margin + 28, { align: 'center' })
    doc.line(margin, margin + 30, pageWidth - margin, margin + 30)

    doc.setFontSize(9)
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, margin, margin + 35)

    // Table Headers
    const headers = ['Customer', 'From Place', 'To Place', 'Quantity', 'Start Date', 'End Date']

    // Table Data
    const tableBody = rows.map((trip) => {
      const customer = customers?.find(c => String(c.id) === String(trip.customer_id))
      const fromPlace = places?.find(p => String(p.id) === String(trip.source))
      const toPlace = places?.find(p => String(p.id) === String(trip.destination))

      return [
        customer?.customer_name || trip.customer_id || '—',
        fromPlace?.name || trip.source || '—',
        toPlace?.name || trip.destination || '—',
        String(trip.quantity || '0'),
        trip.start_date_time ? new Date(trip.start_date_time).toLocaleDateString('en-IN') : '—',
        trip.end_date_time ? new Date(trip.end_date_time).toLocaleDateString('en-IN') : '—'
      ]
    })

    // Add summary row
    const totalQuantity = rows.reduce((a, b) => a + (Number(b.quantity) || 0), 0)
    tableBody.push([
      `Total Trips: ${rows.length}`, '', '', String(totalQuantity), '', ''
    ])

    autoTable(doc, {
      startY: margin + 38,
      head: [headers],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0], font: 'helvetica' },
      headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5, color: [0, 0, 0] } },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      },
      didDrawCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y)
        }
      }
    })

    // Footer Section
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text('BANK: STATE BANK OF INDIA(ASKA RAOD) IFSC: SBIN0007931 A/C NO.:-33169091606', margin, finalY)

    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('SHISHIR', margin + 5, signY)
    doc.text('Prepared By', margin, signY + 5)

    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })

    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) {
      doc.save(`trips-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } else {
      window.open(doc.output('bloburl'), '_blank')
    }
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={() => exportPDF(false)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all"
        >
          <FiEye size={14} /> Show PDF
        </button>
        <button
          onClick={() => exportPDF(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap border-r border-zinc-800 last:border-none">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((trip) => (
              <tr key={trip.id} className="hover:bg-zinc-50 transition-colors">
                {getRowData(trip).map((val, j) => (
                  <td key={j} className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap border-r border-zinc-50 last:border-none">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VehicleIncomeTable({ rows, customers, places, vehicles }) {
  if (!rows?.length) return <EmptyReport />

  const headers = [
    'Date', 'Vehicle', 'Route', 'Customer', 'Revenue', 'Expenses', 'Profit'
  ]

  const getRowData = (trip) => {
    const customer = customers?.find(c => String(c.id) === String(trip.customer_id))
    const fromPlace = places?.find(p => String(p.id) === String(trip.source))
    const toPlace = places?.find(p => String(p.id) === String(trip.destination))

    // Resolve vehicle registration number
    const vehicle = vehicles?.find(v => String(v.id) === String(trip.vehicle_id) || String(v.registration_number) === String(trip.vehicle_number))
    const vehicleName = vehicle?.registration_number || trip.vehicle_number || trip.vehicle_id || '—'

    return [
      trip.start_date_time ? new Date(trip.start_date_time).toLocaleDateString('en-IN') : '—',
      <span key="v" className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">{vehicleName}</span>,
      <div key={trip.id} className="flex items-center gap-1">
        <span>{fromPlace?.name || '—'}</span>
        <FiArrowRight size={10} className="text-zinc-300" />
        <span>{toPlace?.name || '—'}</span>
      </div>,
      customer?.customer_name || '—',
      <span key="rev" className="text-emerald-600 font-bold">₹{Number(trip.revenue || 0).toLocaleString('en-IN')}</span>,
      <span key="exp" className="text-rose-600 font-bold">₹{Number(trip.expenses || 0).toLocaleString('en-IN')}</span>,
      <span key="prof" className={`font-black ${trip.profit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
        ₹{Number(trip.profit || 0).toLocaleString('en-IN')}
      </span>
    ]
  }

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    // Header Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH', margin, margin + 5)
    doc.text('JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM), PH- 9437071271', margin, margin + 10)
    doc.text('PAN NO:- AIUPS4449P', margin, margin + 15)
    doc.text('GST NO.: 21AIUPS4449P1ZC', margin, margin + 20)

    // Sub-Header Section
    doc.line(margin, margin + 23, pageWidth - margin, margin + 23)
    doc.setFont('helvetica', 'bold')
    doc.text('VEHICLE INCOME REPORT', pageWidth / 2, margin + 28, { align: 'center' })
    doc.line(margin, margin + 30, pageWidth - margin, margin + 30)

    doc.setFontSize(9)
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, margin, margin + 35)

    const pdfHeaders = ['Date', 'Vehicle', 'Route', 'Customer', 'Revenue', 'Expenses', 'Profit']

    const tableBody = rows.map(r => {
      const customer = customers?.find(c => String(c.id) === String(r.customer_id))?.customer_name || '-'
      const from = places?.find(p => String(p.id) === String(r.source))?.name || '-'
      const to = places?.find(p => String(p.id) === String(r.destination))?.name || '-'
      const vehicle = vehicles?.find(v => String(v.id) === String(r.vehicle_id) || String(v.registration_number) === String(r.vehicle_number))?.registration_number || r.vehicle_number || r.vehicle_id || '-'
      return [
        r.start_date_time ? new Date(r.start_date_time).toLocaleDateString('en-IN') : '-',
        vehicle,
        `${from} -> ${to}`,
        customer,
        `Rs.${Number(r.revenue || 0).toLocaleString('en-IN')}`,
        `Rs.${Number(r.expenses || 0).toLocaleString('en-IN')}`,
        `Rs.${Number(r.profit || 0).toLocaleString('en-IN')}`
      ]
    })

    const totals = {
      rev: rows.reduce((a, b) => a + Number(b.revenue || 0), 0),
      exp: rows.reduce((a, b) => a + Number(b.expenses || 0), 0),
      prof: rows.reduce((a, b) => a + Number(b.profit || 0), 0)
    }

    tableBody.push([
      `Total Trips: ${rows.length}`, '', '', '',
      `Rs.${totals.rev.toLocaleString('en-IN')}`,
      `Rs.${totals.exp.toLocaleString('en-IN')}`,
      `Rs.${totals.prof.toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      startY: margin + 38,
      head: [pdfHeaders],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0], font: 'helvetica' },
      headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5, color: [0, 0, 0] } },
      columnStyles: {
        4: { fontStyle: 'bold', textColor: [5, 150, 105] }, // Revenue emerald
        5: { fontStyle: 'bold', textColor: [225, 29, 72] }, // Expenses rose
        6: { fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y)
        }
      }
    })

    // Footer Section
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text('BANK: STATE BANK OF INDIA(ASKA RAOD) IFSC: SBIN0007931 A/C NO.:-33169091606', margin, finalY)

    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('SHISHIR', margin + 5, signY)
    doc.text('Prepared By', margin, signY + 5)
    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })
    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) doc.save(`vehicle-income-${new Date().getTime()}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-1">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all">
          <FiEye size={14} /> Show PDF
        </button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95">
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((trip, i) => (
              <tr key={trip.id || i} className="hover:bg-zinc-50 transition-colors">
                {getRowData(trip).map((val, j) => (
                  <td key={j} className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 font-black text-zinc-900 border-t-2 border-zinc-200">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Total Trips: {rows.length} | TOTAL
              </td>
              <td className="px-4 py-3 text-emerald-600">₹{rows.reduce((a, b) => a + Number(b.revenue || 0), 0).toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-rose-600">₹{rows.reduce((a, b) => a + Number(b.expenses || 0), 0).toLocaleString('en-IN')}</td>
              <td className={`px-4 py-3 ${rows.reduce((a, b) => a + Number(b.profit || 0), 0) >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                ₹{rows.reduce((a, b) => a + Number(b.profit || 0), 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function VehicleExpenditureTable({ rows, summary, categorized_totals, timeline }) {
  const data = timeline || rows || []
  if (!data.length) return <EmptyReport />

  const headers = ['Sl No', 'Date', 'Vehicle', 'Type', 'Category', 'Description', 'Part Name', 'Qty', 'Amount', 'Source']

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('l', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 14
    const rs = 'Rs.'

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFontSize(15).setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH  |  JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM)', pageWidth / 2, margin + 5, { align: 'center' })

    doc.setDrawColor(180, 180, 180)
    doc.line(margin, margin + 8, pageWidth - margin, margin + 8)

    doc.setFontSize(11).setFont('helvetica', 'bold')
    doc.text('VEHICLE EXPENDITURE STATEMENT', pageWidth / 2, margin + 14, { align: 'center' })

    doc.setDrawColor(0, 0, 0)
    doc.line(margin, margin + 17, pageWidth - margin, margin + 17)

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text(`Vehicle: ${summary?.vehicle || 'All Vehicles'}`, margin, margin + 22)
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin, margin + 22, { align: 'right' })

    // ── Summary table (left half) ────────────────────────────────────────────
    const summaryData = [
      ['Spare Parts',  `${rs} ${Number(summary?.total_parts_cost || 0).toLocaleString('en-IN')}`],
      ['Fuel',         `${rs} ${Number(summary?.total_fuel_cost || 0).toLocaleString('en-IN')}`],
      ['Maintenance',  `${rs} ${Number(summary?.total_maintenance_cost || 0).toLocaleString('en-IN')}`],
      ['Staff',        `${rs} ${Number(summary?.total_staff_cost || 0).toLocaleString('en-IN')}`],
      ['Toll/Parking', `${rs} ${Number(summary?.total_toll_cost || 0).toLocaleString('en-IN')}`],
      ['Other',        `${rs} ${Number(summary?.total_other_cost || 0).toLocaleString('en-IN')}`],
      ['TOTAL',        `${rs} ${Number(summary?.total_expenditure || 0).toLocaleString('en-IN')}`],
    ]

    autoTable(doc, {
      startY: margin + 26,
      head: [['Category', 'Amount']],
      body: summaryData,
      theme: 'grid',
      tableWidth: 90,
      margin: { left: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (d) => {
        if (d.row.index === summaryData.length - 1) {
          d.cell.styles.fontStyle = 'bold'
          d.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })

    // ── Main detail table ────────────────────────────────────────────────────
    const pdfHeaders = ['#', 'Date', 'Vehicle', 'Type', 'Category', 'Description', 'Part Name', 'Qty', 'Amount', 'Source']

    const tableBody = data.map((r, i) => [
      i + 1,
      r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-',
      r.vehicle_number || '-',
      r.type || '-',
      r.category || '-',
      r.description || '-',
      r.part_name && r.part_name !== '—' ? r.part_name : '-',
      r.quantity && r.quantity !== '—' ? r.quantity : '-',
      `${rs} ${Number(r.amount || 0).toLocaleString('en-IN')}`,
      r.source || '-',
    ])

    // Total row
    const grandTotal = data.reduce((a, b) => a + Number(b.amount || 0), 0)
    tableBody.push(['', '', '', '', '', '', '', 'TOTAL', `${rs} ${grandTotal.toLocaleString('en-IN')}`, ''])

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [pdfHeaders],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 24 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 30 },
        7: { cellWidth: 18, halign: 'center' },
        8: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 22, halign: 'center' },
      },
      didParseCell: (d) => {
        // Bold + shaded total row
        if (d.row.index === tableBody.length - 1) {
          d.cell.styles.fontStyle = 'bold'
          d.cell.styles.fillColor = [230, 230, 230]
        }
      },
      // Page numbers in footer
      didDrawPage: (d) => {
        doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(150)
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2, pageHeight - 8, { align: 'center' }
        )
        doc.setTextColor(0)
      }
    })

    if (shouldDownload) doc.save(`vehicle-expenditure-${new Date().toISOString().slice(0, 10)}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-end gap-2 px-6">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all">
          <FiEye size={14} /> Show PDF
        </button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md">
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {data.map((r, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400 font-bold">{i + 1}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3 font-bold text-indigo-600">{r.vehicle_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${r.type === 'Inventory' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-zinc-800">{r.category}</td>
                <td className="px-4 py-3 text-zinc-600 max-w-xs truncate" title={r.description}>{r.description}</td>
                <td className="px-4 py-3 font-medium text-zinc-700">{r.part_name}</td>
                <td className="px-4 py-3 text-zinc-500 italic">{r.quantity}</td>
                <td className="px-4 py-3 text-right font-black text-rose-600">₹{Number(r.amount || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{r.source}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 font-black border-t-2 border-zinc-200">
            <tr>
              <td colSpan={8} className="px-4 py-4 text-right text-zinc-500 uppercase text-[10px] tracking-widest">Total Vehicle Expenditure</td>
              <td className="px-4 py-4 text-right text-rose-700 text-lg">₹{Number(summary?.total_expenditure || 0).toLocaleString('en-IN')}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function UserwiseReportTable({ rows }) {
  if (!rows?.length) return <EmptyReport />

  const [expanded, setExpanded] = useState(null)

  const fmtTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 14

    doc.setFontSize(15).setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })
    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH  |  JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM)', pageWidth / 2, margin + 5, { align: 'center' })
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, margin + 8, pageWidth - margin, margin + 8)
    doc.setFontSize(11).setFont('helvetica', 'bold')
    doc.text('USERWISE ATTENDANCE REPORT', pageWidth / 2, margin + 14, { align: 'center' })
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, margin + 17, pageWidth - margin, margin + 17)
    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, margin, margin + 22)
    doc.text(`Total Employees: ${rows.length}`, pageWidth - margin, margin + 22, { align: 'right' })

    const tableBody = rows.map((r, i) => [
      i + 1,
      r.user_name || '—',
      r.shifts || '—',
      r.total_days,
      r.days_present,
      r.incomplete_days,
      r.total_hours || '—'
    ])

    autoTable(doc, {
      startY: margin + 26,
      head: [['#', 'Employee', 'Shifts', 'Total Days', 'Present', 'Incomplete', 'Total Hours']],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
      },
      didDrawPage: () => {
        doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(150)
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
        doc.setTextColor(0)
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0)
    doc.text('BANK: STATE BANK OF INDIA(ASKA RAOD) IFSC: SBIN0007931 A/C NO.:-33169091606', margin, finalY)
    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('Prepared By', margin, signY + 5)
    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })
    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) doc.save(`userwise-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-1">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm">
          <FiEye size={14} /> Show PDF
        </button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95">
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {['#', 'Employee', 'Shifts', 'Total Days', 'Present', 'Incomplete', 'Total Hours', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap border-r border-zinc-800 last:border-none">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r, i) => (
              <>
                <tr
                  key={r.user_id}
                  className="hover:bg-sky-50/20 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}
                >
                  <td className="px-4 py-3 text-zinc-400 font-bold border-r border-zinc-50">{i + 1}</td>
                  <td className="px-4 py-3 border-r border-zinc-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                        {(r.user_name ?? 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-zinc-800">{r.user_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 font-medium border-r border-zinc-50">{r.shifts || '—'}</td>
                  <td className="px-4 py-3 text-center font-bold text-zinc-700 border-r border-zinc-50">{r.total_days}</td>
                  <td className="px-4 py-3 border-r border-zinc-50">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg">{r.days_present}</span>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-50">
                    {r.incomplete_days > 0
                      ? <span className="bg-amber-50 border border-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-lg">{r.incomplete_days}</span>
                      : <span className="text-zinc-300">0</span>}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-50">
                    {r.total_hours !== '—'
                      ? <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">{r.total_hours}</span>
                      : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-[10px] font-semibold">
                    {expanded === r.user_id ? '▲ Hide' : '▼ Details'}
                  </td>
                </tr>
                {expanded === r.user_id && (
                  <tr key={`${r.user_id}-detail`} className="bg-sky-50/30">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="rounded-xl border border-sky-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-800 text-white">
                              {['Date', 'Shift', 'Punch In', 'Punch Out', 'Duration', 'Status'].map(h => (
                                <th key={h} className="text-left px-3 py-2 font-black uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sky-50">
                            {r.records.map((rec, j) => (
                              <tr key={rec.id ?? j} className="hover:bg-white transition-colors">
                                <td className="px-3 py-2 font-medium text-zinc-700">{fmtDate(rec.punch_in_at)}</td>
                                <td className="px-3 py-2 font-semibold text-zinc-700">{rec.shift_name}</td>
                                <td className="px-3 py-2 text-emerald-700 font-semibold">{fmtTime(rec.punch_in_at)}</td>
                                <td className="px-3 py-2">
                                  {rec.punch_out_at
                                    ? <span className="text-rose-600 font-semibold">{fmtTime(rec.punch_out_at)}</span>
                                    : <span className="text-zinc-300 italic">Not punched out</span>}
                                </td>
                                <td className="px-3 py-2">
                                  {rec.work_duration
                                    ? <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">{rec.work_duration}</span>
                                    : <span className="text-zinc-300">—</span>}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rec.punch_out_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                                    {rec.punch_out_at ? 'Present' : 'Incomplete'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ShiftwiseWorkTable({ rows }) {
  if (!rows?.length) return <EmptyReport />

  const headers = ['#', 'Employee', 'Shift', 'Shift Hours', 'Date', 'Punch In', 'Punch Out', 'Duration', 'Status']

  const fmtTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 14

    doc.setFontSize(15).setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text('PROP:- DARSHAN SINGH  |  JAGANNATH AUTO NAGAR, ASKA ROAD, BERHAMPUR(GM)', pageWidth / 2, margin + 5, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, margin + 8, pageWidth - margin, margin + 8)

    doc.setFontSize(11).setFont('helvetica', 'bold')
    doc.text('SHIFTWISE WORK REPORT', pageWidth / 2, margin + 14, { align: 'center' })

    doc.setDrawColor(0, 0, 0)
    doc.line(margin, margin + 17, pageWidth - margin, margin + 17)

    doc.setFontSize(8).setFont('helvetica', 'normal')
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, margin, margin + 22)
    doc.text(`Total Records: ${rows.length}`, pageWidth - margin, margin + 22, { align: 'right' })

    const tableBody = rows.map((r, i) => {
      const punchIn = r.punch_in_at ? new Date(r.punch_in_at) : null
      const punchOut = r.punch_out_at ? new Date(r.punch_out_at) : null
      const dateStr = punchIn ? punchIn.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '—'
      const inStr = punchIn ? punchIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
      const outStr = punchOut ? punchOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
      const status = r.punch_out_at ? 'Present' : 'Incomplete'
      return [
        i + 1,
        r.user_name || '—',
        r.shift_name || '—',
        r.shift_start && r.shift_end ? `${r.shift_start} – ${r.shift_end}` : '—',
        dateStr,
        inStr,
        outStr,
        r.work_duration || '—',
        status
      ]
    })

    autoTable(doc, {
      startY: margin + 26,
      head: [['#', 'Employee', 'Shift', 'Shift Hours', 'Date', 'Punch In', 'Punch Out', 'Duration', 'Status']],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 20, halign: 'center' },
      },
      didDrawPage: (d) => {
        doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(150)
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
        doc.setTextColor(0)
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0)
    doc.text('BANK: STATE BANK OF INDIA(ASKA RAOD) IFSC: SBIN0007931 A/C NO.:-33169091606', margin, finalY)

    const signY = finalY + 15
    doc.setFont('helvetica', 'normal')
    doc.text('Prepared By', margin, signY + 5)
    doc.text('Checked By', pageWidth / 2, signY + 5, { align: 'center' })
    doc.text('Authorised Signatory', pageWidth - margin - 35, signY + 5)

    if (shouldDownload) doc.save(`shiftwise-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={() => exportPDF(false)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm"
        >
          <FiEye size={14} /> Show PDF
        </button>
        <button
          onClick={() => exportPDF(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <FiDownload size={14} /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 font-black uppercase tracking-wider whitespace-nowrap border-r border-zinc-800 last:border-none">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r, i) => {
              const punchIn = r.punch_in_at ? new Date(r.punch_in_at) : null
              const isComplete = !!r.punch_out_at
              return (
                <tr key={r.id ?? i} className="hover:bg-fuchsia-50/20 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 font-bold border-r border-zinc-50">{i + 1}</td>
                  <td className="px-4 py-3 border-r border-zinc-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                        {(r.user_name ?? 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-zinc-800">{r.user_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-700 border-r border-zinc-50">{r.shift_name || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap border-r border-zinc-50">
                    {r.shift_start && r.shift_end
                      ? <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">{r.shift_start} – {r.shift_end}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap border-r border-zinc-50">
                    {punchIn ? fmtDate(r.punch_in_at) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-zinc-50">
                    <span className="text-emerald-700 font-semibold">{fmtTime(r.punch_in_at)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-zinc-50">
                    {r.punch_out_at
                      ? <span className="text-rose-600 font-semibold">{fmtTime(r.punch_out_at)}</span>
                      : <span className="text-zinc-300 italic text-[10px]">Not punched out</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-zinc-50">
                    {r.work_duration && r.work_duration !== '—'
                      ? <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">{r.work_duration}</span>
                      : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isComplete ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {isComplete ? 'Present' : 'Incomplete'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GstReportTable({ rows }) {
  if (!rows?.length) return <EmptyReport />

  const headers = [
    'Invoice No', 'Date', 'Supplier Name', 'Supplier GST', 'Amount', 'GST', 'Total GST', 'Net'
  ]

  const getRowData = (r) => [
    <span key="inv" className="font-bold text-indigo-600">{r.invoice_number || '—'}</span>,
    r.purchase_at ? new Date(r.purchase_at).toLocaleDateString('en-IN') : '—',
    r.supplier_name || '—',
    <span key="gst" className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">{r.supplier_gst || '—'}</span>,
    `₹${Number(r.taxable_amount || 0).toLocaleString('en-IN')}`,
    <span key="gst_amt" className="text-emerald-600 font-semibold">₹{Number(r.gst_amount || 0).toLocaleString('en-IN')}</span>,
    <span key="total_gst" className="text-emerald-700 font-black">₹{Number(r.gst_amount || 0).toLocaleString('en-IN')}</span>,
    <span key="net" className="font-black text-zinc-900">₹{Number(r.total_amount || 0).toLocaleString('en-IN')}</span>,
  ]

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    // Header
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('GST REPORT (PURCHASES)', pageWidth / 2, margin + 7, { align: 'center' })
    doc.line(margin, margin + 12, pageWidth - margin, margin + 12)

    const tableBody = rows.map(r => [
      r.invoice_number || '—',
      r.purchase_at ? new Date(r.purchase_at).toLocaleDateString('en-IN') : '—',
      r.supplier_name || '—',
      r.supplier_gst || '—',
      Number(r.taxable_amount || 0).toFixed(2),
      Number(r.gst_amount || 0).toFixed(2),
      Number(r.gst_amount || 0).toFixed(2),
      Number(r.total_amount || 0).toFixed(2)
    ])

    const totals = {
      taxable: rows.reduce((a, b) => a + Number(b.taxable_amount || 0), 0),
      gst: rows.reduce((a, b) => a + Number(b.gst_amount || 0), 0),
      net: rows.reduce((a, b) => a + Number(b.total_amount || 0), 0)
    }

    tableBody.push([
      'TOTAL', '', '', '',
      totals.taxable.toFixed(2),
      totals.gst.toFixed(2),
      totals.gst.toFixed(2),
      totals.net.toFixed(2)
    ])

    autoTable(doc, {
      startY: margin + 18,
      head: [['Invoice No', 'Date', 'Supplier', 'GST No', 'Amount', 'GST', 'Total GST', 'Net']],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5 } },
      didDrawCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y)
        }
      }
    })

    if (shouldDownload) doc.save(`gst-report-${Date.now()}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-3">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm"><FiEye size={14} /> Show PDF</button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95"><FiDownload size={14} /> Download PDF</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map(h => <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                {getRowData(r).map((val, j) => <td key={j} className="px-6 py-4 font-medium text-zinc-700 whitespace-nowrap">{val}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 font-black border-t-2 border-zinc-200">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right text-zinc-500 uppercase text-[10px]">Grand Total</td>
              <td className="px-6 py-4 font-bold text-zinc-900">₹{rows.reduce((a, b) => a + Number(b.taxable_amount || 0), 0).toLocaleString('en-IN')}</td>
              <td className="px-6 py-4 font-bold text-emerald-600">₹{rows.reduce((a, b) => a + Number(b.gst_amount || 0), 0).toLocaleString('en-IN')}</td>
              <td className="px-6 py-4 font-black text-emerald-700">₹{rows.reduce((a, b) => a + Number(b.gst_amount || 0), 0).toLocaleString('en-IN')}</td>
              <td className="px-6 py-4 text-right text-zinc-900 text-lg">₹{rows.reduce((a, b) => a + Number(b.total_amount || 0), 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function InventoryReportTable({ rows }) {
  if (!rows?.length) return <EmptyReport />

  const headers = ['Product Name', 'HSN Code', 'Part Number', 'Current Stock', 'Low Stock?']

  const exportPDF = (shouldDownload = false) => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    // Header
    doc.setFontSize(14).setFont('helvetica', 'bold')
    doc.text('R.S.TRANSPORT', pageWidth / 2, margin, { align: 'center' })
    doc.setFontSize(10).setFont('helvetica', 'normal')
    doc.text('INVENTORY STOCK REPORT', pageWidth / 2, margin + 7, { align: 'center' })
    doc.line(margin, margin + 12, pageWidth - margin, margin + 12)

    const tableBody = rows.map(r => {
      const isLow = Number(r.stock ?? 0) <= Number(r.low_stock || 0)
      return [
        r.product_name || r.name || '—',
        r.hsn_code || r.hsn || '—',
        r.part_number || r.part_no || '—',
        `${Number(r.stock ?? r.quantity ?? 0).toLocaleString('en-IN')} ${r.unit || 'units'}`,
        isLow ? 'YES' : 'NO'
      ]
    })

    autoTable(doc, {
      startY: margin + 18,
      head: [headers],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5 } },
      columnStyles: { 4: { halign: 'center' } }
    })

    if (shouldDownload) doc.save(`inventory-report-${Date.now()}.pdf`)
    else window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex justify-end gap-2 px-3">
        <button onClick={() => exportPDF(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm"><FiEye size={14} /> Show PDF</button>
        <button onClick={() => exportPDF(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-semibold text-xs transition-all shadow-md active:scale-95"><FiDownload size={14} /> Download PDF</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {headers.map(h => <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r, i) => {
              const isLow = Number(r.stock ?? 0) <= Number(r.low_stock || 0)
              return (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{r.product_name || r.name || '—'}</td>
                  <td className="px-6 py-4 text-zinc-600 font-mono">{r.hsn_code || r.hsn || '—'}</td>
                  <td className="px-6 py-4 text-zinc-600">{r.part_number || r.part_no || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`font-black ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {Number(r.stock ?? r.quantity ?? 0).toLocaleString('en-IN')}
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">{r.unit || 'units'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${isLow ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {isLow ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailItem({ label, value, isBold }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm ${isBold ? 'font-black text-zinc-900' : 'font-semibold text-zinc-700'}`}>{value ?? '—'}</span>
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

  const [dateMode, setDateMode] = useState('monthly')
  const [monthVal, setMonthVal] = useState(thisMonthStr())
  const [dayVal, setDayVal] = useState(todayStr())
  const [yearVal, setYearVal] = useState(thisYearStr())
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())
  const [submitted, setSubmitted] = useState(false)

  // Additional filters for bills/challans
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedPlace, setSelectedPlace] = useState('')
  const [searchBillNo, setSearchBillNo] = useState('')
  const [viewBill, setViewBill] = useState(null)

  // Fetch vehicles and companies for challans report
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleAPI.listVehicles,
    enabled: reportType === 'bills' || reportType === 'vehicle-income' || reportType === 'vehicle-expenditure'
  })

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: companyAPI.listCompanies,
    enabled: reportType === 'challans' || reportType === 'bills'
  })

  const challansQuery = useQuery({
    queryKey: ['challans'],
    queryFn: challanAPI.listChallans,
    enabled: reportType === 'bills'
  })

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: tripAPI.listTrips,
    enabled: reportType === 'bills'
  })

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.listCustomers,
    enabled: reportType === 'bills' || reportType === 'trips' || reportType === 'vehicle-income'
  })

  const placesQuery = useQuery({
    queryKey: ['places'],
    queryFn: placeAPI.listPlaces,
    enabled: reportType === 'bills' || reportType === 'trips' || reportType === 'vehicle-income'
  })

  const filters = useMemo(
    () => buildFilters(dateMode, monthVal, dayVal, yearVal, customFrom, customTo, selectedVehicle, selectedCustomer, searchBillNo, selectedPlace),
    [dateMode, monthVal, dayVal, yearVal, customFrom, customTo, selectedVehicle, selectedCustomer, searchBillNo, selectedPlace]
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

            {/* Vehicle and Company filters for Bills/Vehicle Income/Vehicle Expenditure reports */}
            {(reportType === 'bills' || reportType === 'vehicle-income' || reportType === 'vehicle-expenditure') && (
              <>
                {reportType === 'bills' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bill No</label>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search Bill No..."
                        value={searchBillNo}
                        onChange={(e) => setSearchBillNo(e.target.value)}
                        className="pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-44"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vehicle</label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => { setSelectedVehicle(e.target.value); setSubmitted(false) }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    <option value="">All Vehicles</option>
                    {(vehiclesQuery.data?.items ?? []).map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.registration_number || vehicle.vehicle_name || `Vehicle ${vehicle.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {reportType === 'bills' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => { setSelectedCustomer(e.target.value); setSubmitted(false) }}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    >
                      <option value="">All Customers</option>
                      {(customersQuery.data?.items ?? []).map(cust => (
                        <option key={cust.id} value={cust.id}>
                          {cust.customer_name || `Customer ${cust.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Place and Customer filters for Trips report */}
            {reportType === 'trips' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Place</label>
                  <select
                    value={selectedPlace}
                    onChange={(e) => { setSelectedPlace(e.target.value); setSubmitted(false) }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    <option value="">All Places</option>
                    {(placesQuery.data?.items ?? []).map(place => (
                      <option key={place.id} value={place.id}>
                        {place.name || `Place ${place.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => { setSelectedCustomer(e.target.value); setSubmitted(false) }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    <option value="">All Customers</option>
                    {(customersQuery.data?.items ?? []).map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.customer_name || `Customer ${cust.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

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
          let rows = data?.data ?? data?.items ?? (Array.isArray(data) ? data : [])
          const challans = challansQuery.data?.items ?? []

          if (reportType === 'bills') {
            if (searchBillNo) {
              const q = searchBillNo.toLowerCase()
              rows = rows.filter(r => (r.bill_no ?? '').toLowerCase().includes(q))
            }
            if (selectedVehicle) {
              rows = rows.filter(r => {
                const bChallans = (r.challans || []).map(bc => challans.find(c => String(c.id) === String(bc.id))).filter(Boolean)
                return bChallans.some(c => String(c.vehicle_id) === String(selectedVehicle))
              })
            }
            if (selectedCustomer) {
              rows = rows.filter(r => String(r.customer_id) === String(selectedCustomer))
            }
          }

          if (reportType === 'trips') {
            if (selectedPlace) {
              rows = rows.filter(r =>
                String(r.source) === String(selectedPlace) || String(r.destination) === String(selectedPlace)
              )
            }
            if (selectedCustomer) {
              rows = rows.filter(r => String(r.customer_id) === String(selectedCustomer))
            }
          }

          const summary = data.summary ?? null
          return (
            <div className="space-y-6">
              {summary && reportType !== 'bills' && reportType !== 'trips' && reportType !== 'shiftwise-work' && reportType !== 'userwise' && <SummaryCards summary={summary} gradient={config.gradient} />}
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
                {reportType === 'attendance'
                  ? <AttendanceTable rows={rows} />
                  : reportType === 'ledger'
                    ? <LedgerReportTable rows={rows} />
                    : reportType === 'products'
                      ? <InventoryReportTable rows={rows} />
                      : reportType === 'bills'
                        ? <BillsTable
                          rows={rows}
                          onViewDetails={(b) => setViewBill(b)}
                          challans={challansQuery.data?.items ?? []}
                          customers={customersQuery.data?.items ?? []}
                          companies={companiesQuery.data?.items ?? []}
                          trips={tripsQuery.data?.items ?? []}
                          places={placesQuery.data?.items ?? []}
                        />
                        : reportType === 'trips'
                          ? <TripsTable
                            rows={rows}
                            customers={customersQuery.data?.items ?? []}
                            places={placesQuery.data?.items ?? []}
                          />
                          : reportType === 'vehicle-income'
                            ? <VehicleIncomeTable
                              rows={rows}
                              customers={customersQuery.data?.items ?? []}
                              places={placesQuery.data?.items ?? []}
                              vehicles={vehiclesQuery.data?.items ?? []}
                            />
                            : reportType === 'vehicle-expenditure'
                              ? <VehicleExpenditureTable rows={rows} summary={data.summary} categorized_totals={data.categorized_totals} timeline={data.timeline} />
                              : reportType === 'gst'
                                ? <GstReportTable rows={rows} />
                                : reportType === 'shiftwise-work'
                                  ? <ShiftwiseWorkTable rows={data?.data ?? rows} />
                                  : reportType === 'userwise'
                                    ? <UserwiseReportTable rows={data?.data ?? rows} />
                                    : <GenericTable rows={rows} />
                }</div>
            </div>
          )
        })()}
        {!submitted && !isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FiBarChart2 size={56} className="text-zinc-200" />
            <p className="font-semibold text-zinc-400 text-sm">Select a period and click Generate</p>
          </div>
        )}

        <BillDetailsModal
          bill={viewBill}
          onClose={() => setViewBill(null)}
          challans={challansQuery.data?.items ?? []}
          trips={tripsQuery.data?.items ?? []}
          customers={customersQuery.data?.items ?? []}
          places={placesQuery.data?.items ?? []}
          companies={companiesQuery.data?.items ?? []}
        />

      </div>
    </div>
  )
}
