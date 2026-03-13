import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import ClientForm from '../../components/forms/ClientForm.jsx'
import * as clientAPI from '../../features/clients/clientAPI.js'

export default function Clients() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: clientAPI.listClients,
  })

  const createMutation = useMutation({
    mutationFn: clientAPI.createClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: clientAPI.deleteClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const rows = clientsQuery.data?.items ?? []

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Client' },
      { key: 'contact', header: 'Contact' },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setConfirm({ open: true, id: r.id })}
              leftIcon={<FiTrash2 />}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Maintain client records used for assignments and reporting.
          </p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
          Add client
        </Button>
      </div>

      {clientsQuery.isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading clients...
        </div>
      ) : rows.length ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState
          title="No clients yet"
          description="Create a client to start managing deliveries and assignments."
          actionLabel="Add client"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Modal open={createOpen} title="New client" onClose={() => setCreateOpen(false)}>
        <ClientForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove client?"
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
    </div>
  )
}
