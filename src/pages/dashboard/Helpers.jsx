import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiUsers, FiUserCheck, FiMapPin } from 'react-icons/fi'
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

export default function Helpers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, user: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: roleAPI.listRoles })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })

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

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allHelpers
    return allHelpers.filter(h =>
      h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.mobile?.includes(searchTerm)
    )
  }, [allHelpers, searchTerm])

  const activeHelpers = useMemo(
    () => allHelpers.filter(h => (h.status || '').toUpperCase() === 'ACTIVE' || !h.status),
    [allHelpers]
  )

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Helper Details',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? 'H'
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold border border-orange-200 shrink-0">
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
                  ) : 'No Phone'}
                </span>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const isActive = (r.status || '').toUpperCase() === 'ACTIVE' || !r.status
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {r.status || 'Active'}
          </span>
        )
      },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Helpers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage support staff, contact details, and status.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, user: null })}
          disabled={!helperRole}
        >
          Add Helper
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Helpers" value={allHelpers.length} icon={<FiUsers />} color="blue" />
        <StatCard label="Active Helpers" value={activeHelpers.length} icon={<FiUserCheck />} color="emerald" />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by helper name or mobile..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {rolesQuery.isLoading || usersQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading helpers...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r._id || r.id} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No helpers yet'}
            description={searchTerm ? `No helper matches "${searchTerm}"` : "Add your first helper to get started."}
            actionLabel={!searchTerm ? 'Add Helper' : undefined}
            onAction={() => setModal({ open: true, user: null })}
          />
        )}
      </div>

      {/* Form Modal */}
      <Modal open={modal.open} title={modal.user ? 'Edit Helper Profile' : 'Register New Helper'} onClose={() => setModal({ open: false, user: null })}>
        <div className="p-1">
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
        </div>
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
