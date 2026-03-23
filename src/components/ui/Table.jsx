import { cn } from '../../utils/helpers.js'

export default function Table({ columns, rows, rowKey = 'id', className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-4 font-semibold">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.map((row, i) => {
              // Ensure we have a unique string/number key
              const rawKey = typeof rowKey === 'function' ? rowKey(row) : row[rowKey]
              const finalKey = (rawKey !== undefined && rawKey !== null) ? String(rawKey) : `row-${i}`
              
              return (
                <tr key={finalKey} className="group hover:bg-zinc-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={`${finalKey}-${col.key}`}
                      className="whitespace-nowrap px-4 py-4 text-zinc-600"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
