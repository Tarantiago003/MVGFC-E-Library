import { useState } from 'react'

/**
 * MVGFC Logo — shows /public/mvgfc-logo.png if it exists,
 * falls back to the styled "MV" monogram so nothing breaks
 * if the image hasn't been added yet.
 *
 * Props:
 *   size  — Tailwind w-/h- number (e.g. 9 → w-9 h-9). Default: 9
 *   dark  — true = white "MV" bg for dark backgrounds (sidebar, top-bars)
 *           false = green "MV" bg for light backgrounds (auth cards)
 */
export default function Logo({ size = 9, dark = true }) {
  const [err, setErr] = useState(false)
  const sz = `w-${size} h-${size}`

  if (!err) {
    return (
      <img
        src="/mvgfc-logo.png"
        alt="MVGFC"
        onError={() => setErr(true)}
        className={`${sz} object-contain flex-shrink-0`}
      />
    )
  }

  // Fallback monogram
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
      ${dark ? 'bg-white text-green-800' : 'bg-green-800 text-white'}`}>
      MV
    </div>
  )
}