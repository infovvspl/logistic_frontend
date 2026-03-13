import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import DriverForm from '../../components/forms/DriverForm.jsx'
import * as driverAPI from '../../features/drivers/driverAPI.js'
import { formatDate } from '../../utils/formatDate.js'

export default function Drivers() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driverAPI.listDrivers,
  })

  const createMutation = useMutation({
    mutationFn: driverAPI.createDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: driverAPI.deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const rows = driversQuery.data?.items ?? []

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'joinedAt', header: 'Joined', render: (r) => formatDate(r.joinedAt) },
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
          <h1 className="text-xl font-semibold">Drivers</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage driver profiles and availability.
          </p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
          Add driver
        </Button>
      </div>

      {driversQuery.isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading drivers...
        </div>
      ) : rows.length ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState
          title="No drivers yet"
          description="Create your first driver profile to start assigning vehicles."
          actionLabel="Add driver"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Modal open={createOpen} title="New driver" onClose={() => setCreateOpen(false)}>
        <DriverForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove driver?"
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
