
const TYPE_META = {
  INQUIRY:   { label: '❓ Inquiry',   cls: 'bg-blue-100   text-blue-700'   },
  FEEDBACK:  { label: '💬 Feedback',  cls: 'bg-green-100  text-green-700'  },
  COMPLAINT: { label: '⚠️ Complaint', cls: 'bg-red-100    text-red-700'    },
}

export default function ComplaintTag({ type }) {
  if (!type) return null
  const m = TYPE_META[type] || { label: type, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  )
}