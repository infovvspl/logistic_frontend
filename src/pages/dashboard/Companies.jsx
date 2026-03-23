import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiPlus, FiTrash2, FiEye, FiSearch, FiGlobe, FiGitBranch, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import CompanyForm from '../../components/forms/CompanyForm.jsx'
import BranchForm from '../../components/forms/BranchForm.jsx'
import * as companyAPI from '../../features/companies/companyAPI.js'
import * as branchAPI from '../../features/branches/branchAPI.js'
import { cn } from '../../utils/helpers.js'

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
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

  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: companyAPI.listCompanies })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: branchAPI.listBranches })

  const createMutation = useMutation({
    mutationFn: companyAPI.createCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => companyAPI.updateCompany(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: companyAPI.deleteCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })

  const createBranchMutation = useMutation({
    mutationFn: branchAPI.createBranch,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] })
      await qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, payload }) => branchAPI.updateBranch(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] })
      await qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const deleteBranchMutation = useMutation({
    mutationFn: branchAPI.deleteBranch,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['branches'] })
      await qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const allRows = companiesQuery.data?.items ?? []
  const branches = branchesQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    const q = searchTerm.toLowerCase()
    return allRows.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.gst_no?.toLowerCase().includes(q),
    )
  }, [allRows, searchTerm])

  const branchCountByCompanyId = useMemo(() => {
    const map = new Map()
    for (const b of branches) {
      if (!b?.company_id) continue
      map.set(b.company_id, (map.get(b.company_id) ?? 0) + 1)
    }
    return map
  }, [branches])

  const branchesByCompanyId = useMemo(() => {
    const map = new Map()
    for (const b of branches) {
      if (!b?.company_id) continue
      const list = map.get(b.company_id) ?? []
      list.push(b)
      map.set(b.company_id, list)
    }
    return map
  }, [branches])

  const companyNameById = useMemo(() => {
    const map = new Map()
    for (const c of allRows) map.set(c?.id, c?.name)
    return map
  }, [allRows])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Company',
        render: (r) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              {r.name?.charAt(0) || 'C'}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 leading-tight">{r.name || 'N/A'}</span>
              <span className="text-xs text-zinc-500">{r.email || 'No email'}</span>
            </div>
          </div>
        ),
      },
      { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
      { key: 'gst_no', header: 'GST No', render: (r) => <span className="font-mono text-xs text-zinc-700">{r.gst_no || '—'}</span> },
      {
        key: 'branches',
        header: 'Branches',
        render: (r) => (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700">
            <FiGitBranch size={13} className="text-zinc-400" />
            {branchCountByCompanyId.get(r.id) ?? 0}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setExpandedCompanyId((cur) => (cur === r.id ? null : r.id))}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              title="Toggle branches"
            >
              {expandedCompanyId === r.id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
            </button>
            <button onClick={() => setDetails({ open: true, company: r })} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><FiEye size={15} /></button>
            <button onClick={() => setEdit({ open: true, company: r })} className="p-2 rounded-lg hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"><FiEdit2 size={15} /></button>
            <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
          </div>
        ),
      },
    ],
    [branchCountByCompanyId, expandedCompanyId],
  )

  const branchColumns = useMemo(
    () => [
      { key: 'branch_name', header: 'Branch' },
      { key: 'branch_phone', header: 'Phone' },
      { key: 'branch_email', header: 'Email' },
      { key: 'branch_address', header: 'Address' },
      {
        key: 'actions',
        header: '',
        render: (b) => (
          <div className="flex justify-end gap-1">
            <button onClick={() => setBranchDetails({ open: true, branch: b })} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><FiEye size={14} /></button>
            <button onClick={() => setBranchEdit({ open: true, branch: b })} className="p-2 rounded-lg hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
            <button onClick={() => setBranchConfirm({ open: true, id: b.id })} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
          </div>
        ),
      },
    ],
    [],
  )

  const totalBranches = branches.length

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Companies</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage company records, GST details, and branch structure.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setCreateOpen(true)}
        >
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
        <StatCard label="Total Companies" value={allRows.length} icon={<FiGlobe />} color="blue" />
        <StatCard label="Total Branches" value={totalBranches} icon={<FiGitBranch />} color="emerald" />
        {/* <StatCard label="No. of Branches" value={allRows.length ? (totalBranches) : 0} icon={<FiGitBranch />} color="amber" /> */}
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search by company name, email or GST..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table with expandable branches */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {companiesQuery.isLoading || branchesQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading companies...</p>
          </div>
        ) : filteredRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-4 font-semibold">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredRows.map((row, i) => {
                  const key = row?.id != null ? String(row.id) : `row-${i}`
                  const isExpanded = expandedCompanyId === row?.id
                  const companyBranches = branchesByCompanyId.get(row?.id) ?? []
                  return (
                    <>
                      <tr key={key} className="group hover:bg-zinc-50/60 transition-colors">
                        {columns.map((col) => (
                          <td key={`${key}-${col.key}`} className="whitespace-nowrap px-4 py-3.5 text-zinc-600">
                            {col.render ? col.render(row) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr key={`${key}-branches`}>
                          <td colSpan={columns.length} className="px-6 py-4 bg-zinc-50/60 border-t border-zinc-100">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Branches</span>
                              <Button size="sm" onClick={() => setBranchCreate({ open: true, company: row })}>
                                Add Branch
                              </Button>
                            </div>
                            {companyBranches.length ? (
                              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                                <Table columns={branchColumns} rows={companyBranches} rowKey={(b) => b.id} />
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-400 py-2">No branches for this company.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No companies yet'}
            description={searchTerm ? `No company matches "${searchTerm}"` : 'Create a company to store GST, banking, and other identifiers.'}
            actionLabel={!searchTerm ? 'Add Company' : undefined}
            onAction={() => setCreateOpen(true)}
          />
        )}
      </div>

      {/* Company Modals */}
      <Modal open={createOpen} title="New Company" onClose={() => setCreateOpen(false)}>
        <CompanyForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <Modal open={edit.open} title="Edit Company" onClose={() => setEdit({ open: false, company: null })}>
        <CompanyForm
          defaultValues={edit.company}
          submitLabel="Update"
          loading={updateMutation.isPending}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({ id: edit.company?.id, payload: values })
            setEdit({ open: false, company: null })
          }}
        />
      </Modal>

      <Modal
        open={details.open}
        title={details.company ? `${details.company.name} — Details` : 'Company Details'}
        onClose={() => setDetails({ open: false, company: null })}
      >
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          {[
            ['Name', details.company?.name],
            ['Email', details.company?.email],
            ['Mobile', details.company?.mobile],
            ['GST No', details.company?.gst_no],
            ['CIN No', details.company?.cin_no],
            ['TIN No', details.company?.tin_no],
            ['Account No 1', details.company?.account_no_1],
            ['Account No 2', details.company?.account_no_2],
            ['PAN No', details.company?.pan_no],
            ['Service Tax No', details.company?.service_tax_no],
            ['PF', details.company?.pf],
            ['ESIS', details.company?.esis],
            ['Senior Allowance', details.company?.senior_allowance],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
              <div className="mt-1 text-sm font-medium text-zinc-800">{value ?? '—'}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Branch Modals */}
      <Modal open={branchCreate.open} title="New Branch" onClose={() => setBranchCreate({ open: false, company: null })}>
        <BranchForm
          companyId={branchCreate.company?.id}
          companies={allRows}
          loading={createBranchMutation.isPending}
          submitLabel="Create"
          onSubmit={async (values) => {
            await createBranchMutation.mutateAsync(values)
            setBranchCreate({ open: false, company: null })
          }}
        />
      </Modal>

      <Modal open={branchEdit.open} title="Edit Branch" onClose={() => setBranchEdit({ open: false, branch: null })}>
        <BranchForm
          defaultValues={branchEdit.branch}
          companyId={branchEdit.branch?.company_id}
          companies={allRows}
          loading={updateBranchMutation.isPending}
          submitLabel="Update"
          onSubmit={async (values) => {
            await updateBranchMutation.mutateAsync({ id: branchEdit.branch?.id, payload: values })
            setBranchEdit({ open: false, branch: null })
          }}
        />
      </Modal>

      <Modal
        open={branchDetails.open}
        title={branchDetails.branch ? `${branchDetails.branch.branch_name} — Details` : 'Branch Details'}
        onClose={() => setBranchDetails({ open: false, branch: null })}
      >
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          {[
            ['Branch Name', branchDetails.branch?.branch_name],
            ['Email', branchDetails.branch?.branch_email],
            ['Phone', branchDetails.branch?.branch_phone],
            ['Address', branchDetails.branch?.branch_address],
            ['Company', companyNameById.get(branchDetails.branch?.company_id) ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
              <div className="mt-1 text-sm font-medium text-zinc-800">{value ?? '—'}</div>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove company?"
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

      <ConfirmDialog
        open={branchConfirm.open}
        title="Delete branch?"
        description="This action cannot be undone."
        danger
        confirmText="Delete"
        loading={deleteBranchMutation.isPending}
        onClose={() => setBranchConfirm({ open: false, id: null })}
        onConfirm={async () => {
          await deleteBranchMutation.mutateAsync(branchConfirm.id)
          setBranchConfirm({ open: false, id: null })
        }}
      />
    </div>
  )
}
