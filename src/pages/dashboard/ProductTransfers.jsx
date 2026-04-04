import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiArrowRight } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import ProductTransferForm from '../../components/forms/ProductTransferForm.jsx'
import * as transferAPI from '../../features/productTransfers/productTransferAPI.js'
import * as productAPI from '../../features/products/productAPI.js'
import * as userAPI from '../../features/users/userAPI.js'

export default function ProductTransfers() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, record: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const transfersQuery = useQuery({ queryKey: ['product-transfers'], queryFn: transferAPI.listProductTransfers })
  const productsQuery  = useQuery({ queryKey: ['products'],          queryFn: productAPI.listProducts })
  const usersQuery     = useQuery({ queryKey: ['users'],             queryFn: userAPI.listUsers })

  const createMutation = useMutation({
    mutationFn: transferAPI.createProductTransfer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-transfers'] }); setModal({ open: false, record: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => transferAPI.updateProductTransfer(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-transfers'] }); setModal({ open: false, record: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: transferAPI.deleteProductTransfer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-transfers'] }),
  })

  const products = productsQuery.data?.items ?? []
  const users    = usersQuery.data?.items ?? []

  const productById = useMemo(() => { const m = new Map(); products.forEach((p) => m.set(String(p.id), p)); return m }, [products])
  const userById    = useMemo(() => { const m = new Map(); users.forEach((u) => m.set(String(u.id), u)); return m }, [users])

  const userName = (id) => { const u = userById.get(String(id)); return u?.name || u?.email || id || '—' }

  const allRows = transfersQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => {
      const p = productById.get(String(r.product_id))
      return (
        (p?.product_name ?? '').toLowerCase().includes(q) ||
        userName(r.given_from).toLowerCase().includes(q) ||
        userName(r.given_to).toLowerCase().includes(q)
      )
    })
  }, [allRows, searchTerm, productById, userById])

  const columns = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      render: (r) => {
        const p = productById.get(String(r.product_id))
        return (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-bold text-zinc-900">{p?.product_name ?? '—'}</span>
            <span className="text-[11px] text-zinc-400">{r.quantity} {r.unit || 'units'}</span>
          </div>
        )
      },
    },
    {
      key: 'transfer',
      header: 'Transfer',
      render: (r) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
          <span className="bg-zinc-100 px-2 py-1 rounded-lg">{userName(r.given_from)}</span>
          <FiArrowRight size={12} className="text-blue-500 shrink-0" />
          <span className="bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg text-blue-700">{userName(r.given_to)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, record: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [productById, userById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Product Transfers</h1>
            {/* <p className="text-zinc-500 font-medium">Track product transfers between users.</p> */}
          </div>
          <Button variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, record: null })}>
            New Transfer
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Transfers" value={allRows.length} gradient="from-indigo-500 to-blue-500" icon={<FiArrowRight />} />
          <StatCard title="Products Involved" value={new Set(allRows.map((r) => r.product_id)).size} gradient="from-emerald-500 to-teal-500" icon={<FiArrowRight />} />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by product or user..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {transfersQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState title={searchTerm ? 'No results' : 'No transfers yet'} description="Record the first product transfer."
                actionLabel={!searchTerm ? 'New Transfer' : undefined} onAction={() => setModal({ open: true, record: null })} />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.record ? 'Edit Transfer' : 'New Transfer'} onClose={() => setModal({ open: false, record: null })}>
        <ProductTransferForm defaultValues={modal.record} products={products} users={users}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (v) => {
            if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, values: v })
            else await createMutation.mutateAsync(v)
          }} />
      </Modal>

      <ConfirmDialog open={confirm.open} title="Delete transfer?" description="This transfer record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }} />

      {view.record && (() => {
        const r = view.record
        const p = productById.get(String(r.product_id))
        return (
          <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })} title="Transfer Details"
            data={{
              'Product': p?.product_name ?? r.product_id,
              'Quantity': `${r.quantity} ${r.unit || ''}`.trim(),
              'Given From': userName(r.given_from),
              'Given To': userName(r.given_to),
            }} />
        )
      })()}
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
      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg`}>{icon}</div>
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
