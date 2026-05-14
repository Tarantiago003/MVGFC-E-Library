/**
 * Converts any Google Drive share/view URL into a direct-embed URL.
 * Also passes through regular https:// URLs unchanged.
 *
 * Supported input formats:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *   https://lh3.googleusercontent.com/...   (already works, pass through)
 *   Any other https:// URL                  (pass through)
 *
 * Output: https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
 *   - thumbnail endpoint works without login for publicly shared files
 *   - sz=w400 gives a 400px-wide version (fast, small)
 *   - Change sz=w800 for higher quality if needed
 */
export function toCoverUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const url = raw.trim()
  if (!url) return null

  // Already a direct thumbnail/export URL — return as-is
  if (url.includes('drive.google.com/thumbnail') ||
      url.includes('drive.google.com/uc?') ||
      url.startsWith('https://lh3.googleusercontent.com')) {
    return url
  }

  // Format: /file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w400`
  }

  // Format: ?id=FILE_ID or open?id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400`
  }

  // Not a Drive URL — return as-is (regular https image)
  return url
}

/**
 * Returns true if the string looks like a valid image URL we should try to show.
 */
export function isValidCoverUrl(raw) {
  const url = toCoverUrl(raw)
  return !!url && (url.startsWith('https://') || url.startsWith('http://'))
}