import { cn } from '../../utils/helpers.js'

export default function Textarea({
  label,
  hint,
  error,
  className,
  textareaClassName,
  ...props
}) {
  return (
    <label className={cn('block', className)}>
      {label ? (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-zinc-800">{label}</span>
          {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
        </div>
      ) : null}
      <textarea
        {...props}
        className={cn(
          'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 min-h-[80px]',
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : '',
          textareaClassName,
        )}
      />
      {error ? <div className="mt-1 text-xs text-rose-600">{error}</div> : null}
    </label>
  )
}
