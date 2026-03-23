import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiTruck, FiAward, FiAlertTriangle } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import UserForm from '../../components/forms/UserForm.jsx'
import * as userAPI from '../../features/users/userAPI.js'
import * as roleAPI from '../../features/roles/roleAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import * as companyAPI from '../../features/companies/companyAPI.js'
import { formatDate } from '../../utils/formatDate.js'

export default function Drivers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, user: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  // Queries
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })

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

  // Mutations
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

  // Filter Logic
  const allDrivers = useMemo(() => {
    const data = usersQuery.data?.items || usersQuery.data || []
    const all = Array.isArray(data) ? data : []
    return driverRole?.id ? all.filter((u) => u.role_id === driverRole.id) : all
  }, [usersQuery.data, driverRole?.id])

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allDrivers
    return allDrivers.filter(d =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allDrivers, searchTerm])

  // Drivers whose license expires within 30 days
  const expiringDrivers = useMemo(() => {
    const now = Date.now()
    const in30 = now + 30 * 24 * 60 * 60 * 1000
    return allDrivers.filter((d) => {
      if (!d.license_expiry_date) return false
      const exp = new Date(d.license_expiry_date).getTime()
      return exp >= now && exp <= in30
    })
  }, [allDrivers])

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Driver Details',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? 'D'
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
              {initial}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={r.name}
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 leading-tight">{r.name || 'N/A'}</span>
              <div className="flex flex-col mt-0.5">
                <span className="text-xs text-zinc-500 truncate max-w-[180px]">{r.email || 'No Email'}</span>
                <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  {r.mobile ? (
                    <>
                      <span className="text-[10px] bg-zinc-100 px-1 rounded text-zinc-500">TEL</span>
                      {r.mobile}
                    </>
                  ) : (
                    'No Phone'
                  )}
                </span>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'license',
      header: 'License Info',
      render: (r) => {
        const isExpiring = (() => {
          if (!r.license_expiry_date) return false
          const exp = new Date(r.license_expiry_date).getTime()
          const in30 = Date.now() + 30 * 24 * 60 * 60 * 1000
          return exp >= Date.now() && exp <= in30
        })()
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${isExpiring ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500'}`}>
              <FiAlertTriangle size={14} className={isExpiring ? '' : 'opacity-0 w-0'} />
              {!isExpiring && <span className="text-xs font-mono">DL</span>}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-zinc-700">{r.license_number || 'PENDING'}</span>
              <span className={`text-[10px] uppercase tracking-wider ${isExpiring ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}>
                {r.license_expiry_date ? `Exp: ${formatDate(r.license_expiry_date)}` : (r.license_type || 'General')}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (r) => (
        <div className="flex items-center gap-1">
          <FiAward className="text-amber-500" />
          <span className="text-sm font-medium">{r.year_of_experience ?? 0} Years</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setView({ open: true, record: r })} className="hover:bg-zinc-100 text-zinc-500">
            <FiEye size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, user: r })} className="hover:bg-blue-50 text-blue-600">
            <FiEdit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: r._id || r.id })} className="hover:bg-red-50 text-red-600">
            <FiTrash2 size={16} />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Driver</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage personnel, licenses, and deployment status.</p>
        </div>
        <Button 
          variant="primary" 
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />} 
          onClick={() => setModal({ open: true, user: null })} 
          disabled={!driverRole}
        >
          Add Driver
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard label="Active Drivers" value={allDrivers.length} icon={<FiTruck />} color="blue" />
        {/* <StatCard label="Avg. Experience" value={
          allDrivers.length
            ? `${(allDrivers.reduce((s, d) => s + (Number(d.year_of_experience) || 0), 0) / allDrivers.length).toFixed(1)} Yrs`
            : '—'
        } icon={<FiAward />} color="amber" /> */}
        <StatCard
          label="Expiring Soon (30d)"
          value={expiringDrivers.length}
          icon={<FiAlertTriangle />}
          color={expiringDrivers.length > 0 ? 'red' : 'emerald'}
          sub={expiringDrivers.length > 0 ? expiringDrivers.map(d => d.name).join(', ') : 'All licenses valid'}
        />
      </div>

      {/* Filter Bar */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input 
          type="text"
          placeholder="Search by driver name or license number..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {rolesQuery.isLoading || usersQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Syncing fleet data...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r._id || r.id} />
        ) : (
          <EmptyState
            title={searchTerm ? "No results found" : "Fleet is empty"}
            description={searchTerm ? `No driver matches "${searchTerm}"` : "Add your first driver to start managing your fleet."}
            actionLabel={!searchTerm ? "Add Driver" : undefined}
            onAction={() => setModal({ open: true, user: null })}
          />
        )}
      </div>

      {/* Form Modal */}
      <Modal open={modal.open} title={modal.user ? 'Edit Driver Profile' : 'Register New Driver'} onClose={() => setModal({ open: false, user: null })}>
        <div className="p-1">
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
        </div>
      </Modal>

      {/* Confirm and Detail Modals */}
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

function StatCard({ label, value, icon, color, sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        {sub && <p className="text-[11px] text-zinc-400 mt-1 truncate">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl border shrink-0 ${colors[color] ?? colors.blue}`}>
        {icon}
      </div>
    </div>
  )
}