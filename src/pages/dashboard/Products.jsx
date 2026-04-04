import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch, FiPackage, FiAlertTriangle } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DetailModal from '../../components/common/DetailModal.jsx'
import ProductForm from '../../components/forms/ProductForm.jsx'
import * as productAPI from '../../features/products/productAPI.js'

export default function Products() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, product: null })
  const [view, setView] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const productsQuery = useQuery({ queryKey: ['products'], queryFn: productAPI.listProducts })

  const createMutation = useMutation({
    mutationFn: productAPI.createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false, product: null }) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => productAPI.updateProduct(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false, product: null }) },
  })
  const deleteMutation = useMutation({
    mutationFn: productAPI.deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const allRows = productsQuery.data?.items ?? []
  const lowStockCount = allRows.filter((p) => Number(p.stock) <= Number(p.low_stock || 0)).length

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter((p) => (p.product_name ?? '').toLowerCase().includes(q))
  }, [allRows, searchTerm])

  const columns = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      render: (r) => {
        const isLow = Number(r.stock) <= Number(r.low_stock || 0)
        return (
          <div className="flex items-center gap-3 py-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${isLow ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
              <FiPackage size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-zinc-900 truncate">{r.product_name}</span>
              {isLow && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                  <FiAlertTriangle size={10} /> Low stock
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (r) => {
        const isLow = Number(r.stock) <= Number(r.low_stock || 0)
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`text-sm font-black tabular-nums ${isLow ? 'text-rose-600' : 'text-zinc-900'}`}>
              {Number(r.stock ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-zinc-400">units</span>
          </div>
        )
      },
    },
    {
      key: 'low_stock',
      header: 'Low Stock Alert',
      render: (r) => (
        <span className="text-xs font-semibold text-zinc-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
          ≤ {Number(r.low_stock ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn icon={<FiEye />} onClick={() => setView({ open: true, record: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, product: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
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
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Products</h1>
            {/* <p className="text-zinc-500 font-medium">Manage your product inventory and stock levels.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, product: null })}
          >
            Add Product
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Products" value={allRows.length} gradient="from-indigo-500 to-blue-500" icon={<FiPackage />} />
          <StatCard title="Total Stock" value={allRows.reduce((s, p) => s + (Number(p.stock) || 0), 0).toLocaleString('en-IN')} gradient="from-emerald-500 to-teal-500" icon={<FiPackage />} />
          <StatCard title="Low Stock" value={lowStockCount} gradient="from-rose-500 to-red-500" icon={<FiAlertTriangle />} />
        </div>

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input type="text" placeholder="Search products..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {productsQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <Table columns={columns} rows={filteredRows} rowKey={(r) => r.id}
                headerClassName="bg-zinc-900 !text-white uppercase text-[10px] tracking-[0.2em] font-black py-5 px-6"
                rowClassName="group hover:bg-indigo-50/30 transition-colors border-b border-zinc-50 last:border-none" />
            ) : (
              <EmptyState
                title={searchTerm ? 'No results found' : 'No products yet'}
                description={searchTerm ? `No product matches "${searchTerm}"` : 'Add your first product.'}
                actionLabel={!searchTerm ? 'Add Product' : undefined}
                onAction={() => setModal({ open: true, product: null })}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={modal.open} title={modal.product ? 'Edit Product' : 'New Product'} onClose={() => setModal({ open: false, product: null })}>
        <ProductForm
          defaultValues={modal.product}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={createMutation.error?.message ?? updateMutation.error?.message ?? null}
          onSubmit={async (values) => {
            if (modal.product) await updateMutation.mutateAsync({ id: modal.product.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete product?" description="This product will be permanently deleted."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />

      {view.record && (
        <DetailModal open={view.open} onClose={() => setView({ open: false, record: null })}
          title="Product Details"
          data={{
            'Product Name': view.record.product_name,
            'Stock': view.record.stock,
            'Low Stock Alert': view.record.low_stock,
          }}
        />
      )}
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
