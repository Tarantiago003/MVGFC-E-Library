
let chain = Promise.resolve()


export function enqueue(fn) {
  return new Promise((resolve, reject) => {
    chain = chain.then(() => fn().then(resolve).catch(reject))
  })
}