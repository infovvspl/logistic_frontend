import { useState, useMemo } from 'react'
import { FiSearch, FiUser } from 'react-icons/fi'
import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'

function PersonPicker({ label, people, selectedId, onSelect, onClear, placeholder }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    people.filter(p =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.mobile || '').includes(search)
    ), [people, search])

  const selected = people.find(p => String(p.id) === String(selectedId))

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-800">{label}</label>

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <div className="flex items-center gap-2 font-medium">
            <FiUser size={14} />
            <span>{selected.name} {selected.mobile ? `(${selected.mobile})` : ''}</span>
          </div>
          <button type="button" className="text-xs font-semibold hover:underline" onClick={onClear}>
            Change
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                  onClick={() => { onSelect(p.id); setSearch('') }}
                >
                  <span className="text-sm font-medium text-zinc-900">{p.name}</span>
                  {p.mobile && <span className="text-xs text-zinc-500 ml-2">{p.mobile}</span>}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-zinc-400">
                {search ? 'No results found.' : 'Type to search...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AssignmentForm({ drivers = [], helpers = [], onSubmit, loading, defaultValues, mode }) {
  const [driverId, setDriverId] = useState(defaultValues?.driver_id || defaultValues?.user_id || '')
  const [helperId, setHelperId] = useState(defaultValues?.helper_id || '')
  const [status, setStatus] = useState(defaultValues?.status || 'ASSIGNED')

  const showDriver = !mode || mode === 'driver'
  const showHelper = !mode || mode === 'helper'

  return (
    <div className="space-y-5">
      {showDriver && (
        <PersonPicker
          label="Select Driver"
          people={drivers}
          selectedId={driverId}
          onSelect={setDriverId}
          onClear={() => setDriverId('')}
          placeholder="Search by name or mobile..."
        />
      )}

      {showHelper && (
        <PersonPicker
          label="Select Helper"
          people={helpers}
          selectedId={helperId}
          onSelect={setHelperId}
          onClear={() => setHelperId('')}
          placeholder="Search by name or mobile..."
        />
      )}

      <Select
        label="Assignment Status"
        options={[
          { value: 'ASSIGNED', label: 'Assigned (Active)' },
          { value: 'INACTIVE', label: 'Inactive' },
        ]}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <Button
          loading={loading}
          disabled={(showDriver && !driverId) || (showHelper && !showDriver && !helperId)}
          onClick={() => onSubmit({ driver_id: driverId || undefined, helper_id: helperId || undefined, vehicle_id: undefined, status })}
          className="w-full md:w-auto"
        >
          {defaultValues ? 'Update Assignment' : 'Assign'}
        </Button>
      </div>
    </div>
  )
}
