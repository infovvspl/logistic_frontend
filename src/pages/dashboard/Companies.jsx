import { useMemo, useState, Fragment } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiTrash2, FiEdit2, FiEye, FiSearch,
  FiGlobe, FiGitBranch, FiChevronDown, FiChevronUp, FiMapPin
} from 'react-icons/fi'

// UI Components
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import CompanyForm from '../../components/forms/CompanyForm.jsx'
import BranchForm from '../../components/forms/BranchForm.jsx'

// APIs
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'

export default function Companies() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState({ open: false, company: null })
  const [details, setDetails] = useState({ open: false, company: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [branchCreate, setBranchCreate] = useState({ open: false, company: null })
  const [branchEdit, setBranchEdit] = useState({ open: false, branch: null })
  const [branchDetails, setBranchDetails] = useState({ open: false, branch: null })
  const [branchConfirm, setBranchConfirm] = useState({ open: false, id: null })
  const [expandedCompanyId, setExpandedCompanyId] = useState(null)

  // --- Queries & Mutations ---
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })

  const createMutation = useMutation({
    mutationFn: companyAPI.createCompany,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setCreateOpen(false); },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => companyAPI.updateCompany(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setEdit({ open: false, company: null }); },
  })

  const deleteMutation = useMutation({
    mutationFn: companyAPI.deleteCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })

  const createBranchMutation = useMutation({
    mutationFn: branchAPI.createBranch,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] });
      await qc.invalidateQueries({ queryKey: ['companies'] });
      setBranchCreate({ open: false, company: null });
    },
  })

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, payload }) => branchAPI.updateBranch(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] });
      await qc.invalidateQueries({ queryKey: ['companies'] });
      setBranchEdit({ open: false, branch: null });
    },
  })

  const deleteBranchMutation = useMutation({
    mutationFn: branchAPI.deleteBranch,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] });
      await qc.invalidateQueries({ queryKey: ['companies'] });
    },
  })

  const allRows = companiesQuery.data?.items ?? []
  const branches = branchesQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q) || 
      c.gst_no?.toLowerCase().includes(q)
    )
  }, [allRows, searchTerm])

  const branchesByCompanyId = useMemo(() => {
    const map = new Map()
    branches.forEach(b => {
      if (!b?.company_id) return
      const list = map.get(b.company_id) ?? []
      list.push(b)
      map.set(b.company_id, list)
    })
    return map
  }, [branches])

  // --- Premium Column Definitions ---
  const companyColumns = useMemo(() => [
    {
      key: 'name',
      header: 'Company Entity',
      render: (r) => {
        const initial = r.name?.charAt(0).toUpperCase() ?? 'C'
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-white overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-700">
                <span className="text-sm font-bold">{initial}</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-900 truncate leading-tight">{r.name}</span>
              <span className="text-[11px] text-zinc-500 font-medium tracking-wide truncate">{r.email || 'No email'}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'gst',
      header: 'GST Number',
      render: (r) => (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 w-fit">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-tighter">
            {r.gst_no || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'branches',
      header: 'No. of Branches',
      render: (r) => {
        const count = (branchesByCompanyId.get(r.id) ?? []).length
        return (
          <div className="flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full ${count > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{count} Branches</span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn 
            icon={expandedCompanyId === r.id ? <FiChevronUp /> : <FiChevronDown />} 
            onClick={() => setExpandedCompanyId(cur => cur === r.id ? null : r.id)}
            hover="hover:text-zinc-900 hover:bg-zinc-100"
          />
          <ActionBtn icon={<FiEye />} onClick={() => setDetails({ open: true, company: r })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
          <ActionBtn icon={<FiEdit2 />} onClick={() => setEdit({ open: true, company: r })} hover="hover:text-amber-600 hover:bg-amber-50" />
          <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: r.id })} hover="hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ], [branchesByCompanyId, expandedCompanyId])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Companies</h1>
            {/* <p className="text-zinc-500 font-medium">Overview of corporate entities and branch networks.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setCreateOpen(true)}
          >
            Register Company
          </Button>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Entities" value={allRows.length} icon={<FiGlobe />} gradient="from-indigo-500 to-blue-500" />
          <StatCard title="Active Branches" value={branches.length} icon={<FiGitBranch />} gradient="from-emerald-500 to-teal-500" />
        </div>

        {/* Search Controls */}
        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, email or tax ID ..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Premium Table Wrapper */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {companiesQuery.isLoading ? (
              <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            ) : filteredRows.length ? (
              <table className="w-full text-left">
                <thead className="bg-zinc-900 text-white uppercase text-[10px] tracking-[0.2em] font-black">
                  <tr>
                    {companyColumns.map(c => <th key={c.key} className="py-5 px-6">{c.header}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredRows.map((row) => {
                    const isExpanded = expandedCompanyId === row.id
                    const companyBranches = branchesByCompanyId.get(row.id) ?? []
                    return (
                      <Fragment key={row.id}>
                        <tr className="group hover:bg-indigo-50/40 transition-colors">
                          {companyColumns.map(col => (
                            <td key={col.key} className="px-6 py-4 text-sm">
                              {col.render ? col.render(row) : row[col.key]}
                            </td>
                          ))}
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={companyColumns.length} className="p-8 bg-zinc-50/80">
                              <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/30">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-900 rounded-xl text-white"><FiGitBranch size={16} /></div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Branch</h3>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className=" text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                                    onClick={() => setBranchCreate({ open: true, company: row })}
                                  >
                                    Add Branch
                                  </Button>
                                </div>
                                <div className="p-4">
                                  {companyBranches.length ? (
                                    <Table 
                                      columns={[
                                        { key: 'branch_name', header: 'Branch' },
                                        { key: 'branch_phone', header: 'Contact' },
                                        { 
                                          key: 'actions', 
                                          header: 'Actions', 
                                          render: (b) => (
                                            <div className="flex justify-end gap-1">
                                              <ActionBtn icon={<FiEye size={14}/>} onClick={() => setBranchDetails({ open: true, branch: b })} hover="hover:text-indigo-600 hover:bg-indigo-50" />
                                              <ActionBtn icon={<FiEdit2 size={14}/>} onClick={() => setBranchEdit({ open: true, branch: b })} hover="hover:text-amber-600 hover:bg-amber-50" />
                                              <ActionBtn icon={<FiTrash2 size={14}/>} onClick={() => setBranchConfirm({ open: true, id: b.id })} hover="hover:text-red-600 hover:bg-red-50" />
                                            </div>
                                          )
                                        }
                                      ]} 
                                      rows={companyBranches} 
                                      rowKey={(b) => b.id}
                                      headerClassName="bg-zinc-900 !text-white text-[9px] tracking-[0.2em] font-black border-none"
                                      rowClassName="group hover:bg-zinc-50/50 transition-colors border-b border-zinc-50"
                                    />
                                  ) : (
                                    <div className="py-10 text-center opacity-30">
                                      <p className="text-xs font-bold uppercase tracking-widest">No branch data available</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No Records" description="Adjust filters or add a new company." />
            )}
          </div>
        </div>
      </div>

      {/* --- Existing Modals & Dialogs --- */}
      <Modal open={createOpen} title="New Company" onClose={() => setCreateOpen(false)}>
        <CompanyForm loading={createMutation.isPending} onSubmit={async (v) => await createMutation.mutateAsync(v)} />
      </Modal>

      <Modal open={edit.open} title="Modify Company" onClose={() => setEdit({ open: false, company: null })}>
        <CompanyForm defaultValues={edit.company} submitLabel="Update" loading={updateMutation.isPending} onSubmit={async (v) => await updateMutation.mutateAsync({ id: edit.company?.id, payload: v })} />
      </Modal>

      <Modal open={details.open} title="Company Details" onClose={() => setDetails({ open: false, company: null })}>
        {details.company && (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1 -mr-1">

            {/* Identity section */}
            <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-white/60" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Company Info</span>
              </div>
              <div className="px-4">
                {[
                  ['Entity Name', details.company.name],
                  ['Official Email', details.company.email],
                  ['Contact', details.company.mobile],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                    <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Registration */}
            <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-white/60" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Tax & Registration</span>
              </div>
              <div className="px-4">
                {[
                  ['GST Number', details.company.gst_no],
                  ['CIN Number', details.company.cin_no],
                  ['TIN Number', details.company.tin_no],
                  ['PAN Number', details.company.pan_no],
                  ['Service Tax No', details.company.service_tax_no],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                    <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-white/60" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Compliance</span>
              </div>
              <div className="px-4">
                {[
                  ['PF Code', details.company.pf],
                  ['ESIS', details.company.esis],
                  ['ESI', details.company.esi],
                  ['Senior Allowance', details.company.senior_allowance != null ? `₹${Number(details.company.senior_allowance).toLocaleString('en-IN')}` : null],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                    <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Account 1 */}
            <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-white/60" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Bank Account 1</span>
              </div>
              <div className="px-4">
                {[
                  ['Account No', details.company.account_no_1],
                  ['Bank Name', details.company.bank_name],
                  ['IFSC Code', details.company.ifsc_code],
                  ['SWIFT Code', details.company.swift_code],
                  ['Branch', details.company.branch],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                    <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Account 2 */}
            <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-white/60" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Bank Account 2</span>
              </div>
              <div className="px-4">
                {[
                  ['Account No', details.company.account_no_2],
                  ['Bank Name', details.company.bank_name_2],
                  ['IFSC Code', details.company.ifsc_code_2],
                  ['SWIFT Code', details.company.swift_code_2],
                  ['Branch', details.company.branch_2],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                    <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Branch Modals */}
      <Modal open={branchCreate.open} title="New Branch" onClose={() => setBranchCreate({ open: false, company: null })}>
        <BranchForm companyId={branchCreate.company?.id} companies={allRows} loading={createBranchMutation.isPending} onSubmit={async (v) => await createBranchMutation.mutateAsync(v)} />
      </Modal>

      <Modal open={branchEdit.open} title="Modify Branch" onClose={() => setBranchEdit({ open: false, branch: null })}>
        <BranchForm defaultValues={branchEdit.branch} companyId={branchEdit.branch?.company_id} companies={allRows} loading={updateBranchMutation.isPending} onSubmit={async (v) => await updateBranchMutation.mutateAsync({ id: branchEdit.branch?.id, payload: v })} />
      </Modal>

      <Modal open={branchDetails.open} title="Branch Details" onClose={() => setBranchDetails({ open: false, branch: null })}>
        {branchDetails.branch && (
          <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-white/60" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Branch Info</span>
            </div>
            <div className="px-4">
              {[
                ['Branch Name', branchDetails.branch.branch_name],
                ['Email', branchDetails.branch.branch_email],
                ['Phone', branchDetails.branch.branch_phone],
                ['Address', branchDetails.branch.branch_address],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 w-36 pt-0.5">{l}</span>
                  <span className="text-sm font-semibold text-zinc-700 text-right break-words">{v ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm.open} title="Delete Entity?" description="This action will remove the company and all associated branch records." danger confirmText="Confirm Deletion"
        loading={deleteMutation.isPending} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }); }}
      />

      <ConfirmDialog
        open={branchConfirm.open} title="Remove Branch?" description="Are you sure you want to delete this branch office?" danger confirmText="Confirm"
        loading={deleteBranchMutation.isPending} onClose={() => setBranchConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteBranchMutation.mutateAsync(branchConfirm.id); setBranchConfirm({ open: false, id: null }); }}
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
      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg`}>{icon}</div>
    </div>
  )
}

function ActionBtn({ icon, onClick, hover }) {
  return (
    <button onClick={onClick} className={`p-2 rounded-xl text-zinc-400 transition-all active:scale-90 ${hover}`}>
      <div className="text-lg">{icon}</div>
    </button>
  )
}