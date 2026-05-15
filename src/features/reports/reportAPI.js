import { api } from '../../services/axios.js'
import * as productAPI from '../products/productAPI.js'

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
    const bills = billsRes.data?.data ?? billsRes.data?.items ?? (Array.isArray(billsRes.data) ? billsRes.data : [])
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
    const users = toArr(userRes)
    const companies = toArr(compRes)
    const drivers = toArr(driverRes)

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

export const fetchAttendanceReport = (filters) => fetchReport('attendance', filters)
export const fetchSalaryReport = (filters) => fetchReport('salary', filters)
export const fetchProductsReport = async (filters) => {
  try {
    return await productAPI.listProducts()
  } catch (err) {
    throw new Error(err.message || 'Failed to load products report')
  }
}
export const fetchPurchaseReport = (filters) => fetchReport('purchase', filters)
export const fetchProductTransferReport = (filters) => fetchReport('product/transfers', filters)
export const fetchTripsReport = async (filters) => {
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
export const fetchBillsReport = async (filters) => {
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
    const payerId = entityInfo?.payer_id ?? r.payer_id
    const payeeType = entityInfo?.payee_type ?? r.payee_type
    const payeeId = entityInfo?.payee_id ?? r.payee_id

    enriched.payer_name = resolveName(payerType, payerId) ?? payerType ?? '—'
    enriched.payee_name = resolveName(payeeType, payeeId) ?? payeeType ?? '—'

    return enriched
  })

  if (reportData?.data) return { ...reportData, data: enriched }
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
    const vehicleId = filters.vehicle_id && filters.vehicle_id !== 'undefined' ? String(filters.vehicle_id) : null

    const [ledgerRes, transfersRes, productsRes, vehiclesRes, purposesRes, purchasesRes] = await Promise.all([
      api.get('/ledger'),
      api.get('/product-transfers'),
      api.get('/products'),
      api.get('/vehicles'),
      api.get('/transaction-purposes'),
      api.get('/purchase-details').catch(() => ({ data: [] })),
    ])

    const allLedger = ledgerRes.data?.data ?? ledgerRes.data?.items ?? (Array.isArray(ledgerRes.data) ? ledgerRes.data : [])
    const allTransfers = transfersRes.data?.data ?? transfersRes.data?.items ?? (Array.isArray(transfersRes.data) ? transfersRes.data : [])
    const products = productsRes.data?.items ?? (Array.isArray(productsRes.data) ? productsRes.data : [])
    const vehicles = vehiclesRes.data?.items ?? (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [])
    const purposes = purposesRes.data?.items ?? (Array.isArray(purposesRes.data) ? purposesRes.data : [])
    const purchases = purchasesRes.data?.items ?? purchasesRes.data?.data ?? (Array.isArray(purchasesRes.data) ? purchasesRes.data : [])

    const vehicleMap = new Map(vehicles.map(v => [String(v.id), v]))
    const purposeMap = new Map(purposes.map(p => [String(p.id), p.transaction_purpose_name]))
    const productMap = new Map(products.map(p => [String(p.id), p]))

    // Build product_id → latest unit_price from purchase records
    // Sort by purchase date descending so the most recent price wins
    const productPriceMap = new Map()
    purchases
      .slice()
      .sort((a, b) => new Date(b.purchase_at || b.created_at || 0) - new Date(a.purchase_at || a.created_at || 0))
      .forEach(p => {
        const pid = String(p.product_id)
        if (!productPriceMap.has(pid)) {
          const price = Number(p.unit_price || p.purchase_price || 0)
          if (price > 0) productPriceMap.set(pid, price)
        }
      })

    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true

      if (filters.from && filters.to) {
        const start = new Date(filters.from); start.setHours(0, 0, 0, 0)
        const end = new Date(filters.to); end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0, 0, 0, 0)
        const day = new Date(d); day.setHours(0, 0, 0, 0)
        return target.getTime() === day.getTime()
      }
      if (filters.month) {
        const [yr, mo] = filters.month.split('-').map(Number)
        return d.getFullYear() === yr && (d.getMonth() + 1) === mo
      }
      if (filters.year) return d.getFullYear() === Number(filters.year)
      return true
    }

    const categorize = (purposeName) => {
      const p = (purposeName || '').toLowerCase()
      if (p.includes('fuel') || p.includes('diesel') || p.includes('petrol')) return 'Fuel'
      if (p.includes('maintenance') || p.includes('service') || p.includes('repair') || p.includes('labour')) return 'Maintenance'
      if (p.includes('driver') || p.includes('helper') || p.includes('salary') || p.includes('wages') || p.includes('bhatta')) return 'Staff'
      if (p.includes('toll') || p.includes('parking') || p.includes('rto') || p.includes('challan')) return 'Toll/Parking'
      return 'Other'
    }

    // 1. Process Ledger Expenses
    const ledgerExpenses = allLedger
      .filter(l => {
        const vehicleMatch = !vehicleId || String(l.vehicle_id) === vehicleId
        const dateField = l.date || l.created_at || l.createdAt
        return vehicleMatch && matchDate(dateField)
      })
      .map(l => {
        // transaction_purpose may be stored as an ID or as transaction_purpose_id
        const purposeId = l.transaction_purpose || l.transaction_purpose_id
        const purpose = (purposeId ? purposeMap.get(String(purposeId)) : null)
          || l.transaction_purpose_name
          || l.purpose_name
          || ''
        const reason = l.remarks || purpose || 'General Expense'
        const dateField = l.date || l.created_at || l.createdAt
        const vehicleNumber = (l.vehicle_id
          ? vehicleMap.get(String(l.vehicle_id))?.registration_number
          : null)
          || l.vehicle_number
          || l.vehicle_registration_number
          || (l.vehicle_id ? l.vehicle_id : null)
          || '—'
        return {
          id: l.id,
          date: dateField,
          vehicle_number: vehicleNumber,
          type: 'Expense',
          category: categorize(purpose || reason),
          description: purpose || reason,
          part_name: '—',
          quantity: '—',
          amount: Number(l.amount || 0),
          source: 'Ledger'
        }
      })

    // 2. Process Product Transfers (Parts)
    const partsExpenses = allTransfers
      .filter(t => {
        const vehicleMatch = !vehicleId || String(t.given_to_vehicle) === vehicleId
        const dateField = t.date || t.created_at || t.createdAt
        return vehicleMatch && matchDate(dateField)
      })
      .map(t => {
        const product = productMap.get(String(t.product_id))
        const pName = product?.product_name || t.product_name || 'Part'
        const desc = t.remarks || product?.description || `Consumption of ${pName}`
        // Look up unit price from purchase records first, then fall back to transfer fields
        const price = productPriceMap.get(String(t.product_id))
          || Number(t.unit_price || t.price || 0)
        const qty = Number(t.quantity || 0)
        const v = vehicleMap.get(String(t.given_to_vehicle))
        const dateField = t.date || t.created_at || t.createdAt
        return {
          id: t.id,
          date: dateField,
          vehicle_number: v?.registration_number || t.given_to_vehicle_name || '—',
          type: 'Inventory',
          category: 'Spare Parts',
          description: desc,
          part_name: pName,
          quantity: `${qty} ${t.unit || product?.unit || 'units'}`,
          amount: price * qty,
          source: 'Product Transfer'
        }
      })

    const timeline = [...ledgerExpenses, ...partsExpenses].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

    const totals = {
      total_parts_cost: partsExpenses.reduce((a, b) => a + b.amount, 0),
      total_fuel_cost: ledgerExpenses.filter(e => e.category === 'Fuel').reduce((a, b) => a + b.amount, 0),
      total_maintenance_cost: ledgerExpenses.filter(e => e.category === 'Maintenance').reduce((a, b) => a + b.amount, 0),
      total_staff_cost: ledgerExpenses.filter(e => e.category === 'Staff').reduce((a, b) => a + b.amount, 0),
      total_toll_cost: ledgerExpenses.filter(e => e.category === 'Toll/Parking').reduce((a, b) => a + b.amount, 0),
      total_other_cost: ledgerExpenses.filter(e => e.category === 'Other').reduce((a, b) => a + b.amount, 0),
    }

    const total_expenditure = Object.values(totals).reduce((a, b) => a + b, 0)
    const categorized_totals = [
      { label: 'Spare Parts', value: totals.total_parts_cost },
      { label: 'Fuel', value: totals.total_fuel_cost },
      { label: 'Maintenance', value: totals.total_maintenance_cost },
      { label: 'Staff Expenses', value: totals.total_staff_cost },
      { label: 'Toll/Parking', value: totals.total_toll_cost },
      { label: 'Other', value: totals.total_other_cost },
    ].filter(t => t.value > 0)

    const targetVehicle = vehicleId ? vehicleMap.get(vehicleId) : null

    return {
      summary: { total_expenditure, ...totals },
      parts_expenses: partsExpenses,
      ledger_expenses: ledgerExpenses,
      categorized_totals,
      timeline,
      vehicle: targetVehicle?.registration_number || 'All Vehicles'
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load vehicle expenditure report'))
  }
}
export async function fetchGstReport(filters) {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })

    const [purchaseRes, suppliersRes] = await Promise.all([
      api.get(`/purchase-details?${params.toString()}`),
      api.get('/suppliers')
    ])

    const purchases = purchaseRes.data?.items ?? purchaseRes.data?.data ?? (Array.isArray(purchaseRes.data) ? purchaseRes.data : [])
    const suppliers = suppliersRes.data?.items ?? suppliersRes.data?.data ?? (Array.isArray(suppliersRes.data) ? suppliersRes.data : [])

    const supplierMap = new Map()
    suppliers.forEach(s => {
      const id = s.id || s._id || s.supplier_id
      if (id) supplierMap.set(String(id), s)
    })

    // Helper for date matching if backend didn't filter correctly
    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true

      if (filters.from && filters.to) {
        const start = new Date(filters.from); start.setHours(0, 0, 0, 0)
        const end = new Date(filters.to); end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0, 0, 0, 0)
        const day = new Date(d); day.setHours(0, 0, 0, 0)
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

    const filtered = purchases.filter(p => matchDate(p.purchase_at || p.created_at))

    const enriched = filtered.map(p => {
      const supplier = supplierMap.get(String(p.supplier_id))
      return {
        ...p,
        supplier_name: supplier?.name || supplier?.supplier_name || p.supplier_name || '—',
        supplier_gst: supplier?.supplier_gst_number || '—',
        taxable_amount: Number(p.purchase_price || 0),
        gst_amount: Number(p.gst_amount || 0),
        total_amount: Number(p.total_price || 0)
      }
    })

    const total_taxable = enriched.reduce((a, b) => a + b.taxable_amount, 0)
    const total_gst = enriched.reduce((a, b) => a + b.gst_amount, 0)
    const total_net = enriched.reduce((a, b) => a + b.total_amount, 0)

    return {
      data: enriched,
      summary: {
        total_invoices: enriched.length,
        total_taxable,
        total_gst,
        total_net
      }
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load GST report'))
  }
}

