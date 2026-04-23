
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  const s = { success: 'bg-green-800', error: 'bg-red-600', info: 'bg-blue-700' }
  return (
    <div className={`fixed top-5 right-5 z-[100] ${s[type]} text-white px-5 py-3 rounded-xl
      shadow-xl text-sm font-medium max-w-xs animate-in slide-in-from-top-2`}>
      {message}
    </div>
  )
}