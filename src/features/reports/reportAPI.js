import { api } from '../../services/axios.js'

function extractError(err, fallback) {
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback
}

async function fetchReport(type, filters) {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/reports/${type}?${params.toString()}`)
    return data
  } catch (err) {
    throw new Error(extractError(err, `Failed to load ${type} report`))
  }
}

// Builds two maps from bills + challans:
//   billIdToNo : bill UUID  → bill_no string  (e.g. "abc-123" → "BILL-001")
//   tripBillNo : trip_id    → bill_no string
async function buildBillLookups() {
  try {
    const [billsRes, challansRes] = await Promise.all([
      api.get('/bills'),
      api.get('/challans'),
    ])
    const bills    = billsRes.data?.data    ?? billsRes.data?.items    ?? (Array.isArray(billsRes.data)    ? billsRes.data    : [])
    const challans = challansRes.data?.data ?? challansRes.data?.items ?? (Array.isArray(challansRes.data) ? challansRes.data : [])

    // bill UUID → bill_no
    const billIdToNo = new Map()
    bills.forEach((b) => {
      const id = b.id ?? b._id ?? b.bill_id
      if (id && b.bill_no) billIdToNo.set(String(id), String(b.bill_no))
    })

    // challan_id → trip_id
    const challanTrip = new Map()
    challans.forEach((c) => { if (c.trip_id) challanTrip.set(String(c.id), String(c.trip_id)) })

    // trip_id → bill_no
    const tripBillNo = new Map()
    bills.forEach((b) => {
      if (!b.challan_id || !b.bill_no) return
      const tripId = challanTrip.get(String(b.challan_id))
      if (tripId) tripBillNo.set(tripId, String(b.bill_no))
    })

    return { billIdToNo, tripBillNo }
  } catch {
    return { billIdToNo: new Map(), tripBillNo: new Map() }
  }
}

// Builds entity id → name maps for customers, users, companies
async function buildEntityMaps() {
  try {
    const [custRes, userRes, compRes, driverRes] = await Promise.all([
      api.get('/customers').catch(() => ({ data: [] })),
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/companies').catch(() => ({ data: [] })),
      api.get('/drivers').catch(() => ({ data: [] })),
    ])
    const toArr = (res) => res.data?.data ?? res.data?.items ?? (Array.isArray(res.data) ? res.data : [])
    const customers = toArr(custRes)
    const users     = toArr(userRes)
    const companies = toArr(compRes)
    const drivers   = toArr(driverRes)

    const maps = { customer: new Map(), user: new Map(), company: new Map(), driver: new Map() }
    customers.forEach((c) => maps.customer.set(String(c.id), c.customer_name || c.name || c.id))
    companies.forEach((c) => maps.company.set(String(c.id), c.name || c.id))
    // users covers all roles (admin, accountant, etc.)
    users.forEach((u) => {
      const name = u.name || u.email || u.id
      maps.user.set(String(u.id), name)
      // also index under driver map in case payer_type is 'driver' but id is in users
      maps.driver.set(String(u.id), name)
    })
    // drivers may be a separate table
    drivers.forEach((d) => {
      const name = d.name || d.driver_name || d.id
      maps.driver.set(String(d.id), name)
      // also index under user map as fallback
      maps.user.set(String(d.id), name)
    })
    return maps
  } catch {
    return { customer: new Map(), user: new Map(), company: new Map(), driver: new Map() }
  }
}

export const fetchAttendanceReport      = (filters) => fetchReport('attendance', filters)
export const fetchSalaryReport          = (filters) => fetchReport('salary', filters)
export const fetchProductsReport        = (filters) => fetchReport('product/stock', filters)
export const fetchPurchaseReport        = (filters) => fetchReport('purchase', filters)
export const fetchProductTransferReport = (filters) => fetchReport('product/transfers', filters)
export const fetchTripsReport           = async (filters) => {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    
    // Use the trips endpoint directly for filtering
    const { data } = await api.get(`/trips?${params.toString()}`)
    return data
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load trips report'))
  }
}
export const fetchBillsReport          = async (filters) => {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    
    // Use the bills endpoint directly for filtering, not reports/bills
    const { data } = await api.get(`/bills?${params.toString()}`)
    return data
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load bills report'))
  }
}

// Ledger report — enriches each row's bill_no:
// The report API returns transaction_id but no trip_id/bill_id.
// We fetch the full ledger list to build transaction_id → trip_id,
// then resolve trip_id → bill_no via bills+challans.
export async function fetchLedgerReport(filters) {
  const [reportData, ledgerRes, { billIdToNo, tripBillNo }, entityMaps] = await Promise.all([
    fetchReport('ledger', filters),
    api.get('/ledger').catch(() => ({ data: [] })),
    buildBillLookups(),
    buildEntityMaps(),
  ])

  // transaction_id → trip_id from full ledger list
  const ledgerRows = ledgerRes.data?.data ?? ledgerRes.data?.items ?? (Array.isArray(ledgerRes.data) ? ledgerRes.data : [])
  const txnTripMap = new Map()
  // also build transaction_id → {payer_id, payee_id} for name resolution
  const txnEntityMap = new Map()
  ledgerRows.forEach((r) => {
    const txnId = r.transaction_id ?? r.id ?? r._id ?? r.ledger_id
    if (!txnId) return
    if (r.trip_id) txnTripMap.set(String(txnId), String(r.trip_id))
    txnEntityMap.set(String(txnId), {
      payer_type: r.payer_type, payer_id: r.payer_id,
      payee_type: r.payee_type, payee_id: r.payee_id,
    })
  })

  const resolveName = (type, id) => {
    if (!id) return null
    // try exact type map first
    if (type && entityMaps[type]) {
      const name = entityMaps[type].get(String(id))
      if (name) return name
    }
    // fallback: search all maps
    for (const map of Object.values(entityMaps)) {
      const name = map.get(String(id))
      if (name) return name
    }
    return null
  }

  const rows = reportData?.data ?? reportData?.items ?? []

  const enriched = rows.map((r) => {
    let enriched = { ...r }

    // resolve bill_no
    if (!enriched.bill_no) {
      if (r.bill_id) {
        enriched.bill_no = billIdToNo.get(String(r.bill_id)) ?? null
      }
      if (!enriched.bill_no && r.trip_id) {
        enriched.bill_no = tripBillNo.get(String(r.trip_id)) ?? null
      }
      if (!enriched.bill_no) {
        const txnId = r.transaction_id ?? r.id
        if (txnId) {
          const tripId = txnTripMap.get(String(txnId))
          if (tripId) enriched.bill_no = tripBillNo.get(tripId) ?? null
        }
      }
    }

    // resolve payer/payee names
    const txnId = r.transaction_id ?? r.id
    const entityInfo = txnId ? txnEntityMap.get(String(txnId)) : null
    const payerType = entityInfo?.payer_type ?? r.payer_type
    const payerId   = entityInfo?.payer_id   ?? r.payer_id
    const payeeType = entityInfo?.payee_type ?? r.payee_type
    const payeeId   = entityInfo?.payee_id   ?? r.payee_id

    enriched.payer_name = resolveName(payerType, payerId) ?? payerType ?? '—'
    enriched.payee_name = resolveName(payeeType, payeeId) ?? payeeType ?? '—'

    return enriched
  })

  if (reportData?.data)  return { ...reportData, data: enriched }
  if (reportData?.items) return { ...reportData, items: enriched }
  return enriched
}


export async function fetchProfitLoss(filters = {}) {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/reports/profit-loss?${params.toString()}`)
    return data
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load profit-loss report'))
  }
}

