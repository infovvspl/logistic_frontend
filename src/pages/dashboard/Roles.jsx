import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiPlus, FiTrash2, FiShield, FiInfo, FiLayers, FiSearch } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import RoleForm from '../../components/forms/RoleForm.jsx'
import * as roleAPI from '../../features/roles/roleAPI.js'

export default function Roles() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState({ open: false, role: null })
  const [details, setDetails] = useState({ open: false, role: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: roleAPI.listRoles,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: roleAPI.createRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setCreateOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => roleAPI.updateRole(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setEdit({ open: false, role: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: roleAPI.deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })

  const allRoles = rolesQuery.data?.items ?? []
  
  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRoles
    return allRoles.filter(r => 
      r.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allRoles, searchTerm])

  const columns = useMemo(() => [
    { 
      key: 'designation', 
      header: 'Designation Name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <FiShield size={18} />
          </div>
          <span className="font-bold text-zinc-900 tracking-tight">{r.designation}</span>
        </div>
      )
    },
    // {
    //   key: 'id',
    //   header: 'System ID',
    //   render: (r) => <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">{r.id}</code>
    // },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {/* <Button variant="ghost" size="sm" onClick={() => setDetails({ open: true, role: r })} className="text-zinc-500 hover:text-indigo-600">
            <FiInfo size={16} className="mr-1" /> Details
          </Button> */}
          <Button variant="ghost" size="sm" onClick={() => setEdit({ open: true, role: r })} className="text-zinc-500 hover:text-amber-600">
            <FiEdit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: r.id })} className="text-zinc-500 hover:text-red-600">
            <FiTrash2 size={16} />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg">
            <FiLayers size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Access Roles</h1>
            <p className="text-sm text-zinc-500">Define and manage organizational designations.</p>
          </div>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setCreateOpen(true)}
        >
          Create Role
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search designations..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden md:block px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Total: {allRoles.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {rolesQuery.isLoading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-zinc-50 animate-pulse rounded-lg w-full" />
            ))}
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} />
        ) : (
          <EmptyState
            title="No Roles Found"
            description={searchTerm ? "Try a different search term." : "Start by defining the first role for your organization."}
            actionLabel={!searchTerm ? "Create Role" : undefined}
            onAction={() => setCreateOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <Modal open={createOpen} title="Define New Role" onClose={() => setCreateOpen(false)}>
        <RoleForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <Modal open={edit.open} title="Modify Designation" onClose={() => setEdit({ open: false, role: null })}>
        <RoleForm
          defaultValues={edit.role}
          submitLabel="Update Designation"
          loading={updateMutation.isPending}
          onSubmit={async (values) => {
            const id = edit.role?.id
            await updateMutation.mutateAsync({ id, payload: values })
            setEdit({ open: false, role: null })
          }}
        />
      </Modal>

      {/* Details View - Refined grid layout */}
      <Modal
        open={details.open}
        title="Role Specifications"
        onClose={() => setDetails({ open: false, role: null })}
      >
        <div className="space-y-4 p-1">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
            <FiShield className="text-indigo-600" size={32} />
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Active Designation</p>
              <h3 className="text-xl font-black text-zinc-900">{details.role?.designation}</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Internal Reference ID</div>
              <code className="text-zinc-800 font-mono text-xs">{details.role?.id || '—'}</code>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete Role?"
        description="Warning: Deleting a role might affect users currently assigned to it. This action is permanent."
        danger
        confirmText="Permanently Remove"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />
    </div>
  )
}