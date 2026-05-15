import { useMemo, useState } from 'react'
import { FiDownload, FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm shadow-blue-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
    </div>
  )
}

const TAX_SCH_OPTIONS = [
  { value: 'GST', label: 'GST' },
]

const SUP_TYP_OPTIONS = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: 'SEZWP', label: 'SEZWP' },
  { value: 'SEZWOP', label: 'SEZWOP' },
  { value: 'EXPWP', label: 'EXPWP' },
  { value: 'EXPWOP', label: 'EXPWOP' },
  { value: 'DEXP', label: 'DEXP' },
]

const YES_NO = [
  { value: 'N', label: 'No' },
  { value: 'Y', label: 'Yes' },
]

const DOC_TYPE_OPTIONS = [
  { value: 'INV', label: 'INV' },
  { value: 'CRN', label: 'CRN' },
  { value: 'DBN', label: 'DBN' },
]

const UNIT_OPTIONS = [
  { value: 'OTH', label: 'OTH' },
  { value: 'NOS', label: 'NOS' },
  { value: 'KGS', label: 'KGS' },
  { value: 'MTR', label: 'MTR' },
  { value: 'LTR', label: 'LTR' },
]

function emptyItem(itemNo) {
  return {
    ItemNo: itemNo,
    SlNo: String(itemNo),
    IsServc: 'Y',
    PrdDesc: '',
    HsnCd: '',
    Qty: '1',
    FreeQty: '0',
    Unit: 'OTH',
    UnitPrice: '',
    TotAmt: '',
    Discount: '0',
    PreTaxVal: '0',
    AssAmt: '',
    GstRt: '18',
    IgstAmt: '0',
    CgstAmt: '',
    SgstAmt: '',
    CesRt: '0',
    CesAmt: '0',
    CesNonAdvlAmt: '0',
    StateCesRt: '0',
    StateCesAmt: '0',
    StateCesNonAdvlAmt: '0',
    OthChrg: '0',
    TotItemVal: '',
  }
}

const NUM_FIELDS_ROOT = new Set(['Pin'])
const NUM_FIELDS_VAL = new Set([
  'AssVal', 'CgstVal', 'SgstVal', 'IgstVal', 'CesVal', 'StCesVal',
  'Discount', 'OthChrg', 'RndOffAmt', 'TotInvVal',
])
const NUM_FIELDS_ITEM = new Set([
  'ItemNo', 'Qty', 'FreeQty', 'UnitPrice', 'TotAmt', 'Discount', 'PreTaxVal', 'AssAmt',
  'GstRt', 'IgstAmt', 'CgstAmt', 'SgstAmt',
  'CesRt', 'CesAmt', 'CesNonAdvlAmt',
  'StateCesRt', 'StateCesAmt', 'StateCesNonAdvlAmt',
  'OthChrg', 'TotItemVal',
])

function toNumberOrString(v) {
  if (v === '' || v === null || v === undefined) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : v
}

function coerceObjectNumbers(obj, numericFields) {
  const out = { ...obj }
  numericFields.forEach((k) => {
    if (!(k in out)) return
    out[k] = toNumberOrString(out[k])
  })
  return out
}

