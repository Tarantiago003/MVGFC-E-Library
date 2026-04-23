
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, width = 'max-w-md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} z-10`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
          <h3 className="font-bold text-green-800 text-base">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