export async function fetchExpenseReport(filters) {
  try {
    const [ledgerRes, purposesRes, usersRes, customersRes, companiesRes, vehiclesRes] = await Promise.all([
      api.get('/ledger?type=expense'),
      api.get('/transaction-purposes'),
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/customers').catch(() => ({ data: [] })),
      api.get('/companies').catch(() => ({ data: [] })),
      api.get('/vehicles').catch(() => ({ data: [] })),
    ])

    const toArr = (res) => res.data?.items ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
    const expenses = toArr(ledgerRes)
    const purposes = toArr(purposesRes)
    const users = toArr(usersRes)
    const customers = toArr(customersRes)
    const companies = toArr(companiesRes)
    const vehicles = toArr(vehiclesRes)

    const purposeMap = new Map(purposes.map(p => [String(p.id), p.transaction_purpose_name]))
    const userMap = new Map(users.map(u => [String(u.id), u.name || u.email || u.id]))
    const customerMap = new Map(customers.map(c => [String(c.id), c.customer_name || c.name || c.id]))
    const companyMap = new Map(companies.map(c => [String(c.id), c.name || c.id]))
    const vehicleMap = new Map(vehicles.map(v => [String(v.id), v.registration_number || v.id]))

    const resolveName = (type, id) => {
      if (!id) return null
      if (type === 'user') return userMap.get(String(id)) || null
      if (type === 'customer') return customerMap.get(String(id)) || null
      if (type === 'company') return companyMap.get(String(id)) || null
      for (const m of [userMap, customerMap, companyMap]) {
        const n = m.get(String(id)); if (n) return n
      }
      return null
    }

    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true
      if (filters.from && filters.to) {
        const start = new Date(filters.from); start.setHours(0, 0, 0, 0)
        const end = new Date(filters.to); end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0, 0, 0, 0)
        const day = new Date(d); day.setHours(0, 0, 0, 0)
        return target.getTime() === day.getTime()
      }
      if (filters.month) {
        const [yr, mo] = filters.month.split('-').map(Number)
        return d.getFullYear() === yr && (d.getMonth() + 1) === mo
      }
      if (filters.year) return d.getFullYear() === Number(filters.year)
      return true
    }

    const filtered = expenses.filter(e => matchDate(e.created_at || e.date))

    const enriched = filtered.map(e => ({
      ...e,
      purpose_name: purposeMap.get(String(e.transaction_purpose || e.transaction_purpose_id)) || e.expense_head || '—',
      payer_name: resolveName(e.payer_type, e.payer_id) || e.payer_type || '—',
      vehicle_number: e.vehicle_id ? vehicleMap.get(String(e.vehicle_id)) || e.vehicle_id : null,
    }))

    const total = enriched.reduce((a, b) => a + (Number(b.amount) || 0), 0)

    return {
      data: enriched,
      purposes,
      summary: { total_expenses: enriched.length, total_amount: total }
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load expense report'))
  }
}