export default function JsonBuilder() {
  const [form, setForm] = useState({
    Version: '1.1',
    TranDtls: { TaxSch: 'GST', SupTyp: 'B2B', RegRev: 'N', IgstOnIntra: 'N' },
    DocDtls: { Typ: 'INV', No: '', Dt: '' },
    SellerDtls: { Gstin: '', LglNm: '', Addr1: '', Loc: '', Pin: '', Stcd: '' },
    BuyerDtls: { Gstin: '', LglNm: '', Pos: '', Addr1: '', Loc: '', Pin: '', Stcd: '' },
    DispDtls: { Nm: '', Addr1: '', Loc: '', Pin: '', Stcd: '' },
    ShipDtls: { Gstin: '', LglNm: '', Addr1: '', Loc: '', Pin: '', Stcd: '' },
    ValDtls: {
      AssVal: '', CgstVal: '', SgstVal: '', IgstVal: '',
      CesVal: '', StCesVal: '', Discount: '', OthChrg: '',
      RndOffAmt: '', TotInvVal: '',
    },
  })

  const [items, setItems] = useState([emptyItem(1)])
  const [jsonPreview, setJsonPreview] = useState('')

  const setNested = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
  }

  const setDeep = (section, key, value) => {
    setForm((prev) => ({ ...prev, [section]: value }))
  }

  const computedJson = useMemo(() => {
    const doc = {
      ...form,
      SellerDtls: coerceObjectNumbers(form.SellerDtls, NUM_FIELDS_ROOT),
      BuyerDtls: coerceObjectNumbers(form.BuyerDtls, NUM_FIELDS_ROOT),
      DispDtls: coerceObjectNumbers(form.DispDtls, NUM_FIELDS_ROOT),
      ShipDtls: coerceObjectNumbers(form.ShipDtls, NUM_FIELDS_ROOT),
      ItemList: items.map((it) => coerceObjectNumbers(it, NUM_FIELDS_ITEM)),
      ValDtls: coerceObjectNumbers(form.ValDtls, NUM_FIELDS_VAL),
    }
    return [doc]
  }, [form, items])

  const downloadJson = () => {
    const content = JSON.stringify(computedJson, null, 2)
    setJsonPreview(content)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeNo = (form.DocDtls?.No || 'invoice').toString().replace(/[^\w.-]+/g, '_')
    const safeDt = (form.DocDtls?.Dt || '').toString().replace(/[^\d-]+/g, '')
    a.href = url
    a.download = `einvoice_${safeNo}${safeDt ? `_${safeDt}` : ''}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">JSON Builder</h1>
          <p className="text-zinc-500 font-medium mt-2">Fill all fields manually, add items, then download the JSON.</p>
        </div>
        <Button variant="primary" onClick={downloadJson} leftIcon={<FiDownload />}>
          Create JSON
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl p-6 space-y-5">
        <SectionDivider label="Header" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Version" value={form.Version} onChange={(e) => setDeep('Version', e.target.value)} />
          <Select
            label="Tax Scheme"
            value={form.TranDtls.TaxSch}
            options={TAX_SCH_OPTIONS}
            onChange={(e) => setNested('TranDtls', 'TaxSch', e.target.value)}
          />
          <Select
            label="Supply Type"
            value={form.TranDtls.SupTyp}
            options={SUP_TYP_OPTIONS}
            onChange={(e) => setNested('TranDtls', 'SupTyp', e.target.value)}
          />
          <Select
            label="Reverse Charge (RegRev)"
            value={form.TranDtls.RegRev}
            options={YES_NO}
            onChange={(e) => setNested('TranDtls', 'RegRev', e.target.value)}
          />
          <Select
            label="IGST on Intra (IgstOnIntra)"
            value={form.TranDtls.IgstOnIntra}
            options={YES_NO}
            onChange={(e) => setNested('TranDtls', 'IgstOnIntra', e.target.value)}
          />
        </div>

        <SectionDivider label="Document Details" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Doc Type"
            value={form.DocDtls.Typ}
            options={DOC_TYPE_OPTIONS}
            onChange={(e) => setNested('DocDtls', 'Typ', e.target.value)}
          />
          <Input label="Doc No" value={form.DocDtls.No} onChange={(e) => setNested('DocDtls', 'No', e.target.value)} />
          <Input label="Doc Date (DD-MM-YYYY)" placeholder="30-04-2025" value={form.DocDtls.Dt} onChange={(e) => setNested('DocDtls', 'Dt', e.target.value)} />
        </div>

        <SectionDivider label="Seller Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Gstin" value={form.SellerDtls.Gstin} onChange={(e) => setNested('SellerDtls', 'Gstin', e.target.value)} />
          <Input label="LglNm" value={form.SellerDtls.LglNm} onChange={(e) => setNested('SellerDtls', 'LglNm', e.target.value)} />
          <Input className="sm:col-span-2" label="Addr1" value={form.SellerDtls.Addr1} onChange={(e) => setNested('SellerDtls', 'Addr1', e.target.value)} />
          <Input label="Loc" value={form.SellerDtls.Loc} onChange={(e) => setNested('SellerDtls', 'Loc', e.target.value)} />
          <Input label="Pin" inputMode="numeric" value={form.SellerDtls.Pin} onChange={(e) => setNested('SellerDtls', 'Pin', e.target.value)} />
          <Input label="Stcd" value={form.SellerDtls.Stcd} onChange={(e) => setNested('SellerDtls', 'Stcd', e.target.value)} />
        </div>

        <SectionDivider label="Buyer Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Gstin" value={form.BuyerDtls.Gstin} onChange={(e) => setNested('BuyerDtls', 'Gstin', e.target.value)} />
          <Input label="LglNm" value={form.BuyerDtls.LglNm} onChange={(e) => setNested('BuyerDtls', 'LglNm', e.target.value)} />
          <Input label="Pos" value={form.BuyerDtls.Pos} onChange={(e) => setNested('BuyerDtls', 'Pos', e.target.value)} />
          <Input className="sm:col-span-2" label="Addr1" value={form.BuyerDtls.Addr1} onChange={(e) => setNested('BuyerDtls', 'Addr1', e.target.value)} />
          <Input label="Loc" value={form.BuyerDtls.Loc} onChange={(e) => setNested('BuyerDtls', 'Loc', e.target.value)} />
          <Input label="Pin" inputMode="numeric" value={form.BuyerDtls.Pin} onChange={(e) => setNested('BuyerDtls', 'Pin', e.target.value)} />
          <Input label="Stcd" value={form.BuyerDtls.Stcd} onChange={(e) => setNested('BuyerDtls', 'Stcd', e.target.value)} />
        </div>

        <SectionDivider label="Dispatch Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nm" value={form.DispDtls.Nm} onChange={(e) => setNested('DispDtls', 'Nm', e.target.value)} />
          <Input className="sm:col-span-2" label="Addr1" value={form.DispDtls.Addr1} onChange={(e) => setNested('DispDtls', 'Addr1', e.target.value)} />
          <Input label="Loc" value={form.DispDtls.Loc} onChange={(e) => setNested('DispDtls', 'Loc', e.target.value)} />
          <Input label="Pin" inputMode="numeric" value={form.DispDtls.Pin} onChange={(e) => setNested('DispDtls', 'Pin', e.target.value)} />
          <Input label="Stcd" value={form.DispDtls.Stcd} onChange={(e) => setNested('DispDtls', 'Stcd', e.target.value)} />
        </div>

        <SectionDivider label="Ship Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Gstin" value={form.ShipDtls.Gstin} onChange={(e) => setNested('ShipDtls', 'Gstin', e.target.value)} />
          <Input label="LglNm" value={form.ShipDtls.LglNm} onChange={(e) => setNested('ShipDtls', 'LglNm', e.target.value)} />
          <Input className="sm:col-span-2" label="Addr1" value={form.ShipDtls.Addr1} onChange={(e) => setNested('ShipDtls', 'Addr1', e.target.value)} />
          <Input label="Loc" value={form.ShipDtls.Loc} onChange={(e) => setNested('ShipDtls', 'Loc', e.target.value)} />
          <Input label="Pin" inputMode="numeric" value={form.ShipDtls.Pin} onChange={(e) => setNested('ShipDtls', 'Pin', e.target.value)} />
          <Input label="Stcd" value={form.ShipDtls.Stcd} onChange={(e) => setNested('ShipDtls', 'Stcd', e.target.value)} />
        </div>

        <SectionDivider label="Items" />
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-600 font-medium">ItemList</div>
            <Button
              type="button"
              variant="ghost"
              leftIcon={<FiPlus size={16} />}
              onClick={() => setItems((prev) => [...prev, emptyItem(prev.length + 1)])}
            >
              Add Item
            </Button>
          </div>

          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-zinc-900">Item #{idx + 1}</div>
                <Button
                  type="button"
                  variant="danger"
                  leftIcon={<FiTrash2 size={16} />}
                  disabled={items.length === 1}
                  onClick={() => {
                    setItems((prev) => prev.filter((_, i) => i !== idx).map((x, i) => ({ ...x, ItemNo: i + 1, SlNo: String(i + 1) })))
                  }}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input label="ItemNo" inputMode="numeric" value={it.ItemNo} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, ItemNo: v } : x))
                }} />
                <Input label="SlNo" value={it.SlNo} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, SlNo: v } : x))
                }} />
                <Select label="IsServc" value={it.IsServc} options={YES_NO} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, IsServc: v } : x))
                }} />
                <Select label="Unit" value={it.Unit} options={UNIT_OPTIONS} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, Unit: v } : x))
                }} />

                <Input className="sm:col-span-2 lg:col-span-4" label="PrdDesc" value={it.PrdDesc} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, PrdDesc: v } : x))
                }} />

                <Input label="HsnCd" value={it.HsnCd} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, HsnCd: v } : x))
                }} />
                <Input label="Qty" inputMode="decimal" value={it.Qty} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, Qty: v } : x))
                }} />
                <Input label="FreeQty" inputMode="decimal" value={it.FreeQty} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, FreeQty: v } : x))
                }} />
                <Input label="UnitPrice" inputMode="decimal" value={it.UnitPrice} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, UnitPrice: v } : x))
                }} />

                <Input label="TotAmt" inputMode="decimal" value={it.TotAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, TotAmt: v } : x))
                }} />
                <Input label="Discount" inputMode="decimal" value={it.Discount} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, Discount: v } : x))
                }} />
                <Input label="PreTaxVal" inputMode="decimal" value={it.PreTaxVal} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, PreTaxVal: v } : x))
                }} />
                <Input label="AssAmt" inputMode="decimal" value={it.AssAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, AssAmt: v } : x))
                }} />

                <Input label="GstRt" inputMode="decimal" value={it.GstRt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, GstRt: v } : x))
                }} />
                <Input label="IgstAmt" inputMode="decimal" value={it.IgstAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, IgstAmt: v } : x))
                }} />
                <Input label="CgstAmt" inputMode="decimal" value={it.CgstAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, CgstAmt: v } : x))
                }} />
                <Input label="SgstAmt" inputMode="decimal" value={it.SgstAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, SgstAmt: v } : x))
                }} />

                <Input label="CesRt" inputMode="decimal" value={it.CesRt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, CesRt: v } : x))
                }} />
                <Input label="CesAmt" inputMode="decimal" value={it.CesAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, CesAmt: v } : x))
                }} />
                <Input label="CesNonAdvlAmt" inputMode="decimal" value={it.CesNonAdvlAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, CesNonAdvlAmt: v } : x))
                }} />
                <Input label="OthChrg" inputMode="decimal" value={it.OthChrg} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, OthChrg: v } : x))
                }} />

                <Input label="StateCesRt" inputMode="decimal" value={it.StateCesRt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, StateCesRt: v } : x))
                }} />
                <Input label="StateCesAmt" inputMode="decimal" value={it.StateCesAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, StateCesAmt: v } : x))
                }} />
                <Input label="StateCesNonAdvlAmt" inputMode="decimal" value={it.StateCesNonAdvlAmt} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, StateCesNonAdvlAmt: v } : x))
                }} />
                <Input label="TotItemVal" inputMode="decimal" value={it.TotItemVal} onChange={(e) => {
                  const v = e.target.value
                  setItems((prev) => prev.map((x, i) => i === idx ? { ...x, TotItemVal: v } : x))
                }} />
              </div>
            </div>
          ))}
        </div>

        <SectionDivider label="Value Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="AssVal" inputMode="decimal" value={form.ValDtls.AssVal} onChange={(e) => setNested('ValDtls', 'AssVal', e.target.value)} />
          <Input label="CgstVal" inputMode="decimal" value={form.ValDtls.CgstVal} onChange={(e) => setNested('ValDtls', 'CgstVal', e.target.value)} />
          <Input label="SgstVal" inputMode="decimal" value={form.ValDtls.SgstVal} onChange={(e) => setNested('ValDtls', 'SgstVal', e.target.value)} />
          <Input label="IgstVal" inputMode="decimal" value={form.ValDtls.IgstVal} onChange={(e) => setNested('ValDtls', 'IgstVal', e.target.value)} />
          <Input label="CesVal" inputMode="decimal" value={form.ValDtls.CesVal} onChange={(e) => setNested('ValDtls', 'CesVal', e.target.value)} />
          <Input label="StCesVal" inputMode="decimal" value={form.ValDtls.StCesVal} onChange={(e) => setNested('ValDtls', 'StCesVal', e.target.value)} />
          <Input label="Discount" inputMode="decimal" value={form.ValDtls.Discount} onChange={(e) => setNested('ValDtls', 'Discount', e.target.value)} />
          <Input label="OthChrg" inputMode="decimal" value={form.ValDtls.OthChrg} onChange={(e) => setNested('ValDtls', 'OthChrg', e.target.value)} />
          <Input label="RndOffAmt" inputMode="decimal" value={form.ValDtls.RndOffAmt} onChange={(e) => setNested('ValDtls', 'RndOffAmt', e.target.value)} />
          <Input label="TotInvVal" inputMode="decimal" value={form.ValDtls.TotInvVal} onChange={(e) => setNested('ValDtls', 'TotInvVal', e.target.value)} />
        </div>
      </div>

      {/* <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-zinc-900">Preview</div>
            <div className="text-xs text-zinc-500">Click “Create JSON” to refresh preview and download the file.</div>
          </div>
          <Button variant="ghost" onClick={() => setJsonPreview(JSON.stringify(computedJson, null, 2))}>
            Refresh Preview
          </Button>
        </div>
        <textarea
          className="w-full min-h-[260px] rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          value={jsonPreview || JSON.stringify(computedJson, null, 2)}
          readOnly
        />
      </div> */}
    </div>
  )
}

