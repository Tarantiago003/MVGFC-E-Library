
export function compose(...fns) {
  return (handler) => fns.reduceRight((h, fn) => fn(h), handler)
}