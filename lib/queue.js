
let chain = Promise.resolve()

/**
 * Enqueue an async function to run after all previously enqueued functions.
 * Returns a Promise that resolves/rejects with the result of fn().
 */
export function enqueue(fn) {
  return new Promise((resolve, reject) => {
    chain = chain.then(() => fn().then(resolve).catch(reject))
  })
}