export async function fetchVehicleIncomeReport(filters) {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { 
      // If filtering by vehicle, we'll handle it carefully
      if (k !== 'vehicle_id' && v) params.set(k, v) 
    })
    
    // Fetch everything needed for joining
    const [tripsRes, ledgerRes, assignmentsRes, vehiclesRes] = await Promise.all([
      api.get(`/trips?${params.toString()}`),
      api.get(`/ledger?${params.toString()}`),
      api.get('/assignments'),
      api.get('/vehicles')
    ])

    const allTrips = tripsRes.data?.data ?? tripsRes.data?.items ?? (Array.isArray(tripsRes.data) ? tripsRes.data : [])
    const allLedger = ledgerRes.data?.data ?? ledgerRes.data?.items ?? (Array.isArray(ledgerRes.data) ? ledgerRes.data : [])
    const assignments = assignmentsRes.data?.data ?? assignmentsRes.data?.items ?? (Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [])
    const vehicles = vehiclesRes.data?.items ?? vehiclesRes.data?.data ?? (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [])

    // Map vehicle_assign_id -> vehicle object
    const assignMap = new Map()
    assignments.forEach(a => {
      const v = vehicles.find(veh => String(veh.id) === String(a.vehicle_id))
      if (v) assignMap.set(String(a.id), v)
    })

    // Filter trips by vehicle if needed
    let trips = allTrips
    if (filters.vehicle_id) {
      trips = allTrips.filter(t => {
        const vehicle = assignMap.get(String(t.vehicle_assign_id))
        return vehicle && String(vehicle.id) === String(filters.vehicle_id)
      })
    }

    // Filter ledger by vehicle if needed
    let ledger = allLedger
    if (filters.vehicle_id) {
      ledger = allLedger.filter(l => String(l.vehicle_id) === String(filters.vehicle_id))
    }

    // Aggregate expenses by trip_id
    const tripExpenses = new Map()
    allLedger.forEach(entry => {
      if (entry.trip_id) {
        const tid = String(entry.trip_id)
        const amount = Number(entry.amount || 0)
        tripExpenses.set(tid, (tripExpenses.get(tid) || 0) + amount)
      }
    })

    // Enrich trips with expense and vehicle data
    const enrichedTrips = trips.map(trip => {
      const expenses = tripExpenses.get(String(trip.id)) || 0
      const revenue = Number(trip.amount || 0)
      const vehicle = assignMap.get(String(trip.vehicle_assign_id))
      return {
        ...trip,
        revenue,
        expenses,
        profit: revenue - expenses,
        vehicle_number: vehicle?.registration_number || trip.vehicle_number || '—'
      }
    })

    const total_revenue = enrichedTrips.reduce((a, b) => a + b.revenue, 0)
    const total_expenses = enrichedTrips.reduce((a, b) => a + b.expenses, 0)

    return { 
      data: enrichedTrips,
      summary: {
        total_trips: enrichedTrips.length,
        total_revenue,
        total_expenses,
        net_profit: total_revenue - total_expenses
      }
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load vehicle income report'))
  }
}
export async function fetchVehicleExpenditureReport(filters) {
  try {
    const vehicleId = String(filters.vehicle_id)
    if (!vehicleId || vehicleId === 'undefined') {
      return { data: [], summary: { total_expenditure: 0, spare_parts_cost: 0, general_expenses: 0, vehicle: '—' } }
    }

    // Fetch everything without filters to match how the main tables work
    const [ledgerRes, transfersRes, productsRes, vehiclesRes] = await Promise.all([
      api.get('/ledger'),
      api.get('/product-transfers'),
      api.get('/products'),
      api.get('/vehicles')
    ])

    const allLedger = ledgerRes.data?.data ?? ledgerRes.data?.items ?? (Array.isArray(ledgerRes.data) ? ledgerRes.data : [])
    const allTransfers = transfersRes.data?.data ?? transfersRes.data?.items ?? (Array.isArray(transfersRes.data) ? transfersRes.data : [])
    const products = productsRes.data?.items ?? (Array.isArray(productsRes.data) ? productsRes.data : [])
    const vehicles = vehiclesRes.data?.items ?? (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [])

    const vehicle = vehicles.find(v => String(v.id) === vehicleId)

    // Helper for date matching (matches the logic in Ledger.jsx/Trips.jsx)
    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true

      if (filters.start_date && filters.end_date) {
        const start = new Date(filters.start_date); start.setHours(0,0,0,0)
        const end = new Date(filters.end_date); end.setHours(23,59,59,999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0,0,0,0)
        const day = new Date(d); day.setHours(0,0,0,0)
        return target.getTime() === day.getTime()
      }
      if (filters.month && filters.year) {
        return (d.getMonth() + 1) === Number(filters.month) && d.getFullYear() === Number(filters.year)
      }
      if (filters.year && !filters.month) {
        return d.getFullYear() === Number(filters.year)
      }
      return true
    }

    // 1. Filter Ledger Expenses (General)
    const generalExpenses = allLedger
      .filter(l => String(l.vehicle_id) === vehicleId && matchDate(l.date || l.createdAt || l.transaction_date))
      .map(l => ({
        id: l.id,
        date: l.date || l.createdAt || l.transaction_date,
        category: 'General / Maintenance',
        description: l.purpose_name || l.remarks || 'General Expense',
        amount: Number(l.amount || 0),
        vehicle_number: vehicle?.registration_number || '—'
      }))

    // 2. Filter Product Transfers (Parts)
    const productMap = new Map()
    products.forEach(p => productMap.set(String(p.id), p))

    const partExpenses = allTransfers
      .filter(t => String(t.given_to_vehicle) === vehicleId && matchDate(t.date || t.createdAt))
      .map(t => {
        const product = productMap.get(String(t.product_id))
        const price = Number(product?.price || t.price || 0)
        const qty = Number(t.quantity || 0)
        return {
          id: t.id,
          date: t.date || t.createdAt,
          category: 'Spare Parts',
          description: `${product?.product_name || 'Part'} (${qty} ${t.unit || 'units'})`,
          amount: price * qty,
          vehicle_number: t.given_to_vehicle_name || vehicle?.registration_number || '—'
        }
      })

    const combined = [...generalExpenses, ...partExpenses].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

    const total_parts = partExpenses.reduce((a, b) => a + b.amount, 0)
    const total_general = generalExpenses.reduce((a, b) => a + b.amount, 0)

    return {
      data: combined,
      summary: {
        total_expenditure: total_parts + total_general,
        spare_parts_cost: total_parts,
        general_expenses: total_general,
        vehicle: vehicle?.registration_number || '—'
      }
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load vehicle expenditure report'))
  }
}
