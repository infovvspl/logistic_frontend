import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiShoppingCart } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import PurchaseForm from '../../components/forms/PurchaseForm.jsx'
import * as purchaseAPI from '../../features/purchase/purchaseAPI.js'
import * as productAPI from '../../features/products/productAPI.js'
import * as supplierAPI from '../../features/suppliers/supplierAPI.js'

export default function Purchase() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, purchase: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const purchasesQuery = useQuery({ queryKey: ['purchases'], queryFn: purchaseAPI.listPurchases })
  const productsQuery  = useQuery({ queryKey: ['products'],  queryFn: productAPI.listProducts })
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: supplierAPI.listSuppliers })

  const createMutation = useMutation({
    mutationFn: purchaseAPI.createPurchase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases'] }); setModal({ open: false, purchase: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => purchaseAPI.updatePurchase(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases'] }); setModal({ open: false, purchase: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: purchaseAPI.deletePurchase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  })

  const products  = productsQuery.data?.items ?? []
  const suppliers = suppliersQuery.data?.items ?? []

  const productById  = useMemo(() => { const m = new Map(); products.forEach((p) => m.set(String(p.id), p)); return m }, [products])
  const supplierById = useMemo(() => { const m = new Map(); suppliers.forEach((s) => m.set(String(s.id), s)); return m }, [suppliers])

  const allRows = purchasesQuery.data?.items ?? []
  const totalSpend = allRows.reduce((s, r) => s + (Number(r.purchase_price) || 0), 0)

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((r) => {
      const product  = productById.get(String(r.product_id))
      const supplier = supplierById.get(String(r.supplier_id))
      return (
        (product?.product_name ?? '').toLowerCase().includes(q) ||
        (supplier?.supplier_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [allRows, searchTerm, productById, supplierById])

  const columns = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      render: (r) => {
        const p = productById.get(String(r.product_id))
        return (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-bold text-zinc-900">{p?.product_name ?? '—'}</span>
          </div>
        )
      },
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => {
        const s = supplierById.get(String(r.supplier_id))
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-zinc-800">{s?.supplier_name ?? '—'}</span>
            <span className="text-[11px] text-zinc-400">{s?.supplier_phone ?? ''}</span>
          </div>
        )
      },
    },
    {
      key: 'price',
      header: 'Purchase Price',
      render: (r) => (
        <span className="text-sm font-black text-zinc-900 tabular-nums">
          ₹{Number(r.purchase_price || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'bill',
      header: 'Bill',
      render: (r) => r.purchase_bill_file ? (
        <a href={r.purchase_bill_file} target="_blank" rel="noreferrer"
          className="text-xs font-semibold text-blue-600 hover:underline">View Bill</a>
      ) : <span className="text-xs text-zinc-400">—</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, purchase: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [productById, supplierById])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Purchase</h1>
            {/* <p className="text-zinc-500 font-medium">Track all product purchases from suppliers.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, purchase: null })}
          >
            New Purchase
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Purchases" value={allRows.length} icon={<FiShoppingCart />} gradient="from-indigo-500 to-blue-500" />
          <StatCard title="Total Spend" value={`₹${totalSpend.toLocaleString('en-IN')}`} icon={<FaRupeeSign />} gradient="from-emerald-500 to-teal-500" />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search by product or supplier..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {purchasesQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No purchases yet'}
                description={searchTerm ? `No purchase matches "${searchTerm}"` : 'Record your first purchase.'}
                actionLabel={!searchTerm ? 'New Purchase' : undefined}
                onAction={() => setModal({ open: true, purchase: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.purchase ? 'Edit Purchase' : 'New Purchase'} onClose={() => setModal({ open: false, purchase: null })}>
        <PurchaseForm
          defaultValues={modal.purchase}
          products={products}
          suppliers={suppliers}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.purchase) await updateMutation.mutateAsync({ id: modal.purchase.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete purchase?" description="This purchase record will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (() => {
        const r = view.record
        const p = productById.get(String(r.product_id))
        const s = supplierById.get(String(r.supplier_id))
        return (
          <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })}
            title="Purchase Details"
            data={{
              'Product': p?.product_name ?? r.product_id,
              'Supplier': s?.supplier_name ?? r.supplier_id,
              'Purchase Price': r.purchase_price ? `₹${Number(r.purchase_price).toLocaleString('en-IN')}` : '—',
              purchase_bill_file: r.purchase_bill_file || '',
            }}
          />
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