export async function fetchUserwiseReport(filters) {
  try {
    const [attendanceRes, shiftsRes, usersRes] = await Promise.all([
      api.get('/attendance'),
      api.get('/shifts'),
      api.get('/users')
    ])

    const attendance = attendanceRes.data?.items ?? attendanceRes.data?.data ?? (Array.isArray(attendanceRes.data) ? attendanceRes.data : [])
    const shifts = shiftsRes.data?.items ?? shiftsRes.data?.data ?? (Array.isArray(shiftsRes.data) ? shiftsRes.data : [])
    const users = usersRes.data?.items ?? usersRes.data?.data ?? (Array.isArray(usersRes.data) ? usersRes.data : [])

    const shiftMap = new Map()
    shifts.forEach(s => {
      const id = s.id || s._id || s.shift_id
      if (id) shiftMap.set(String(id), s)
    })

    const userMap = new Map()
    users.forEach(u => {
      const id = u.id || u._id || u.user_id
      if (id) userMap.set(String(id), u)
    })

    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true
      if (filters.from && filters.to) {
        const start = new Date(filters.from); start.setHours(0, 0, 0, 0)
        const end = new Date(filters.to); end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0, 0, 0, 0)
        const day = new Date(d); day.setHours(0, 0, 0, 0)
        return target.getTime() === day.getTime()
      }
      if (filters.month) {
        const [yr, mo] = filters.month.split('-').map(Number)
        return d.getFullYear() === yr && (d.getMonth() + 1) === mo
      }
      if (filters.year) return d.getFullYear() === Number(filters.year)
      return true
    }

    const filtered = attendance.filter(a => matchDate(a.punch_in_at || a.created_at))

    // Group by user
    const userGroups = new Map()
    filtered.forEach(a => {
      const userId = String(a.user_id)
      const user = userMap.get(userId)
      const userName = user?.name || user?.email || userId

      if (!userGroups.has(userId)) {
        userGroups.set(userId, {
          user_id: userId,
          user_name: userName,
          records: []
        })
      }

      const shift = shiftMap.get(String(a.shift_id))
      let duration = null
      let durationMs = 0
      if (a.punch_in_at && a.punch_out_at) {
        const inTime = new Date(a.punch_in_at)
        const outTime = new Date(a.punch_out_at)
        durationMs = outTime - inTime
        const h = Math.floor(durationMs / (1000 * 60 * 60))
        const m = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        duration = `${h}h ${m}m`
      }

      userGroups.get(userId).records.push({
        ...a,
        shift_name: shift?.shift_name || '—',
        shift_start: shift?.start_time || '—',
        shift_end: shift?.end_time || '—',
        work_duration: duration,
        duration_ms: durationMs
      })
    })

    // Summarise per user
    const rows = Array.from(userGroups.values()).map(g => {
      const totalMs = g.records.reduce((a, r) => a + (r.duration_ms || 0), 0)
      const totalH = Math.floor(totalMs / (1000 * 60 * 60))
      const totalM = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
      const present = g.records.filter(r => r.punch_out_at).length
      const incomplete = g.records.length - present
      const shifts = [...new Set(g.records.map(r => r.shift_name).filter(s => s !== '—'))]
      return {
        user_id: g.user_id,
        user_name: g.user_name,
        total_days: g.records.length,
        days_present: present,
        incomplete_days: incomplete,
        total_hours: totalMs > 0 ? `${totalH}h ${totalM}m` : '—',
        shifts: shifts.join(', ') || '—',
        records: g.records
      }
    })

    return { data: rows }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load userwise report'))
  }
}

