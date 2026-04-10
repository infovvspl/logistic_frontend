import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlus, FiTrash2, FiEdit2, FiUser, FiEye, FiTruck, 
  FiSearch, FiMapPin, FiRefreshCw, FiCheckCircle, FiFilter, FiCheck
} from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import VehicleForm from '../../components/forms/VehicleForm.jsx'
import AssignmentForm from '../../components/forms/AssignmentForm.jsx'

// APIs
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as roleAPI from '../../features/roles/roleAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as tripAPI from '../../features/trips/tripAPI.js'

export default function Vehicles() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [modal, setModal] = useState({ open: false, vehicle: null })
  const [driverModal, setDriverModal] = useState({ open: false, vehicle: null, assignment: null })
  const [helperModal, setHelperModal] = useState({ open: false, vehicle: null, assignment: null })
  const [view, setView] = useState({ open: false, record: null, driver: null, helper: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  useEffect(() => {
    function handler(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // --- Queries ---
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const assignmentsQuery = useQuery({ queryKey: ['assignments'], queryFn: assignmentAPI.listAssignments })
  const tripsQuery = useQuery({ queryKey: ['trips'], queryFn: tripAPI.listTrips })

  // --- Role Logic ---
  const driverRole = useMemo(() => {
    const roles = rolesQuery.data?.items ?? []
    return roles.find((r) => String(r.designation || '').toLowerCase().includes('driver')) ?? null
  }, [rolesQuery.data])

  const helperRole = useMemo(() => {
    const roles = rolesQuery.data?.items ?? []
    return roles.find((r) => String(r.designation || '').toLowerCase().includes('helper')) ?? null
  }, [rolesQuery.data])

  const driversQuery = useQuery({
    queryKey: ['users', 'drivers', driverRole?.id],
    enabled: !!driverRole?.id,
    queryFn: userAPI.listUsers,
  })

  const helpersQuery = useQuery({
    queryKey: ['users', 'helpers', helperRole?.id],
    enabled: !!helperRole?.id,
    queryFn: userAPI.listUsers,
  })

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: vehicleAPI.createVehicle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModal({ open: false, vehicle: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => vehicleAPI.updateVehicle(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModal({ open: false, vehicle: null }) },
  })

  const createAssignMutation = useMutation({
    mutationFn: assignmentAPI.createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      setDriverModal({ open: false, vehicle: null, assignment: null })
      setHelperModal({ open: false, vehicle: null, assignment: null })
    },
  })

  const updateAssignMutation = useMutation({
    mutationFn: ({ id, values }) => assignmentAPI.updateAssignment(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      setDriverModal({ open: false, vehicle: null, assignment: null })
      setHelperModal({ open: false, vehicle: null, assignment: null })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: vehicleAPI.deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  // --- Logic Mappings ---
  const branchNameById = useMemo(() => {
    const map = new Map();
    (branchesQuery.data?.items ?? []).forEach((b) => map.set(String(b.id), b.branch_name))
    return map
  }, [branchesQuery.data])

  const assignmentByVehicleId = useMemo(() => {
    const map = new Map();
    (assignmentsQuery.data?.items ?? []).forEach((a) => map.set(String(a.vehicle_id), a))
    return map
  }, [assignmentsQuery.data])

  const drivers = useMemo(() => {
    const all = driversQuery.data?.items ?? []
    return driverRole?.id ? all.filter((u) => String(u.role_id) === String(driverRole.id)) : []
  }, [driversQuery.data, driverRole])

  const driverById = useMemo(() => {
    const map = new Map()
    drivers.forEach((d) => map.set(String(d.id), d))
    return map
  }, [drivers])

  const helpers = useMemo(() => {
    const all = helpersQuery.data?.items ?? []
    return helperRole?.id ? all.filter((u) => String(u.role_id) === String(helperRole.id)) : []
  }, [helpersQuery.data, helperRole])

  const helperById = useMemo(() => {
    const map = new Map()
    helpers.forEach((h) => map.set(String(h.id), h))
    return map
  }, [helpers])

  // Vehicles currently on trip (IN_TRANSIT trips)
  const inTransitVehicleIds = useMemo(() => {
    const trips = tripsQuery.data?.items ?? []
    const assignments = assignmentsQuery.data?.items ?? []
    
    const assignVehicleMap = new Map()
    assignments.forEach((a) => {
      if (a.vehicle_id) assignVehicleMap.set(String(a.id), String(a.vehicle_id))
    })
    
    const ids = new Set()
    trips.forEach((t) => {
      if (t.status !== 'IN_TRANSIT') return
      if (t.vehicle_id) ids.add(String(t.vehicle_id))
      if (t.vehicle_assign_id) {
        const vehicleId = assignVehicleMap.get(String(t.vehicle_assign_id))
        if (vehicleId) ids.add(vehicleId)
      }
    })
    return ids
  }, [tripsQuery.data, assignmentsQuery.data])

  const filteredRows = useMemo(() => {
    let rows = vehiclesQuery.data?.items ?? []
    
    // Apply search filter
    if (searchTerm) {
      rows = rows.filter(r => 
        r.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply status filter
    if (activeFilter === 'active') {
      rows = rows.filter(r => r.vehicle_status === 'ACTIVE')
    } else if (activeFilter === 'inactive') {
      rows = rows.filter(r => r.vehicle_status === 'INACTIVE')
    } else if (activeFilter === 'maintenance') {
      rows = rows.filter(r => r.vehicle_status === 'MAINTENANCE')
    } else if (activeFilter === 'on_trip') {
      rows = rows.filter(r => inTransitVehicleIds.has(String(r.id)))
    }
    
    return rows
  }, [vehiclesQuery.data, searchTerm, activeFilter, inTransitVehicleIds])

  // --- Table Configuration ---
  const columns = useMemo(() => [
    {
      key: 'registration_number',
      header: 'Vehicle Identity',
      render: (r) => (
        <div className="flex items-center gap-4 py-1">
          <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg shrink-0">
            <FiTruck size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-900 tracking-tight text-base leading-tight uppercase">{r.registration_number}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate">
              {r.vehicle_model || 'Standard'} • {r.vehicle_type}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          <FiMapPin size={12} className="text-zinc-400" />
          <span className="text-xs font-bold text-zinc-700">{branchNameById.get(String(r.branch_id)) ?? '—'}</span>
        </div>
      )
    },
    {
      key: 'driver',
      header: 'Staff Assignment',
      render: (r) => {
        const assignment = assignmentByVehicleId.get(String(r.id))
        const driver = assignment ? driverById.get(String(assignment.driver_id || assignment.user_id)) : null
        const helper = assignment ? helperById.get(String(assignment.helper_id)) : null

        return (
          <div className="flex flex-col gap-2">
            {/* Driver Pill */}
            {driver ? (
              <div className="flex items-center justify-between gap-3 bg-blue-50/50 p-1.5 pr-3 rounded-full border border-blue-100 w-fit group/staff">
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {driver.name.charAt(0)}
                </div>
                <span className="text-[11px] font-bold text-blue-900">{driver.name}</span>
                <button 
                   onClick={() => setDriverModal({ open: true, vehicle: r, assignment })}
                   className="opacity-0 group-hover/staff:opacity-100 transition-opacity text-blue-600 hover:scale-110"
                >
                  <FiRefreshCw size={12} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setDriverModal({ open: true, vehicle: r, assignment: null })}
                className="text-[10px] font-black text-zinc-400 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-widest"
              >
                <FiPlus size={12} /> Assign Driver
              </button>
            )}

            {/* Helper Pill */}
            {helper ? (
              <div className="flex items-center justify-between gap-3 bg-orange-50/50 p-1.5 pr-3 rounded-full border border-orange-100 w-fit group/staff">
                <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {helper.name.charAt(0)}
                </div>
                <span className="text-[11px] font-bold text-orange-900">{helper.name}</span>
                <button 
                  onClick={() => setHelperModal({ open: true, vehicle: r, assignment })}
                  className="opacity-0 group-hover/staff:opacity-100 transition-opacity text-orange-600 hover:scale-110"
                >
                  <FiRefreshCw size={12} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setHelperModal({ open: true, vehicle: r, assignment: null })}
                className="text-[10px] font-black text-zinc-400 hover:text-orange-600 flex items-center gap-1 transition-colors uppercase tracking-widest"
              >
                <FiPlus size={12} /> Assign Helper
              </button>
            )}
          </div>
        )
      }
    },
    {
      key: 'vehicle_status',
      header: 'Status',
      render: (r) => {
        const isActive = r.vehicle_status === 'ACTIVE'
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-zinc-300'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-700' : 'text-zinc-500'}`}>
              {r.vehicle_status}
            </span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => {
        const assignment = assignmentByVehicleId.get(String(r.id))
        const driver = assignment ? driverById.get(String(assignment.driver_id || assignment.user_id)) : null
        const helper = assignment ? helperById.get(String(assignment.helper_id)) : null
        return (
          <div className="flex justify-end gap-1">
            <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r, driver, helper })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
            <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, vehicle: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
            <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
          </div>
        )
      },
    },
  ], [branchNameById, assignmentByVehicleId, driverById, helperById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Vehicles</h1>
            {/* <p className="text-zinc-500 font-medium">Manage fleet inventory, assignments, and vehicle status.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, vehicle: null })}
          >
            Add New Vehicle
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PageStatCard title="Total Fleet" value={vehiclesQuery.data?.items?.length ?? 0} icon={<FiTruck size={20} />} gradient="from-blue-600 to-indigo-600" />
          <PageStatCard title="Active Duty" value={assignmentByVehicleId.size} icon={<FiCheckCircle size={20} />} gradient="from-emerald-600 to-teal-600" />
          <PageStatCard title="Standby" value={(vehiclesQuery.data?.items?.length ?? 0) - assignmentByVehicleId.size} icon={<FiRefreshCw size={20} />} gradient="from-amber-500 to-orange-600" />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by registration number or model..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
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
              {activeFilter === 'active' ? 'Active' : activeFilter === 'inactive' ? 'Inactive' : activeFilter === 'maintenance' ? 'Maintenance' : activeFilter === 'on_trip' ? 'On Trip' : 'Filter'}
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
                    { key: 'active',       label: 'Active Vehicles' },
                    { key: 'inactive',     label: 'Inactive Vehicles' },
                    { key: 'maintenance',  label: 'Under Maintenance' },
                    { key: 'on_trip',      label: 'Vehicles on Trip' },
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

        {/* Main Table */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          {vehiclesQuery.isLoading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" /></div>
          ) : filteredRows.length ? (
            <Table
              columns={columns}
              rows={filteredRows}
              headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
              rowClassName="group hover:bg-emerald-50/30 transition-colors border-b border-zinc-50 last:border-none"
            />
          ) : (
            <EmptyState title="No Vehicles Found" description="Try adjusting your search or add a new vehicle." />
          )}
        </div>
      </div>

      {/* --- Modals (Logic preserved, styling inherited) --- */}
      <Modal open={modal.open} size="lg" title={modal.vehicle ? "Modify Vehicle" : "Add New Vehicle"} onClose={() => setModal({ open: false, vehicle: null })}>
        <VehicleForm
          defaultValues={modal.vehicle}
          branches={branchesQuery.data?.items ?? []}
          companies={companiesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.vehicle) await updateMutation.mutateAsync({ id: modal.vehicle.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <Modal open={driverModal.open} title="Assign Driver" onClose={() => setDriverModal({ open: false, vehicle: null, assignment: null })}>
        <div className="mb-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Vehicle</p>
            <p className="text-xl font-black text-blue-900">{driverModal.vehicle?.registration_number}</p>
          </div>
          <FiUser size={32} className="text-blue-200" />
        </div>
        <AssignmentForm
          mode="driver"
          drivers={drivers}
          helpers={[]}
          defaultValues={driverModal.assignment}
          loading={createAssignMutation.isPending || updateAssignMutation.isPending}
          onSubmit={async (values) => {
            const payload = { ...values, vehicle_id: driverModal.vehicle.id }
            if (driverModal.assignment) await updateAssignMutation.mutateAsync({ id: driverModal.assignment.id, values: payload })
            else await createAssignMutation.mutateAsync(payload)
          }}
        />
      </Modal>

      <Modal open={helperModal.open} title="Assign Helper" onClose={() => setHelperModal({ open: false, vehicle: null, assignment: null })}>
        <div className="mb-6 p-5 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Active Vehicle</p>
            <p className="text-xl font-black text-orange-900">{helperModal.vehicle?.registration_number}</p>
          </div>
          <FiUser size={32} className="text-orange-200" />
        </div>
        <AssignmentForm
          mode="helper"
          drivers={[]}
          helpers={helpers}
          defaultValues={helperModal.assignment}
          loading={createAssignMutation.isPending || updateAssignMutation.isPending}
          onSubmit={async (values) => {
            const existingAssignment = assignmentByVehicleId.get(String(helperModal.vehicle.id))
            const payload = { ...values, vehicle_id: helperModal.vehicle.id }
            if (existingAssignment) {
              // Always update the existing assignment to add/change helper
              await updateAssignMutation.mutateAsync({ id: existingAssignment.id, values: payload })
            } else {
              await createAssignMutation.mutateAsync(payload)
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Decommission Vehicle?"
        description="This will permanently remove the vehicle from the registry and clear active assignments."
        danger confirmText="Remove Vehicle" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      <DetailModal
        open={view.open}
        onClose={() => setView({ open: false, record: null, driver: null, helper: null })}
        title="Vehicles Details"
        data={view.record}
        extraSections={[
          ...(view.driver ? [{
            title: 'Assigned Driver',
            data: { 'Name': view.driver.name, 'Contact': view.driver.mobile, 'License': view.driver.license_number }
          }] : []),
          ...(view.helper ? [{
            title: 'Assigned Helper',
            data: { 'Name': view.helper.name, 'Contact': view.helper.mobile }
          }] : []),
        ]}
      />
    </div>
  )
}

// --- Internal Helper Components ---

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