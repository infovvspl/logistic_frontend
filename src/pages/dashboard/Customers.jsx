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

  const columns = useMemo(() => [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (r) => {
        const initial = r.customer_name?.charAt(0).toUpperCase() || 'C'
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-white overflow-hidden bg-zinc-100">
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                <span className="text-sm font-bold">{initial}</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-900 truncate leading-tight">{r.customer_name || 'N/A'}</span>
              <span className="text-[11px] text-zinc-500 font-medium tracking-wide truncate">{r.customer_email || 'No email'}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'contact_person_name',
      header: 'Contact Person',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-zinc-700">{r.contact_person_name || '—'}</span>
          {r.contact_person_phone && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
              {/* <span className="text-[10px] font-black text-zinc-400">TEL</span> */}
              <span className="text-[11px] font-bold text-zinc-600 tracking-tighter">{r.contact_person_phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer_phone',
      header: 'Phone',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          {/* <span className="text-[10px] font-black text-zinc-400">TEL</span> */}
          <span className="text-xs font-bold text-zinc-700 tracking-tighter">{r.customer_phone || '—'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setEdit({ open: true, customer: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Customers</h1>
            {/* <p className="text-zinc-500 font-medium">Maintain customer records used for assignments and reporting.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-violet-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setCreateOpen(true)}
          >
            Add Customer
          </Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Customers" value={allRows.length} icon={<FiUsers />} gradient="from-violet-500 to-purple-600" />
          <StatCard title="With Phone" value={allRows.filter((c) => c.customer_phone).length} icon={<FiPhone />} gradient="from-blue-500 to-indigo-500" />
          <StatCard title="With Email" value={allRows.filter((c) => c.customer_email).length} icon={<FiMail />} gradient="from-emerald-500 to-teal-500" />
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {customersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table
                columns={columns}
                rows={filteredRows}
                rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-violet-50/40 transition-colors border-b border-zinc-50 last:border-none"
              />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No customers yet'}
                description={searchTerm ? `No customer matches "${searchTerm}"` : 'Create a customer to start managing deliveries.'}
                actionLabel={!searchTerm ? 'Add Customer' : undefined}
                onAction={() => setCreateOpen(true)}
              />
            )}
          </div>
        </div>
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
        title="Remove Customer?"
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
