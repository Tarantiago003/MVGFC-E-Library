
export default function Table({ columns, children, caption }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-green-100 shadow-sm bg-white">
      {caption && (
        <div className="px-5 py-3 border-b border-green-50 text-xs text-gray-400">{caption}</div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 border-b border-green-100">
            {columns.map(col => (
              <th key={col} className="text-left px-4 py-3 text-xs font-bold text-green-700 uppercase tracking-wide whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50">{children}</tbody>
      </table>
    </div>
  )
}