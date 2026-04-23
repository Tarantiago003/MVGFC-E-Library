
import { initials } from '../../lib/utils'

export default function Avatar({ name, image, size = 10 }) {
  const sz = `w-${size} h-${size}`
  
  // Only render image if it exists and is a valid string
  if (image && typeof image === 'string' && image.length > 0) {
    return <img src={image} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-green-200`}/>
  }
  
  return (
    <div className={`${sz} rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm`}>
      {initials(name)}
    </div>
  )
}