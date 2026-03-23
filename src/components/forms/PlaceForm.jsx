import { useState } from 'react'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function PlaceForm({ defaultValues, onSubmit, loading }) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Place name is required'); return }
    setError('')
    onSubmit({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Place Name"
        placeholder="e.g. Bhubaneswar"
        value={name}
        onChange={(e) => { setName(e.target.value); setError('') }}
        error={error}
      />
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <Button type="submit" loading={loading} className="w-full md:w-auto">
          {defaultValues ? 'Update Place' : 'Add Place'}
        </Button>
      </div>
    </form>
  )
}
