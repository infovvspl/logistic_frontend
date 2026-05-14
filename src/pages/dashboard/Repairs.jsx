import { useMemo, useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlus, FiTrash2, FiEdit2, FiEye, FiTool, 
  FiSearch, FiFilter, FiCheck, FiCalendar
} from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import RepairForm from '../../components/forms/RepairForm.jsx'

// APIs
import * as repairAPI from '../../features/repairs/repairAPI.js'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'
import * as userAPI from '../../features/users/userAPI.js'

export default function Repairs() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [modal, setModal] = useState({ open: false, repair: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  useEffect(() => {
    function handler(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // --- Queries ---
  const repairsQuery = useQuery({ queryKey: ['repairs'], queryFn: repairAPI.listRepairs })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehicleAPI.listVehicles })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: userAPI.listUsers })

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: repairAPI.createRepair,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repairs'] }); setModal({ open: false, repair: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => repairAPI.updateRepair(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repairs'] }); setModal({ open: false, repair: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: repairAPI.deleteRepair,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repairs'] }),
  })

  // --- Logic Mappings ---
  const vehicleById = useMemo(() => {
    const map = new Map();
    (vehiclesQuery.data?.items ?? []).forEach((v) => map.set(String(v.id), v))
    return map
  }, [vehiclesQuery.data])

  const userById = useMemo(() => {
    const map = new Map();
    (usersQuery.data?.items ?? []).forEach((u) => map.set(String(u.id), u))
    return map
  }, [usersQuery.data])

  const filteredRows = useMemo(() => {
    let rows = repairsQuery.data?.items ?? []
    
    // Apply search filter
    if (searchTerm) {
      rows = rows.filter(r => 
        r.repair_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.mechanic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.issue_description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply status filter
    if (activeFilter === 'pending') {
      rows = rows.filter(r => r.status === 'pending')
    } else if (activeFilter === 'in_progress') {
      rows = rows.filter(r => r.status === 'in_progress')
    } else if (activeFilter === 'completed') {
      rows = rows.filter(r => r.status === 'completed')
    } else if (activeFilter === 'cancelled') {
      rows = rows.filter(r => r.status === 'cancelled')
    }
    
    return rows
  }, [repairsQuery.data, searchTerm, activeFilter])

  // --- Table Configuration ---
  const columns = useMemo(() => [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (r) => {
        const vehicle = vehicleById.get(String(r.vehicle_id))
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <FiTool size={14} />
            </div>
            <div>
              <span className="font-bold text-zinc-900">{vehicle?.registration_number || '—'}</span>
              <div className="text-xs text-zinc-500">{vehicle?.vehicle_model || ''}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'repair_type',
      header: 'Repair Type',
      render: (r) => (
        <span className="text-sm font-semibold text-zinc-700">{r.repair_type}</span>
      )
    },
    {
      key: 'mechanic',
      header: 'Mechanic',
      render: (r) => (
        <span className="text-sm font-medium text-zinc-700">{r.mechanic_name}</span>
      )
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (r) => (
        <div className="flex items-center gap-1 text-zinc-700">
          <span className="font-semibold">₹{r.repair_cost?.toLocaleString() || '0'}</span>
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (r) => {
        const formatDate = (dateStr) => {
          if (!dateStr) return '—'
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return dateStr
          return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        }
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <FiCalendar size={12} />
              <span>{formatDate(r.repair_start_date)}</span>
            </div>
            {r.repair_end_date && (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <span>→ {formatDate(r.repair_end_date)}</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusColors = {
          pending: 'bg-amber-100 text-amber-700 border-amber-200',
          in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
          completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          cancelled: 'bg-red-100 text-red-700 border-red-200',
        }
        const colorClass = statusColors[r.status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass}`}>
            {r.status.replace('_', ' ')}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, repair: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [vehicleById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Repairs</h1>
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, repair: null })}
          >
            Add New Repair
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <PageStatCard title="Total Repairs" value={repairsQuery.data?.items?.length ?? 0} icon={<FiTool size={20} />} gradient="from-blue-600 to-indigo-600" />
          <PageStatCard title="Pending" value={filteredRows.filter(r => r.status === 'pending').length} icon={<FiCalendar size={20} />} gradient="from-amber-500 to-orange-600" />
          <PageStatCard title="In Progress" value={filteredRows.filter(r => r.status === 'in_progress').length} icon={<FiTool size={20} />} gradient="from-blue-500 to-cyan-600" />
          <PageStatCard title="Completed" value={filteredRows.filter(r => r.status === 'completed').length} icon={<FiCheck size={20} />} gradient="from-emerald-600 to-teal-600" />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
            <input
              type="text"
              placeholder="Search by repair type, mechanic, or issue..."
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
              {activeFilter === 'pending' ? 'Pending' : activeFilter === 'in_progress' ? 'In Progress' : activeFilter === 'completed' ? 'Completed' : activeFilter === 'cancelled' ? 'Cancelled' : 'Filter'}
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
                    { key: 'pending', label: 'Pending Repairs' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'cancelled', label: 'Cancelled' },
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
          {repairsQuery.isLoading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" /></div>
          ) : filteredRows.length ? (
            <Table
              columns={columns}
              rows={filteredRows}
              headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
              rowClassName="group hover:bg-emerald-50/30 transition-colors border-b border-zinc-50 last:border-none"
            />
          ) : (
            <EmptyState title="No Repairs Found" description="Try adjusting your search or add a new repair." />
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      <Modal open={modal.open} size="lg" title={modal.repair ? "Modify Repair" : "Add New Repair"} onClose={() => setModal({ open: false, repair: null })}>
        <RepairForm
          defaultValues={modal.repair}
          vehicles={vehiclesQuery.data?.items ?? []}
          users={usersQuery.data?.items ?? []}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.repair) await updateMutation.mutateAsync({ id: modal.repair.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete Repair?"
        description="This will permanently remove the repair record."
        danger confirmText="Delete Repair" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      <DetailModal
        open={view.open}
        onClose={() => setView({ open: false, record: null })}
        title="Repair Details"
        data={view.record}
        extraSections={[
          ...(view.record?.vehicle_id ? [{
            title: 'Vehicle',
            data: { 
              'Registration': vehicleById.get(String(view.record.vehicle_id))?.registration_number || '—',
              'Model': vehicleById.get(String(view.record.vehicle_id))?.vehicle_model || '—'
            }
          }] : []),
          // ...(view.record?.reported_by ? [{
          //   title: 'Reported By',
          //   data: { 'Name': userById.get(String(view.record.reported_by))?.name || '—' }
          // }] : []),
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
