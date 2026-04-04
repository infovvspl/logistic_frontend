import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch,
  FiUsers, FiShield, FiMapPin, FiChevronRight
} from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import UserForm from '../../components/forms/UserForm.jsx'

// APIs
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

  // --- Queries & Mutations (Logic remains same) ---
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

  const branchNameById = useMemo(() => {
    const map = new Map()
      ; (branchesQuery.data?.items ?? []).forEach((b) => map.set(b.id, b.branch_name))
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

  // --- Premium Table Definition ---
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Administrator',
      render: (r) => {
        const imgUrl = r.pro_image_url || r.image || ''
        const initial = r.name?.charAt(0).toUpperCase() ?? '?'
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-white overflow-hidden">
              {/* Fallback — visible only when no image or image fails */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-700">
                <span className="text-sm font-bold">{initial}</span>
              </div>

              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={r.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.previousSibling.style.display = 'none';
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-900 truncate leading-tight">{r.name}</span>
              <span className="text-[11px] text-zinc-500 font-medium tracking-wide truncate">{r.email}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'branch',
      header: 'Assigned Location',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          <FiMapPin className="text-indigo-500 text-xs" />
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-tighter">
            {branchNameById.get(r.branch_id) ?? 'Main Branch'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'System Status',
      render: () => (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          {isSuperAdmin && (
            <>
              <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, admin: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
              <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r._id || r.id })} hover="hover:text-red-600 hover:bg-red-50" />
            </>
          )}
        </div>
      ),
    },
  ], [branchNameById, isSuperAdmin])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Admins</h1>
            <p className="text-zinc-500 font-medium">Overview of users with administrative privileges.</p>
          </div>
          {isSuperAdmin && (
            <Button
              variant="primary"
              className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
              leftIcon={<FiPlus className="stroke-[3px]" />}
              onClick={() => setModal({ open: true, admin: null })}
            >
              Add Admin
            </Button>
          )}
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Admins" value={filteredRows.length} icon={<FiUsers />} gradient="from-indigo-500 to-blue-500" />
          <StatCard title="Active Role" value={adminRole?.designation || 'Admin'} icon={<FiShield />} gradient="from-purple-500 to-pink-500" />
          <StatCard title="Active branches" value={branchNameById.size} icon={<FiMapPin />} gradient="from-emerald-500 to-teal-500" />
        </div>

        {/* Controls */}
        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, email ..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Premium Table Wrapper */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {usersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r._id || r.id}
                // Important: We add a class to the actual table header in the Table component if possible
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/40 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState title="No Records" description="Adjust filters or add a new admin." />
            )}
          </div>
        </div>
      </div>

      {/* Existing Modals */}
      <Modal open={modal.open} title={modal.admin ? "Modify Admin" : "New Admin"} onClose={() => setModal({ open: false, admin: null })}>
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
        title="Confirm delete ?"
        description="This action will immediately disable the admin's dashboard session."
        danger
        confirmText="Delete"
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

// --- Specialized UI Components ---

function StatCard({ title, value, icon, gradient }) {
  return (
    <div className="group bg-white p-7 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  )
}

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