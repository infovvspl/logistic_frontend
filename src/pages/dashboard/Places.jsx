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

  const allRows = placesQuery.data?.items ?? []

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows
    return allRows.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [allRows, searchTerm])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Places</h1>
            {/* <p className="text-zinc-500 font-medium">Manage pickup and drop-off locations.</p> */}
          </div>
          <Button
            variant="primary"
            className="bg-zinc-900 hover:bg-blue-600 text-white p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all active:scale-95"
            leftIcon={<FiPlus className="stroke-[3px]" />}
            onClick={() => setModal({ open: true, place: null })}
          >
            Add Place
          </Button>
        </header>

        <StatCard title="Total Places" value={allRows.length} icon={<FiMapPin />} gradient="from-blue-500 to-indigo-500" />

        <div className="relative">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search places..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
          {placesQuery.isLoading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : filteredRows.length ? (
            <ul className="divide-y divide-zinc-50">
              {filteredRows.map((place) => (
                <li key={place.id} className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <FiMapPin size={16} />
                    </div>
                    <span className="font-semibold text-zinc-900">{place.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <ActionBtn icon={<FiEdit2 />} onClick={() => setModal({ open: true, place })} hover="hover:text-amber-600 hover:bg-amber-50" />
                    <ActionBtn icon={<FiTrash2 />} onClick={() => setConfirm({ open: true, id: place.id })} hover="hover:text-red-600 hover:bg-red-50" />
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
      </div>

      <Modal open={modal.open} title={modal.place ? 'Edit Place' : 'Add Place'} onClose={() => setModal({ open: false, place: null })}>
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
        open={confirm.open} title="Delete place?" description="This action cannot be undone."
        danger confirmText="Delete" loading={deleteMutation.isPending}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={async () => { await deleteMutation.mutateAsync(confirm.id); setConfirm({ open: false, id: null }) }}
      />
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
