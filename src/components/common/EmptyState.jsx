import Button from '../ui/Button.jsx'

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
      <div className="text-base font-semibold">{title}</div>
      {description ? (
        <div className="mt-2 text-sm text-zinc-600">{description}</div>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-5 flex justify-center">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}
