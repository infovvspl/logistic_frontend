import { forwardRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { cn } from '../../utils/helpers.js'

const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, className, inputClassName, ...props },
  ref
) {
  const [visible, setVisible] = useState(false)

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
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : '',
            inputClassName,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      {error ? <div className="mt-1 text-xs text-rose-600">{error}</div> : null}
    </label>
  )
})

export default PasswordInput
