export default function Loader({ size = 'md' }) {
  const wh = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'
  return (
    <span
      className={`inline-block ${wh} animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900`}
      aria-label="Loading"
      role="status"
    />
  )
}
