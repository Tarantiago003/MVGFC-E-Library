
import { fmtTime } from '../../lib/utils'

export default function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && (
        <span className="text-[10px] text-green-700 font-semibold ml-2 mb-1">Library Staff</span>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
        ${isOwn
          ? 'bg-green-700 text-white rounded-br-sm'
          : 'bg-white text-gray-800 border border-green-100 rounded-bl-sm'}`}>
        {msg.messageText}
      </div>
      <span className="text-[10px] text-gray-400 mt-1 mx-2">{fmtTime(msg.timestamp)}</span>
    </div>
  )
}