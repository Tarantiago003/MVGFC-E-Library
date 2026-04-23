

export default function BookCard({ book, selected, onClick }) {
  const avail = book.available > 0
  return (
    <button onClick={avail ? onClick : undefined}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all flex gap-3 items-start
        ${selected ? 'border-green-600 bg-green-50' : avail ? 'border-gray-200 bg-white hover:border-green-300' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}>
      {book.coverImageUrl
        ? <img src={book.coverImageUrl} alt={book.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0"/>
        : <div className="w-12 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">📘</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">{book.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{book.author}</p>
        <p className="text-xs text-green-700 mt-1 font-medium">{book.category}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold
          ${avail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {avail ? `${book.available} available` : 'Unavailable'}
        </span>
      </div>
      {selected && <span className="text-green-600 text-lg flex-shrink-0">✓</span>}
    </button>
  )
}