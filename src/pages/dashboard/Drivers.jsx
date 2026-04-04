import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, 
  FiTruck, FiAward, FiAlertTriangle, FiFilter, FiCheck,
} from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import UserForm from '../../components/forms/UserForm.jsx'

// APIs
import * as userAPI from '../../features/users/userAPI.js'
import * as roleAPI from '../../features/roles/roleAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import { formatDate } from '../../utils/formatDate.js'

export default function Drivers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null) // null | 'active' | 'experience' | 'in_trip'
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [modal, setModal] = useState({ open: false, user: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // --- Queries & Mutations (Logic preserved) ---
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: tripAPI.listTrips })
  const assignmentsQuery = useQuery({ queryKey: ['assignments'], queryFn: assignmentAPI.listAssignments })

  const driverRole = useMemo(() => {
    const roles = rolesQuery.data?.items ?? []
    return (
      roles.find((r) => String(r.designation || '').toLowerCase() === 'driver') ??
      roles.find((r) => String(r.designation || '').toLowerCase().includes('driver')) ??
      null
    )
  }, [rolesQuery.data])

  const usersQuery = useQuery({
    queryKey: ['users', 'drivers', driverRole?.id],
    enabled: !!driverRole?.id,
    queryFn: userAPI.listUsers,
  })

  const createMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal({ open: false, user: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => userAPI.updateUser(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal({ open: false, user: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: userAPI.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const allDrivers = useMemo(() => {
    const data = usersQuery.data?.items || usersQuery.data || []
    const all = Array.isArray(data) ? data : []
    return driverRole?.id ? all.filter((u) => u.role_id === driverRole.id) : all
  }, [usersQuery.data, driverRole?.id])

  // Set of driver IDs scheduled for tomorrow (SCHEDULED trips with start_date_time = tomorrow)
  const scheduledTomorrowDriverIds = useMemo(() => {
    const trips = tripsQuery.data?.items ?? []
    const assignments = assignmentsQuery.data?.items ?? []
    const assignDriverMap = new Map()
    assignments.forEach((a) => {
      const driverId = a.driver_id ?? a.user_id
      if (driverId) assignDriverMap.set(String(a.id), String(driverId))
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().slice(0, 10) // "YYYY-MM-DD"

    const ids = new Set()
    trips.forEach((t) => {
      if (t.status !== 'SCHEDULED') return
      if (!t.start_date_time) return
      const tripDate = new Date(t.start_date_time).toISOString().slice(0, 10)
      if (tripDate !== tomorrowDate) return
      if (t.driver_id) ids.add(String(t.driver_id))
      if (t.vehicle_assign_id) {
        const driverId = assignDriverMap.get(String(t.vehicle_assign_id))
        if (driverId) ids.add(driverId)
      }
    })
    return ids
  }, [tripsQuery.data, assignmentsQuery.data])
  // Driver is linked via trip.vehicle_assign_id → assignment.driver_id
  const inTransitDriverIds = useMemo(() => {
    const trips = tripsQuery.data?.items ?? []
    const assignments = assignmentsQuery.data?.items ?? []

    // assignment_id → driver_id
    const assignDriverMap = new Map()
    assignments.forEach((a) => {
      const driverId = a.driver_id ?? a.user_id
      if (driverId) assignDriverMap.set(String(a.id), String(driverId))
    })

    const ids = new Set()
    trips.forEach((t) => {
      if (t.status !== 'IN_TRANSIT') return
      // direct driver_id on trip
      if (t.driver_id) ids.add(String(t.driver_id))
      // via vehicle_assign_id → assignment
      if (t.vehicle_assign_id) {
        const driverId = assignDriverMap.get(String(t.vehicle_assign_id))
        if (driverId) ids.add(driverId)
      }
    })
    return ids
  }, [tripsQuery.data, assignmentsQuery.data])

  const filteredRows = useMemo(() => {
    let rows = allDrivers

    // search
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter((d) =>
        d.name?.toLowerCase().includes(q) ||
        d.license_number?.toLowerCase().includes(q)
      )
    }

    // filter
    if (activeFilter === 'active') {
      rows = rows.filter((d) => d.is_active !== false && d.status !== 'inactive')
    } else if (activeFilter === 'experience') {
      rows = [...rows].sort((a, b) => (Number(b.year_of_experience) || 0) - (Number(a.year_of_experience) || 0))
    } else if (activeFilter === 'experience_lh') {
      rows = [...rows].sort((a, b) => (Number(a.year_of_experience) || 0) - (Number(b.year_of_experience) || 0))
    } else if (activeFilter === 'in_trip') {
      rows = rows.filter((d) => inTransitDriverIds.has(String(d._id ?? d.id)))
    } else if (activeFilter === 'SCHEDULED') {
      rows = rows.filter((d) => scheduledTomorrowDriverIds.has(String(d._id ?? d.id)))
    }

    return rows
  }, [allDrivers, searchTerm, activeFilter, inTransitDriverIds, scheduledTomorrowDriverIds])

  const expiringDrivers = useMemo(() => {
    const now = Date.now()
    const in30 = now + 30 * 24 * 60 * 60 * 1000
    return allDrivers.filter((d) => {
      if (!d.license_expiry_date) return false
      const exp = new Date(d.license_expiry_date).getTime()
      return exp >= now && exp <= in30
    })
  }, [allDrivers])

  // --- Premium Table Definition ---
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Driver Details',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? 'D'
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-white overflow-hidden bg-zinc-100">
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                <span className="text-sm font-bold">{initial}</span>
              </div>
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={r.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-900 truncate leading-tight">{r.name || 'N/A'}</span>
              <span className="text-[11px] text-zinc-500 font-medium tracking-wide truncate">{r.email || 'No Email'}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'license',
      header: 'License Info',
      render: (r) => {
        const isExpiring = expiringDrivers.some(d => (d._id || d.id) === (r._id || r.id))
        return (
          <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border w-fit ${isExpiring ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
            {/* {isExpiring ? <FiAlertTriangle className="text-red-500 text-xs" /> : <div className="text-[10px] font-black text-zinc-400">DL</div>} */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-tighter">{r.license_number || 'PENDING'}</span>
              <span className={`text-[10px] font-bold uppercase ${isExpiring ? 'text-red-600' : 'text-zinc-400'}`}>
                {r.license_expiry_date ? `Exp: ${formatDate(r.license_expiry_date)}` : 'General'}
              </span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (r) => (
        <div className="flex items-center gap-2">
          <FiAward className="text-amber-500 text-sm" />
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{r.year_of_experience ?? 0} Years</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, user: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r._id || r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [expiringDrivers])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Drivers</h1>
            {/* <p className="text-zinc-500 font-medium">Manage personnel, licenses, and deployment status.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, user: null })}
            disabled={!driverRole}
          >
            Add Driver
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <PageStatCard title="Total Drivers" value={allDrivers.length} icon={<FiTruck size={20} />} gradient="from-zinc-600 to-zinc-800" />
          <PageStatCard title="Active Drivers" value={allDrivers.filter(d => d.is_active !== false && d.status !== 'inactive').length} icon={<FiTruck size={20} />} gradient="from-blue-500 to-indigo-600" />
          <PageStatCard title="On Trip" value={inTransitDriverIds.size} icon={<FiTruck size={20} />} gradient="from-emerald-500 to-teal-500" />
          <PageStatCard title="Tomorrow driver schedule" value={scheduledTomorrowDriverIds.size} icon={<FiTruck size={20} />} gradient="from-violet-500 to-purple-600" />
          <PageStatCard title="License Expiring (30d)" value={expiringDrivers.length} icon={<FiAlertTriangle size={20} />} gradient={expiringDrivers.length > 0 ? 'from-red-500 to-orange-500' : 'from-amber-400 to-orange-400'} />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by driver name or license number..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-5 py-5 rounded-2xl font-semibold text-sm transition-all shadow-sm border
                ${activeFilter ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200'}`}
            >
              <FiFilter size={16} />
              {activeFilter === 'active' ? 'Active' : activeFilter === 'experience' ? 'Exp H→L' : activeFilter === 'experience_lh' ? 'Exp L→H' : activeFilter === 'in_trip' ? 'In Trip' : activeFilter === 'SCHEDULED' ? 'Tomorrow' : 'Filter'}
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
                    { key: 'active',        label: 'Active Drivers' },
                    { key: 'experience',    label: 'Experience (High → Low)' },
                    { key: 'experience_lh', label: 'Experience (Low → High)' },
                    { key: 'in_trip',       label: 'Drivers in Trip' },
                    { key: 'SCHEDULED',       label: 'Drivers Scheduled' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setActiveFilter(activeFilter === opt.key ? null : opt.key); setFilterOpen(false) }}
                      className="w-full flex items-center justify-between p-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {opt.label}
                      {activeFilter === opt.key && <FiCheck size={14} className="text-zinc-900" />}
                    </button>
                  ))}
                  {activeFilter && (
                    <button
                      onClick={() => { setActiveFilter(null); setFilterOpen(false) }}
                      className="w-full px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100 text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Premium Table Wrapper */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {usersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r._id || r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-zinc-50/80 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState title="Fleet is empty" description="Add your first driver to start managing your fleet." />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal.open} title={modal.user ? 'Edit Driver Profile' : 'Add New Driver'} onClose={() => setModal({ open: false, user: null })}>
        <UserForm
          defaultValues={modal.user}
          lockedRoleId={driverRole?.id}
          lockedRoleLabel={driverRole?.designation ?? 'Driver'}
          branches={branchesQuery.data?.items ?? []}
          companies={companiesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            const id = modal.user?._id || modal.user?.id
            if (modal.user) {
              await updateMutation.mutateAsync({ id, values })
            } else {
              await createMutation.mutateAsync({ ...values, role_id: driverRole?.id })
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove Driver?"
        description="This will permanently remove the driver from the active fleet. This action cannot be undone."
        danger
        confirmText="Confirm Removal"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />

      <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Driver Details" data={view.record} />
    </div>
  )
}

// --- Specialized UI Components ---

function ActionBtn({ icon, onClick, hover }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl text-zinc-400 transition-all active:scale-90 ${hover}`}
    >
      <div className="text-lg">{icon}</div>
    </button>
  )
}