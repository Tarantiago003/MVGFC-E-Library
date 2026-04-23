
import PusherJs from 'pusher-js'

let _client = null

export function getPusherClient() {
  if (_client) return _client
  _client = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  })
  return _client
}

export function subscribeChannel(channelName, event, cb) {
  const client  = getPusherClient()
  const channel = client.subscribe(channelName)
  channel.bind(event, cb)
  return () => {
    channel.unbind(event, cb)
    client.unsubscribe(channelName)
  }
}