import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/ui/Input.jsx'
import * as assignmentAPI from '../../features/assignments/assignmentAPI.js'
import { formatDate } from '../../utils/formatDate.js'

function AssignmentForm({ onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { driver: '', vehicle: '', client: '' } })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Driver"
        placeholder="Asha Verma"
        error={errors.driver?.message}
        {...register('driver', { required: 'Driver is required' })}
      />
      <Input
        label="Vehicle"
        placeholder="RST-1042"
        error={errors.vehicle?.message}
        {...register('vehicle', { required: 'Vehicle is required' })}
      />
      <Input
        label="Client"
        placeholder="Northwind"
        error={errors.client?.message}
        {...register('client', { required: 'Client is required' })}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Create
        </Button>
      </div>
    </form>
  )
}

export default function Assignments() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const assignmentsQuery = useQuery({
    queryKey: ['assignments'],
    queryFn: assignmentAPI.listAssignments,
  })

  const createMutation = useMutation({
    mutationFn: assignmentAPI.createAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: assignmentAPI.deleteAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const rows = assignmentsQuery.data?.items ?? []

  const columns = useMemo(
    () => [
      { key: 'driver', header: 'Driver' },
      { key: 'vehicle', header: 'Vehicle' },
      { key: 'client', header: 'Client' },
      { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
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
          <h1 className="text-xl font-semibold">Assignments</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Link drivers, vehicles, and clients for dispatch operations.
          </p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
          New assignment
        </Button>
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading assignments...
        </div>
      ) : rows.length ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState
          title="No assignments yet"
          description="Create an assignment to start tracking dispatch operations."
          actionLabel="New assignment"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Modal open={createOpen} title="New assignment" onClose={() => setCreateOpen(false)}>
        <AssignmentForm
          loading={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
            setCreateOpen(false)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Remove assignment?"
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
