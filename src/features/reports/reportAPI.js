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
export const fetchTripsReport           = (filters) => fetchReport('trips', filters)

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
