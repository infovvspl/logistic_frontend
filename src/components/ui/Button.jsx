import { forwardRef } from 'react'
import { cn } from '../../utils/helpers.js'
import Loader from './Loader.jsx'

const styles = {
  base: 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60 disabled:pointer-events-none',
  solid: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
  ghost: 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
}

const Button = forwardRef(function Button(
  { className, variant = 'solid', loading, leftIcon, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(styles.base, styles[variant], className)}
      {...props}
    >
      {loading ? <Loader size="sm" /> : leftIcon}
      <span>{children}</span>
    </button>
  )
})

export default Button
