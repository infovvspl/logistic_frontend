import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import PlaceForm from '../../components/forms/PlaceForm.jsx'
import * as placeAPI from '../../features/places/placeAPI.js'

export default function Places() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ open: false, place: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const placesQuery = useQuery({ queryKey: ['places'], queryFn: placeAPI.listPlaces })

  const createMutation = useMutation({
    mutationFn: placeAPI.createPlace,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['places'] }); setModal({ open: false, place: null }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => placeAPI.updatePlace(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['places'] }); setModal({ open: false, place: null }) },
  })

  const deleteMutation = useMutation({
    mutationFn: placeAPI.deletePlace,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  })

  const filteredRows = useMemo(() => {
    const rows = placesQuery.data?.items ?? []
    if (!searchTerm) return rows
    return rows.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [placesQuery.data, searchTerm])

  return (
    <div className="space-y-6 max-w-[900px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Places</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage pickup and drop-off locations.</p>
        </div>
        <Button
          variant="primary"
          className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200"
          leftIcon={<FiPlus />}
          onClick={() => setModal({ open: true, place: null })}
        >
          Add Place
        </Button>
      </div>

      {/* Stat */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Places</p>
          <p className="text-2xl font-bold text-zinc-900">{(placesQuery.data?.items ?? []).length}</p>
        </div>
        <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-100">
          <FiMapPin size={20} />
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <input
          type="text"
          placeholder="Search places..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {placesQuery.isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Loading places...</p>
          </div>
        ) : filteredRows.length ? (
          <ul className="divide-y divide-zinc-100">
            {filteredRows.map((place) => (
              <li key={place.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FiMapPin size={16} />
                  </div>
                  <span className="font-medium text-zinc-900">{place.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, place })} className="text-zinc-400 hover:text-blue-600">
                    <FiEdit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm({ open: true, id: place.id })} className="text-zinc-400 hover:text-red-600">
                    <FiTrash2 size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={searchTerm ? 'No results found' : 'No places yet'}
            description={searchTerm ? `No place matches "${searchTerm}"` : 'Add your first place to get started.'}
            actionLabel={!searchTerm ? 'Add Place' : undefined}
            onAction={() => setModal({ open: true, place: null })}
          />
        )}
      </div>

      <Modal
        open={modal.open}
        title={modal.place ? 'Edit Place' : 'Add Place'}
        onClose={() => setModal({ open: false, place: null })}
      >
        <PlaceForm
          defaultValues={modal.place}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (values) => {
            if (modal.place) await updateMutation.mutateAsync({ id: modal.place.id, values })
            else await createMutation.mutateAsync(values)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete place?"
        description="This action cannot be undone."
        danger
        confirmText="Delete"
        loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />
    </div>
  )
}
