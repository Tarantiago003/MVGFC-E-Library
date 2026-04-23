
const store = new Map()

export function get(key) {
  const e = store.get(key)
  if (!e) return null
  if (Date.now() > e.exp) { store.delete(key); return null }
  return e.val
}

export function set(key, val, ttl = 5 * 60 * 1000) {
  store.set(key, { val, exp: Date.now() + ttl })
}

export function del(key) {
  store.delete(key)
}

// Invalidate all keys that start with a given prefix
export function bust(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}