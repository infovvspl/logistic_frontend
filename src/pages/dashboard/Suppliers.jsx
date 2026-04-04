import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiUsers } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PageStatCard from '../../components/common/PageStatCard.jsx'
import SupplierForm from '../../components/forms/SupplierForm.jsx'
import * as supplierAPI from '../../features/suppliers/supplierAPI.js'

export default function Suppliers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, supplier: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: supplierAPI.listSuppliers })

  const createMutation = useMutation({
    mutationFn: supplierAPI.createSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal({ open: false, supplier: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => supplierAPI.updateSupplier(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal({ open: false, supplier: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: supplierAPI.deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const allRows = suppliersQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((s) =>
      (s.supplier_name ?? '').toLowerCase().includes(q) ||
      (s.contact_person_name ?? '').toLowerCase().includes(q) ||
      (s.supplier_email ?? '').toLowerCase().includes(q) ||
      (s.supplier_phone ?? '').toLowerCase().includes(q)
    )
  }, [allRows, searchTerm])

  const columns = useMemo(() => [
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
            {(r.supplier_name ?? 'S')[0].toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-900 truncate">{r.supplier_name}</span>
            <span className="text-[11px] text-zinc-400">{r.supplier_email || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-zinc-800">{r.contact_person_name || '—'}</span>
          <span className="text-[11px] text-zinc-400">{r.contact_person_phone || ''}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (r) => <span className="text-xs font-semibold text-zinc-700">{r.supplier_phone || '—'}</span>,
    },
    {
      key: 'gst',
      header: 'GST',
      render: (r) => (
        <span className="text-xs font-mono font-semibold text-zinc-600 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-lg">
          {r.supplier_gst_number || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, supplier: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Suppliers</h1>
            {/* <p className="text-zinc-500 font-medium">Manage your supplier contacts and details.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, supplier: null })}
          >
            Add Supplier
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageStatCard title="Total Suppliers" value={allRows.length} icon={<FiUsers size={20} />} gradient="from-indigo-500 to-blue-500" />
          <PageStatCard title="With GST" value={allRows.filter((s) => s.supplier_gst_number).length} icon={<FiUsers size={20} />} gradient="from-emerald-500 to-teal-500" />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by name, email or phone..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {suppliersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No suppliers yet'}
                description={searchTerm ? `No supplier matches "${searchTerm}"` : 'Add your first supplier.'}
                actionLabel={!searchTerm ? 'Add Supplier' : undefined}
                onAction={() => setModal({ open: true, supplier: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.supplier ? 'Edit Supplier' : 'New Supplier'} onClose={() => setModal({ open: false, supplier: null })}>
        <SupplierForm
          defaultValues={modal.supplier}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.supplier) await updateMutation.mutateAsync({ id: modal.supplier.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete supplier?" description="This supplier will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (
        <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })}
          title="Supplier Details"
          data={{
            'Supplier Name': view.record.supplier_name,
            'Email': view.record.supplier_email,
            'Phone': view.record.supplier_phone,
            'Address': view.record.supplier_address,
            'GST Number': view.record.supplier_gst_number,
            'Contact Person': view.record.contact_person_name,
            'Contact Phone': view.record.contact_person_phone,
          }}
          extraSections={[
            {
              title: 'Bank Details',
              data: {
                'Bank Name': view.record.bank_name,
                'Account Number': view.record.account_no_1,
                'IFSC Code': view.record.ifsc_code,
                'SWIFT Code': view.record.swift_code,
                'Branch': view.record.branch,
              },
            },
          ]}
        />
      )}
    </div>
  )
}

function ActionBtn({ icon, onClick, hover }) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-xl text-zinc-400 transition-all active:scale-90 ${hover}`}>
      <div className="text-lg">{icon}</div>
    </button>
  )
}
