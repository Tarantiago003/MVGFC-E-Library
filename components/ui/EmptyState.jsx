
export default function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="font-semibold text-green-800 text-base mb-1">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
    </div>
  )
}