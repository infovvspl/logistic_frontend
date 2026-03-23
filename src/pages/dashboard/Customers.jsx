import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiPlus, FiTrash2, FiEye, FiSearch, FiUsers, FiPhone, FiMail } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import CustomerForm from '../../components/forms/CustomerForm.jsx'
import * as customerAPI from '../../features/customers/customerAPI.js'

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
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

export default function Customers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState({ open: false, customer: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: customerAPI.listCustomers })

  const createMutation = useMutation({
    mutationFn: customerAPI.createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => customerAPI.updateCustomer(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: customerAPI.deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const allRows = customersQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.customer_email?.toLowerCase().includes(q) ||
        c.customer_phone?.toLowerCase().includes(q),
    )
  }, [allRows, searchTerm])

  const columns = useMemo(
    () => [
      {
        key: 'customer_name',
        header: 'Customer',
        render: (r) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold border border-violet-200">
              {r.customer_name?.charAt(0) || 'C'}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 leading-tight">{r.customer_name || 'N/A'}</span>
              <span className="text-xs text-zinc-500">{r.customer_email || 'No email'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'contact_person_name',
        header: 'Contact Person',
        render: (r) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-800">{r.contact_person_name || '—'}</span>
            <span className="text-xs text-zinc-400">{r.contact_person_phone || ''}</span>
          </div>
        ),
      },
      {
        key: 'customer_phone',
        header: 'Phone',
        render: (r) => (
          <span className="text-sm font-medium text-zinc-700 flex items-center gap-1">
            <span className="text-[10px] bg-zinc-100 px-1 rounded text-zinc-500">TEL</span>
            {r.customer_phone || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <div className="flex justify-end gap-1">
            <button onClick={() => setView({ open: true, record: r })} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><FiEye size={15} /></button>
            <button onClick={() => setEdit({ open: true, customer: r })} className="p-2 rounded-lg hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"><FiEdit2 size={15} /></button>
            <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Maintain customer records used for assignments and reporting.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setCreateOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={allRows.length} icon={<FiUsers />} color="violet" />
        <StatCard label="With Phone" value={allRows.filter((c) => c.customer_phone).length} icon={<FiPhone />} color="blue" />
        <StatCard label="With Email" value={allRows.filter((c) => c.customer_email).length} icon={<FiMail />} color="emerald" />
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {customersQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading customers...</p>
          </div>
        ) : filteredRows.length ? (
          <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id} />
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No customers yet'}
            description={searchTerm ? `No customer matches "${searchTerm}"` : 'Create a customer to start managing deliveries.'}
            actionLabel={!searchTerm ? 'Add Customer' : undefined}
            onAction={() => setCreateOpen(true)}
          />
        )}
      </div>

      <Modal open={createOpen} title="New Customer" onClose={() => setCreateOpen(false)}>
        <CustomerForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <Modal open={edit.open} title="Edit Customer" onClose={() => setEdit({ open: false, customer: null })}>
        <CustomerForm
          defaultValues={edit.customer}
          submitLabel="Update"
          loading={updateMutation.isPending}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({ id: edit.customer?.id, payload: values })
            setEdit({ open: false, customer: null })
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove customer?"
        description="This action cannot be undone."
        danger
        confirmText="Remove"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id)
          setConfirm({ open: false, id: null })
        }}
      />

      <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Customer Details" data={view.record} />
    </div>
  )
}
