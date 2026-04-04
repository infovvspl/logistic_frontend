import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiFilter, FiCheck, FiUsers, FiAlertTriangle,
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

export default function Helpers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [modal, setModal] = useState({ open: false, user: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

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

  const helperRole = useMemo(() => {
    const roles = rolesQuery.data?.items ?? []
    return (
      roles.find((r) => String(r.designation || '').toLowerCase() === 'helper') ??
      roles.find((r) => String(r.designation || '').toLowerCase().includes('helper')) ??
      null
    )
  }, [rolesQuery.data])

  const usersQuery = useQuery({
    queryKey: ['users', 'helpers', helperRole?.id],
    enabled: !!helperRole?.id,
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

  const allHelpers = useMemo(() => {
    const data = usersQuery.data?.items || usersQuery.data || []
    const all = Array.isArray(data) ? data : []
    return helperRole?.id ? all.filter((u) => u.role_id === helperRole.id) : all
  }, [usersQuery.data, helperRole?.id])

  const activeHelpers = useMemo(
    () => allHelpers.filter(h => (h.status || '').toUpperCase() === 'ACTIVE' || !h.status),
    [allHelpers]
  )

  // helpers currently on an IN_TRANSIT trip (via helper_id or assignment helper_id)
  const inTransitHelperIds = useMemo(() => {
    const trips = tripsQuery.data?.items ?? []
    const assignments = assignmentsQuery.data?.items ?? []

    const assignHelperMap = new Map()
    assignments.forEach((a) => {
      const helperId = a.helper_id
      if (helperId) assignHelperMap.set(String(a.id), String(helperId))
    })

    const ids = new Set()
    trips.forEach((t) => {
      if (t.status !== 'IN_TRANSIT') return
      if (t.helper_id) ids.add(String(t.helper_id))
      if (t.vehicle_assign_id) {
        const helperId = assignHelperMap.get(String(t.vehicle_assign_id))
        if (helperId) ids.add(helperId)
      }
    })
    return ids
  }, [tripsQuery.data, assignmentsQuery.data])

  // helpers scheduled for tomorrow
  const scheduledTomorrowHelperIds = useMemo(() => {
    const trips = tripsQuery.data?.items ?? []
    const assignments = assignmentsQuery.data?.items ?? []

    const assignHelperMap = new Map()
    assignments.forEach((a) => {
      const helperId = a.helper_id
      if (helperId) assignHelperMap.set(String(a.id), String(helperId))
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().slice(0, 10)

    const ids = new Set()
    trips.forEach((t) => {
      if (t.status !== 'SCHEDULED') return
      if (!t.start_date_time) return
      const tripDate = new Date(t.start_date_time).toISOString().slice(0, 10)
      if (tripDate !== tomorrowDate) return
      if (t.helper_id) ids.add(String(t.helper_id))
      if (t.vehicle_assign_id) {
        const helperId = assignHelperMap.get(String(t.vehicle_assign_id))
        if (helperId) ids.add(helperId)
      }
    })
    return ids
  }, [tripsQuery.data, assignmentsQuery.data])

  // helpers with license expiring within 30 days
  const expiringHelpers = useMemo(() => {
    const now = Date.now()
    const in30 = now + 30 * 24 * 60 * 60 * 1000
    return allHelpers.filter((h) => {
      if (!h.license_expiry_date) return false
      const exp = new Date(h.license_expiry_date).getTime()
      return exp >= now && exp <= in30
    })
  }, [allHelpers])

  const filteredRows = useMemo(() => {
    let rows = allHelpers
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter(h =>
        h.name?.toLowerCase().includes(q) ||
        h.mobile?.includes(searchTerm)
      )
    }
    if (activeFilter === 'active') {
      rows = rows.filter(h => (h.status || '').toUpperCase() === 'ACTIVE' || !h.status)
    } else if (activeFilter === 'in_trip') {
      rows = rows.filter(h => inTransitHelperIds.has(String(h._id ?? h.id)))
    } else if (activeFilter === 'SCHEDULED') {
      rows = rows.filter(h => scheduledTomorrowHelperIds.has(String(h._id ?? h.id)))
    } else if (activeFilter === 'expiring') {
      rows = rows.filter(h => expiringHelpers.some(e => (e._id || e.id) === (h._id || h.id)))
    }
    return rows
  }, [allHelpers, searchTerm, activeFilter, inTransitHelperIds, scheduledTomorrowHelperIds, expiringHelpers])

  // --- Premium Table Definition ---
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Helper Details',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? 'H'
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-white overflow-hidden bg-zinc-100 text-zinc-400">
              <div className="absolute inset-0 flex items-center justify-center">
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
      key: 'contact',
      header: 'Contact',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          {/* <span className="text-[10px] font-black text-zinc-400">TEL</span> */}
          <span className="text-xs font-bold text-zinc-700 tracking-tighter">
            {r.mobile || 'No Phone'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const isActive = (r.status || '').toUpperCase() === 'ACTIVE' || !r.status
        return (
          <div className="flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full shadow-sm ${
              isActive 
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
              : 'bg-zinc-300'
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isActive ? 'text-emerald-700' : 'text-zinc-500'
            }`}>
              {r.status || 'Active'}
            </span>
          </div>
        )
      }
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
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Helpers</h1>
            {/* <p className="text-zinc-500 font-medium">Manage support staff, contact details, and status.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-orange-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, user: null })}
            disabled={!helperRole}
          >
            Add Helper
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <PageStatCard title="Total Helpers" value={allHelpers.length} icon={<FiUsers size={20} />} gradient="from-zinc-600 to-zinc-800" />
          <PageStatCard title="Active Helpers" value={activeHelpers.length} icon={<FiUsers size={20} />} gradient="from-blue-500 to-indigo-600" />
          <PageStatCard title="On Trip" value={inTransitHelperIds.size} icon={<FiUsers size={20} />} gradient="from-emerald-500 to-teal-500" />
          <PageStatCard title="Tomorrow Schedule" value={scheduledTomorrowHelperIds.size} icon={<FiUsers size={20} />} gradient="from-violet-500 to-purple-600" />
          <PageStatCard title="License Expiring (30d)" value={expiringHelpers.length} icon={<FiAlertTriangle size={20} />} gradient={expiringHelpers.length > 0 ? 'from-red-500 to-orange-500' : 'from-amber-400 to-orange-400'} />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by helper name or mobile..."
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
              {activeFilter === 'active' ? 'Active' : activeFilter === 'in_trip' ? 'In Trip' : activeFilter === 'SCHEDULED' ? 'Tomorrow' : activeFilter === 'expiring' ? 'Expiring' : 'Filter'}
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
                    { key: 'active',    label: 'Active Helpers' },
                    { key: 'in_trip',   label: 'Helpers on Trip' },
                    { key: 'SCHEDULED', label: 'Scheduled Tomorrow' },
                    { key: 'expiring',  label: 'License Expiring (30d)' },
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
            {rolesQuery.isLoading || usersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r._id || r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-orange-50/40 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState title="No Records" description="Adjust filters or add a new helper." />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal.open} title={modal.user ? 'Edit Helper Profile' : 'Add New Helper'} onClose={() => setModal({ open: false, user: null })}>
        <UserForm
          defaultValues={modal.user}
          lockedRoleId={helperRole?.id}
          lockedRoleLabel={helperRole?.designation ?? 'Helper'}
          branches={branchesQuery.data?.items ?? []}
          companies={companiesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            const id = modal.user?._id || modal.user?.id
            if (modal.user) {
              await updateMutation.mutateAsync({ id, values })
            } else {
              await createMutation.mutateAsync({ ...values, role_id: helperRole?.id })
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove Helper?"
        description="This will permanently remove the helper. This action cannot be undone."
        danger
        confirmText="Confirm Removal"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />

      <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Helper Details" data={view.record} />
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