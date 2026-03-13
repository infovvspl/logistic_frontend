import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import VehicleForm from '../../components/forms/VehicleForm.jsx'
import * as vehicleAPI from '../../features/vehicles/vehicleAPI.js'

export default function Vehicles() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleAPI.listVehicles,
  })

  const createMutation = useMutation({
    mutationFn: vehicleAPI.createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: vehicleAPI.deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const rows = vehiclesQuery.data?.items ?? []

  const columns = useMemo(
    () => [
      { key: 'plate', header: 'Plate' },
      { key: 'type', header: 'Type' },
      { key: 'status', header: 'Status' },
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
          <h1 className="text-xl font-semibold">Vehicles</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Track fleet vehicles, plates, and maintenance status.
          </p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
          Add vehicle
        </Button>
      </div>

      {vehiclesQuery.isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading vehicles...
        </div>
      ) : rows.length ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState
          title="No vehicles yet"
          description="Add fleet vehicles to assign drivers and track operations."
          actionLabel="Add vehicle"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Modal open={createOpen} title="New vehicle" onClose={() => setCreateOpen(false)}>
        <VehicleForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove vehicle?"
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
