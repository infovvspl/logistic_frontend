import { useEffect, useState } from 'react'
import { FiCheckCircle, FiFile, FiUpload, FiX } from 'react-icons/fi'
import Select from '../ui/Select.jsx'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm shadow-blue-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
  )
}

function FileUpload({ label, value, onChange }) {
  const hasFile = value instanceof File
  const existingUrl = typeof value === 'string' && value.startsWith('http') ? value : null
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!hasFile) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value, hasFile])

  const previewSrc = preview || existingUrl
  const isPdf = hasFile ? value.type === 'application/pdf' : existingUrl ? /\.pdf($|\?)/i.test(existingUrl) : false
  const hasAny = hasFile || !!existingUrl

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {previewSrc && (
        isPdf ? (
          <a href={previewSrc} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 h-24 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-xs font-semibold text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            Open PDF
          </a>
        ) : (
          <a href={previewSrc} target="_blank" rel="noreferrer">
            <img src={previewSrc} alt={label} className="w-full h-24 object-cover rounded-xl border border-zinc-200 shadow-sm hover:opacity-90 transition-opacity"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </a>
        )
      )}
      <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
        hasAny ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : 'border-dashed border-zinc-300 bg-zinc-50 hover:border-blue-300 hover:bg-blue-50'
      }`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasAny ? 'bg-blue-600' : 'bg-zinc-200'}`}>
          {hasAny ? <FiFile size={13} className="text-white" /> : <FiUpload size={13} className="text-zinc-500" />}
        </div>
        <span className="flex-1 text-xs text-zinc-600 truncate">
          {hasFile ? value.name : existingUrl ? 'File uploaded' : 'Click to upload bill'}
        </span>
        {hasAny && (
          <button type="button" onClick={(e) => { e.preventDefault(); onChange('') }}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-700 shrink-0 px-1">
            <FiX size={13} />
          </button>
        )}
        <input type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f) }} />
      </label>
    </div>
  )
}

export default function PurchaseForm({
  defaultValues,
  onSubmit,
  loading,
  serverError = null,
  products = [],
  suppliers = [],
}) {
  const isEdit = !!defaultValues

  const [form, setForm] = useState({
    product_id:         defaultValues?.product_id         ?? '',
    supplier_id:        defaultValues?.supplier_id        ?? '',
    purchase_price:     defaultValues?.purchase_price     ?? '',
    purchase_bill_file: defaultValues?.purchase_bill_file ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const productOptions = [{ value: '', label: 'Select product...' }, ...products.map((p) => ({ value: p.id, label: p.product_name }))]
  const supplierOptions = [{ value: '', label: 'Select supplier...' }, ...suppliers.map((s) => ({ value: s.id, label: s.supplier_name }))]

  const validate = () => {
    const e = {}
    if (!form.product_id) e.product_id = 'Product is required'
    if (!form.supplier_id) e.supplier_id = 'Supplier is required'
    if (!form.purchase_price || Number(form.purchase_price) <= 0) e.purchase_price = 'Enter a valid price'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">

      <SectionDivider label="Purchase Details" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Select label="Product" options={productOptions}
            value={form.product_id} onChange={(e) => set('product_id', e.target.value)} />
          {errors.product_id && <p className="text-xs text-rose-600 font-medium">{errors.product_id}</p>}
        </div>
        <div className="space-y-1">
          <Select label="Supplier" options={supplierOptions}
            value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)} />
          {errors.supplier_id && <p className="text-xs text-rose-600 font-medium">{errors.supplier_id}</p>}
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Input label="Purchase Price (₹)" type="number" placeholder="15000"
            value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)}
            error={errors.purchase_price} />
        </div>
      </div>

      <SectionDivider label="Bill Document" />
      <FileUpload label="Purchase Bill" value={form.purchase_bill_file} onChange={(v) => set('purchase_bill_file', v)} />

      <div className="flex justify-end pt-3 border-t border-zinc-100">
        {serverError && <p className="flex-1 text-sm text-rose-600 font-medium self-center">⚠ {serverError}</p>}
        <Button type="submit" loading={loading} className="min-w-[160px]" leftIcon={<FiCheckCircle size={16} />}>
          {isEdit ? 'Update Purchase' : 'Create Purchase'}
        </Button>
      </div>
    </form>
  )
}
