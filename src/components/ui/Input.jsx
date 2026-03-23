import { cn } from '../../utils/helpers.js'

export default function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  leftIcon,
  ...props
}) {
  return (
    <label className={cn('block', className)}>
      {label ? (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-zinc-800">
            {label}
            {props.required && <span className="ml-0.5 text-rose-500">*</span>}
          </span>
          {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
        </div>
      ) : null}
      <div className={cn('relative', leftIcon ? 'flex items-center' : '')}>
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 text-zinc-400 flex items-center">
            {leftIcon}
          </span>
        ) : null}
        <input
          {...props}
          className={cn(
            'w-full rounded-lg border border-zinc-300 bg-white py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
            leftIcon ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : '',
            inputClassName,
          )}
        />
      </div>
      {error ? <div className="mt-1 text-xs text-rose-600">{error}</div> : null}
    </label>
  )
}
