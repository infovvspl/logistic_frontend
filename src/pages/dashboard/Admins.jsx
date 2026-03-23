import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiUsers, FiShield, FiMapPin } from 'react-icons/fi'
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
import { usePermissions } from '../../hooks/usePermissions.js'

export default function Admins() {
  const qc = useQueryClient()
  const { isSuperAdmin } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, admin: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  // Queries
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })

  const adminRole = useMemo(() => {
    const roles = rolesQuery.data?.items ?? []
    return roles.find((r) => String(r.designation || '').toLowerCase().includes('admin')) ?? null
  }, [rolesQuery.data])

  const usersQuery = useQuery({
    queryKey: ['users', 'admins', adminRole?.id],
    enabled: !!adminRole?.id,
    queryFn: userAPI.listUsers,
  })

  // Mutations (Simplified for brevity, keeping your existing logic)
  const createMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal({ open: false, admin: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => userAPI.updateUser(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal({ open: false, admin: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: userAPI.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // Data Processing
  const branchNameById = useMemo(() => {
    const map = new Map()
    ;(branchesQuery.data?.items ?? []).forEach((b) => map.set(b.id, b.branch_name))
    return map
  }, [branchesQuery.data])

  const filteredRows = useMemo(() => {
    const data = usersQuery.data?.items || []
    const admins = adminRole?.id ? data.filter(u => u.role_id === adminRole.id) : data
    
    if (!searchTerm) return admins
    return admins.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [usersQuery.data, adminRole?.id, searchTerm])

  const columns = useMemo(() => [
    { 
      key: 'name', 
      header: 'Admin User',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? '?'
        return (
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
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
              <span className="font-medium text-zinc-900">{r.name}</span>
              <span className="text-xs text-zinc-500">{r.email}</span>
            </div>
          </div>
        )
      }
    },
    { 
      key: 'branch', 
      header: 'Assigned Branch',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-zinc-600">
          <FiMapPin className="text-zinc-400" />
          <span className="text-sm">{branchNameById.get(r.branch_id) ?? 'Global'}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: () => (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Active
        </span>
      )
    },
    { 
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setView({ open: true, record: r })} className="text-zinc-500 hover:text-indigo-600">
            <FiEye className="h-4 w-4" />
          </Button>
          {isSuperAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, admin: r })} className="text-zinc-500 hover:text-amber-600">
                <FiEdit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: r._id || r.id })} className="text-zinc-500 hover:text-red-600">
                <FiTrash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [branchNameById, isSuperAdmin])

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admins</h1>
          <p className="text-zinc-500 text-sm">Overview of users with administrative privileges.</p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
            leftIcon={<FiPlus />}
            onClick={() => setModal({ open: true, admin: null })}
          >
            Add New Admin
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Admins" value={filteredRows.length} icon={<FiUsers />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Role Type" value={adminRole?.designation || 'Admin'} icon={<FiShield />} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Active Branches" value={branchNameById.size} icon={<FiMapPin />} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Table Controls */}
      <div className="relative group">
        <div className="relative flex-1 ">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <input 
            type="text" 
            placeholder="Search admins by name or email..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {usersQuery.isLoading ? (
          <div className="p-12 text-center animate-pulse">
            <div className="h-4 bg-zinc-100 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-8 bg-zinc-50 rounded w-full"></div>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r._id || r.id} />
        ) : (
          <EmptyState
            title="No admins found"
            description={searchTerm ? "Try adjusting your search filters." : "Start by adding your first system administrator."}
            actionLabel={isSuperAdmin && !searchTerm ? "Add admin" : undefined}
            onAction={() => setModal({ open: true, admin: null })}
          />
        )}
      </div>

      {/* Modals remain structurally similar but get the better UI from the wrappers */}
      <Modal open={modal.open} title={modal.admin ? "Update Admin Profile" : "Create New Admin"} onClose={() => setModal({ open: false, admin: null })}>
        <UserForm
          defaultValues={modal.admin}
          lockedRoleId={adminRole?.id}
          lockedRoleLabel={adminRole?.designation ?? 'Admin'}
          branches={branchesQuery.data?.items ?? []}
          companies={companiesQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.admin) {
              const id = modal.admin._id || modal.admin.id
              await updateMutation.mutateAsync({ id, values })
            } else {
              await createMutation.mutateAsync({ ...values, role_id: adminRole?.id })
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete Administrator"
        description="Are you sure? This user will lose all access to the dashboard immediately."
        danger
        confirmText="Confirm Delete"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />

      <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Admin Details" data={view.record} />
    </div>
  )
}

// Sub-component for better organization
function StatCard({ title, value, icon, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${bg} ${color} text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  )
}