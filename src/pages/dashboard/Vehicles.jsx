import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiUser, FiEye, FiTruck, FiSearch, FiMapPin, FiRefreshCw } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import VehicleForm from '../../components/forms/VehicleForm.jsx'
import AssignmentForm from '../../components/forms/AssignmentForm.jsx'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import * as userAPI from '../../features/users/userAPI.js'
import * as roleAPI from '../../features/roles/roleAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'

export default function Vehicles() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, vehicle: null })
  const [driverModal, setDriverModal] = useState({ open: false, vehicle: null, assignment: null })
  const [helperModal, setHelperModal] = useState({ open: false, vehicle: null, assignment: null })
  const [view, setView] = useState({ open: false, record: null, driver: null, helper: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  // Data Fetching
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const assignmentsQuery = useQuery({ queryKey: ['assignments'], queryFn: assignmentAPI.listAssignments })

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

  // Mutations
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

  // Mappings
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

  // Filter logic
  const filteredRows = useMemo(() => {
    const rows = vehiclesQuery.data?.items ?? []
    if (!searchTerm) return rows
    return rows.filter(r => 
      r.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [vehiclesQuery.data, searchTerm])

  const columns = useMemo(() => [
    {
      key: 'registration_number',
      header: 'Vehicle Identity',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
            <FiTruck size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 tracking-tight leading-none mb-1">{r.registration_number}</span>
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-tighter">
              {r.vehicle_model || r.vehicle_manufacture_company || 'Standard Model'} • {r.vehicle_type}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-zinc-600">
          <FiMapPin size={14} className="text-zinc-400" />
          <span className="text-sm">{branchNameById.get(String(r.branch_id)) ?? '—'}</span>
        </div>
      )
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (r) => {
        const assignment = assignmentByVehicleId.get(String(r.id))
        const driver = assignment ? driverById.get(String(assignment.driver_id || assignment.user_id)) : null

        if (driver) {
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200 shrink-0">
                {driver.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-900 leading-tight">{driver.name}</span>
                <button
                  onClick={() => setDriverModal({ open: true, vehicle: r, assignment })}
                  className="text-[10px] text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <FiRefreshCw size={10} /> REASSIGN
                </button>
              </div>
            </div>
          )
        }
        return (
          <Button variant="ghost" size="sm"
            className="text-[11px] h-8 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
            leftIcon={<FiUser size={14} />}
            onClick={() => setDriverModal({ open: true, vehicle: r, assignment: null })}
          >
            Assign Driver
          </Button>
        )
      }
    },
    {
      key: 'helper',
      header: 'Helper',
      render: (r) => {
        const assignment = assignmentByVehicleId.get(String(r.id))
        const helper = assignment ? helperById.get(String(assignment.helper_id)) : null

        if (helper) {
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs border border-orange-200 shrink-0">
                {helper.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-900 leading-tight">{helper.name}</span>
                <button
                  onClick={() => setHelperModal({ open: true, vehicle: r, assignment })}
                  className="text-[10px] text-orange-600 font-bold hover:text-orange-800 flex items-center gap-1 transition-colors"
                >
                  <FiRefreshCw size={10} /> REASSIGN
                </button>
              </div>
            </div>
          )
        }
        return (
          <Button variant="ghost" size="sm"
            className="text-[11px] h-8 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
            leftIcon={<FiUser size={14} />}
            onClick={() => setHelperModal({ open: true, vehicle: r, assignment: null })}
          >
            Assign Helper
          </Button>
        )
      }
    },
    {
      key: 'vehicle_status',
      header: 'Status',
      render: (r) => {
        const isActive = r.vehicle_status === 'ACTIVE'
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
            isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {r.vehicle_status}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: '',
      render: (r) => {
        const assignment = assignmentByVehicleId.get(String(r.id))
        const driver = assignment ? driverById.get(String(assignment.driver_id || assignment.user_id)) : null
        const helper = assignment ? helperById.get(String(assignment.helper_id)) : null
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setView({ open: true, record: r, driver, helper })} className="text-zinc-400 hover:text-zinc-900"><FiEye size={18} /></Button>
            <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, vehicle: r })} className="text-zinc-400 hover:text-blue-600"><FiEdit2 size={18} /></Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: r.id })} className="text-zinc-400 hover:text-red-600"><FiTrash2 size={18} /></Button>
          </div>
        )
      },
    },
  ], [branchNameById, assignmentByVehicleId, driverById, helperById])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Vehicles</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage fleet inventory, assignments, and vehicle status.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, vehicle: null })}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Vehicles" value={(vehiclesQuery.data?.items ?? []).length} icon={<FiTruck />} color="blue" />
        <StatCard label="Assigned Vehicles" value={assignmentByVehicleId.size} icon={<FiUser />} color="emerald" />
        <StatCard
          label="Unassigned Vehicles"
          value={(vehiclesQuery.data?.items ?? []).length - assignmentByVehicleId.size}
          icon={<FiMapPin />}
          color="amber"
        />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by registration number or model..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {vehiclesQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading vehicles...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'Fleet Inventory Empty'}
            description={searchTerm ? `No vehicle matches "${searchTerm}"` : 'Register your first vehicle to begin assigning drivers.'}
            actionLabel={!searchTerm ? 'Add Vehicle' : undefined}
            onAction={() => setModal({ open: true, vehicle: null })}
          />
        )}
      </div>

      {/* Vehicle Form Modal */}
      <Modal open={modal.open} size="lg" title={modal.vehicle ? "Modify Vehicle Entry" : "Register New Vehicle"} onClose={() => setModal({ open: false, vehicle: null })}>
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

      {/* Driver Assignment Modal */}
      <Modal open={driverModal.open} title="Assign Driver" onClose={() => setDriverModal({ open: false, vehicle: null, assignment: null })}>
        <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vehicle</p>
            <p className="text-lg font-black text-zinc-900">{driverModal.vehicle?.registration_number}</p>
          </div>
          <FiTruck size={24} className="text-zinc-300" />
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

      {/* Helper Assignment Modal */}
      <Modal open={helperModal.open} title="Assign Helper" onClose={() => setHelperModal({ open: false, vehicle: null, assignment: null })}>
        <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vehicle</p>
            <p className="text-lg font-black text-zinc-900">{helperModal.vehicle?.registration_number}</p>
          </div>
          <FiTruck size={24} className="text-zinc-300" />
        </div>
        <AssignmentForm
          mode="helper"
          drivers={[]}
          helpers={helpers}
          defaultValues={helperModal.assignment}
          loading={createAssignMutation.isPending || updateAssignMutation.isPending}
          onSubmit={async (values) => {
            const payload = { ...values, vehicle_id: helperModal.vehicle.id }
            if (helperModal.assignment) await updateAssignMutation.mutateAsync({ id: helperModal.assignment.id, values: payload })
            else await createAssignMutation.mutateAsync(payload)
          }}
        />
      </Modal>

      {/* Standard Dialogs */}
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
        title="Vehicle Details"
        data={view.record}
        extraSections={[
          ...(view.driver ? [{
            title: 'Assigned Driver',
            data: {
              'Full Name': view.driver.name,
              'Contact': view.driver.mobile,
              'License Number': view.driver.license_number,
              'License Type': view.driver.license_type,
            }
          }] : []),
          ...(view.helper ? [{
            title: 'Assigned Helper',
            data: {
              'Full Name': view.helper.name,
              'Contact': view.helper.mobile,
            }
          }] : []),
        ]}
      />
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }
  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl border ${colors[color]}`}>{icon}</div>
    </div>
  )
}