export async function fetchShiftwiseWorkReport(filters) {
  try {
    const [attendanceRes, shiftsRes, usersRes] = await Promise.all([
      api.get('/attendance'),
      api.get('/shifts'),
      api.get('/users')
    ])

    const attendance = attendanceRes.data?.items ?? attendanceRes.data?.data ?? (Array.isArray(attendanceRes.data) ? attendanceRes.data : [])
    const shifts = shiftsRes.data?.items ?? shiftsRes.data?.data ?? (Array.isArray(shiftsRes.data) ? shiftsRes.data : [])
    const users = usersRes.data?.items ?? usersRes.data?.data ?? (Array.isArray(usersRes.data) ? usersRes.data : [])

    // Create maps for quick lookup
    const shiftMap = new Map()
    shifts.forEach(s => {
      const id = s.id || s._id || s.shift_id
      if (id) shiftMap.set(String(id), s)
    })

    const userMap = new Map()
    users.forEach(u => {
      const id = u.id || u._id || u.user_id
      if (id) userMap.set(String(id), u)
    })

    // Helper for date matching
    const matchDate = (rawDate) => {
      if (!rawDate) return true
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return true

      if (filters.from && filters.to) {
        const start = new Date(filters.from); start.setHours(0, 0, 0, 0)
        const end = new Date(filters.to); end.setHours(23, 59, 59, 999)
        return d >= start && d <= end
      }
      if (filters.date) {
        const target = new Date(filters.date); target.setHours(0, 0, 0, 0)
        const day = new Date(d); day.setHours(0, 0, 0, 0)
        return target.getTime() === day.getTime()
      }
      if (filters.month) {
        const [yr, mo] = filters.month.split('-').map(Number)
        return d.getFullYear() === yr && (d.getMonth() + 1) === mo
      }
      if (filters.year) return d.getFullYear() === Number(filters.year)
      return true
    }

    // Filter attendance by date
    const filteredAttendance = attendance.filter(a => matchDate(a.punch_in_at || a.created_at))

    // Enrich attendance with shift and user details
    const enriched = filteredAttendance.map(a => {
      const shift = shiftMap.get(String(a.shift_id))
      const user = userMap.get(String(a.user_id))
      
      // Calculate work duration
      let duration = '—'
      if (a.punch_in_at && a.punch_out_at) {
        const inTime = new Date(a.punch_in_at)
        const outTime = new Date(a.punch_out_at)
        const diffMs = outTime - inTime
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        duration = `${diffHours}h ${diffMins}m`
      }

      return {
        ...a,
        user_name: user?.name || user?.email || '—',
        shift_name: shift?.shift_name || '—',
        shift_start: shift?.start_time || '—',
        shift_end: shift?.end_time || '—',
        work_duration: duration,
        date: a.punch_in_at || a.created_at
      }
    })

    // Group by shift for summary
    const shiftSummary = new Map()
    enriched.forEach(a => {
      const shiftName = a.shift_name
      if (!shiftSummary.has(shiftName)) {
        shiftSummary.set(shiftName, {
          shift_name: shiftName,
          total_workers: 0,
          worker_names: []
        })
      }
      const summary = shiftSummary.get(shiftName)
      summary.total_workers++
      if (!summary.worker_names.includes(a.user_name)) {
        summary.worker_names.push(a.user_name)
      }
    })

    return {
      data: enriched,
      summary: {
        total_attendance: enriched.length,
        shift_summary: Array.from(shiftSummary.values())
      }
    }
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load shiftwise work report'))
  }
}
