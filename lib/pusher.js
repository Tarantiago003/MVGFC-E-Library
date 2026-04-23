
import Pusher from 'pusher'

let _pusher = null
function getPusher() {
  if (!_pusher) {
    _pusher = new Pusher({
      appId:   process.env.PUSHER_APP_ID,
      key:     process.env.PUSHER_KEY,
      secret:  process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS:  true
    })
  }
  return _pusher
}

export async function trigger(channel, event, data) {
  return getPusher().trigger(channel, event, data)
}

// Channel naming conventions
export const ch = {
  chat:       (threadId) => `chat-${threadId}`,
  userNotif:  (userId)   => `user-notif-${userId}`,
  adminInbox: (library = 'all') => library === 'all' ? 'admin-inbox' : `admin-inbox-${library}`,
  borrowStat: (userId)   => `borrow-status-${userId}`
}