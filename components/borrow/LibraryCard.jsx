

export default function LibraryCard({ id, name, description, icon, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all shadow-card flex gap-4 items-start
        ${selected ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`font-semibold text-sm ${selected ? 'text-green-800' : 'text-gray-800'}`}>{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {selected && <span className="ml-auto text-green-600 text-lg">✓</span>}
    </button>
  )
}
