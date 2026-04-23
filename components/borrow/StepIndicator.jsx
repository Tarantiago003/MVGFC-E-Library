

const STEPS = ['Library', 'Book', 'Confirm']

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done   ? 'bg-green-600 border-green-600 text-white'   : ''}
                ${active ? 'bg-white border-green-700 text-green-800'   : ''}
                ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-green-800' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-green-600' : 'bg-gray-200'}`}/>
            )}
          </div>
        )
      })}
    </div>
  )
}