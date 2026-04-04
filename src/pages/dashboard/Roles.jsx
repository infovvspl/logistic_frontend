import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiPlus, FiTrash2, FiShield, FiInfo, FiLayers, FiSearch } from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import RoleForm from '../../components/forms/RoleForm.jsx'

// APIs
import * as roleAPI from '../../features/roles/roleAPI.js'

export default function Roles() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState({ open: false, role: null })
  const [details, setDetails] = useState({ open: false, role: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  // --- Queries & Mutations ---
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: roleAPI.listRoles,
  })

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

  // --- Premium Table Definition ---
  const columns = useMemo(() => [
    { 
      key: 'designation', 
      header: 'Designation Name',
      render: (r) => (
        <div className="flex items-center gap-4 py-1">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
            <FiShield size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 tracking-tight text-base">{r.designation}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Internal Role</span>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn 
            icon={<FiEdit2 />} 
            onClick={() => setEdit({ open: true, role: r })} 
            hover="hover:text-amber-600 hover:bg-amber-50" 
          />
          <ActionBtn 
            icon={<FiTrash2 />} 
            onClick={() => setConfirm({ open: true, id: r.id })} 
            hover="hover:text-red-600 hover:bg-red-50" 
          />
        </div>
      ),
    },
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Access Roles</h1>
            {/* <p className="text-zinc-500 font-medium">Define and manage organizational designations.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Role
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <StatCard 
            title="Total Roles Defined" 
            value={allRoles.length} 
            icon={<FiLayers />} 
            gradient="from-indigo-600 to-violet-600" 
          />
        </div>

        {/* Controls */}
        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search designations..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Premium Table Wrapper */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {rolesQuery.isLoading ? (
              <div className="p-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/40 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState 
                title="No Roles Found" 
                description="Start by defining the first role for your organization." 
              />
            )}
          </div>
        </div>
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

      {/* Refined Details View */}
      <Modal
        open={details.open}
        title="Role Specifications"
        onClose={() => setDetails({ open: false, role: null })}
      >
        <div className="space-y-4 p-1">
          <div className="p-6 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-600">
                <FiShield size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active Designation</p>
              <h3 className="text-2xl font-black text-zinc-900">{details.role?.designation}</h3>
            </div>
          </div>
          
          <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50/50 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Internal Reference ID</div>
            <code className="text-zinc-800 font-mono text-sm bg-white px-3 py-1 rounded-lg border border-zinc-200 inline-block">
                {details.role?.id || '—'}
            </code>
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