import Joi from 'joi'
import { v4 as uuid }  from 'uuid'
import { compose }     from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { trigger, ch } from '../../../lib/pusher'
import { appendRow, readSheet } from '../../../lib/sheets'
import { SHEETS, COL, ROLES, MSG_TYPE, THREAD_STATUS, NOTIF_TYPE, LIBRARY } from '../../../lib/constants'

const schema = Joi.object({
  threadId:    Joi.string().required(),
  messageText: Joi.string().max(1000).required(),
  messageType: Joi.string().valid(...Object.values(MSG_TYPE)).optional(),
  library:     Joi.string().valid(...Object.values(LIBRARY)).optional()
})

// In-memory duplicate detection
const recentMessages = new Map()
const DUPLICATE_WINDOW = 5000

setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of recentMessages.entries()) {
    if (now - ts > DUPLICATE_WINDOW) recentMessages.delete(key)
  }
}, 10000)

async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  const { threadId, messageText, messageType, library } = value
  const isStaff = [ROLES.ADMIN, ROLES.CLERK].includes(req.user.role)

  // For users: verify they own the thread (have previously sent to it)
  // For staff: no restriction — they can reply to any thread
  if (!isStaff) {
    const rows = await readSheet(SHEETS.CHAT)
    const threadRows = rows.filter(r => r[COL.CHAT.THREAD_ID] === threadId)
    if (threadRows.length > 0) {
      // Existing thread — must be the owner
      const isOwner = threadRows.some(r => r[COL.CHAT.SENDER_ID] === req.user.id)
      if (!isOwner) httpError(403, 'You can only send messages in your own threads')
    }
    // threadRows.length === 0 means this is a brand new thread — allow it
  }

  // Duplicate detection
  const dupKey  = `${threadId}:${req.user.id}:${messageText.trim()}`
  const lastSent = recentMessages.get(dupKey)
  const now      = Date.now()

  if (lastSent && (now - lastSent) < DUPLICATE_WINDOW) {
    console.log('Server blocked duplicate:', dupKey)
    return res.status(200).json({
      success: true,
      message: 'Duplicate message blocked',
      data: { id: 'DUPLICATE_BLOCKED' }
    })
  }
  recentMessages.set(dupKey, now)

  // Determine library location
  let libraryLocation = library || LIBRARY.MAIN_LIBRARY
  if (isStaff) libraryLocation = req.user.assignedLibrary || LIBRARY.MAIN_LIBRARY

  const msgId       = uuid()
  const timestamp   = new Date().toISOString()
  const threadStatus = THREAD_STATUS.OPEN

  await appendRow(SHEETS.CHAT, [
    msgId, threadId, req.user.id, req.user.role,
    messageType || '', messageText,
    timestamp, 'FALSE', threadStatus, libraryLocation
  ])

  const payload = {
    id:          msgId,
    threadId,
    senderId:    req.user.id,
    senderName:  req.user.name,
    senderRole:  req.user.role,
    messageText,
    timestamp,
    libraryLocation
  }

  // Broadcast to thread channel (both user + staff subscribe to this)
  await trigger(ch.chat(threadId), 'new-message', payload)

  if (isStaff) {
    // Find the thread owner (first user-role sender)
    const rows = await readSheet(SHEETS.CHAT)
    const threadRows = rows.filter(r => r[COL.CHAT.THREAD_ID] === threadId)
    const ownerRow   = threadRows.find(r => r[COL.CHAT.SENDER_ROLE] === ROLES.USER)
    const ownerId    = ownerRow?.[COL.CHAT.SENDER_ID]

    if (ownerId) {
      // Notify the user
      await trigger(ch.userNotif(ownerId), 'chat-reply', {
        threadId,
        title:   'New reply from library staff',
        message: messageText.substring(0, 80)
      })
      await appendRow(SHEETS.NOTIFICATIONS, [
        uuid(), ownerId, NOTIF_TYPE.CHAT_REPLY,
        'Library Staff Replied',
        `Staff replied: "${messageText.substring(0, 60)}${messageText.length > 60 ? '…' : ''}"`,
        msgId, 'FALSE', timestamp
      ])
    }
  } else {
    // User sent — notify admin/clerk inbox
    await trigger(ch.adminInbox(libraryLocation), 'new-chat-message', {
      threadId,
      userId:   req.user.id,
      userName: req.user.name,
      preview:  messageText.substring(0, 80),
      library:  libraryLocation
    })
  }

  res.status(201).json({ success: true, data: payload })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handler)