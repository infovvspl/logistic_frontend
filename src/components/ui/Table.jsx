import { cn } from '../../utils/helpers.js'

export default function Table({ columns, rows, rowKey = 'id', className, headerClassName, rowClassName, onRowClick }) {
  return (
    <div className={cn(
      'w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm leading-6">
          <thead className={cn("bg-zinc-50/50 border-b border-zinc-200", headerClassName)}>
            <tr>
              {columns.map((c) => (
                <th 
                  key={c.key} 
                  className={cn(
                    "px-6 py-3.5 text-[12px] font-semibold uppercase tracking-tight text-zinc-500",
                    headerClassName, // <--- Add this! This injects "!text-white bg-zinc-900", etc.
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row, i) => {
              const rawKey = typeof rowKey === 'function' ? rowKey(row) : row[rowKey]
              const finalKey = (rawKey !== undefined && rawKey !== null) ? String(rawKey) : `row-${i}`
              
              return (
                <tr 
                  key={finalKey} 
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "group transition-all duration-200 ease-in-out",
                    onRowClick ? "cursor-pointer hover:bg-blue-50/30" : "hover:bg-zinc-50/80",
                    rowClassName
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={`${finalKey}-${col.key}`}
                      className={cn(
                        "whitespace-nowrap px-6 py-4 text-zinc-600 transition-colors group-hover:text-zinc-900",
                        col.className
                      )}
                    >
                      {col.render ? (
                        <div className="flex items-center">
                           {col.render(row)}
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-700">{row[col.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Empty State */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <p className="text-sm">No data available</p>
        </div>
      )}
    </div>
  )
}