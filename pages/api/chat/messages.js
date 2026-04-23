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

// 🔥 IN-MEMORY DUPLICATE DETECTION CACHE
const recentMessages = new Map() // Key: `${threadId}:${userId}:${messageText}`, Value: timestamp
const DUPLICATE_WINDOW = 5000 // 5 seconds

// 🔥 CLEANUP OLD ENTRIES EVERY 10 SECONDS
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of recentMessages.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW) {
      recentMessages.delete(key)
    }
  }
}, 10000)

async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  const { threadId, messageText, messageType, library } = value
  const isStaff = [ROLES.ADMIN, ROLES.CLERK].includes(req.user.role)

  if (!isStaff && threadId !== req.user.id)
    httpError(403, 'You can only send messages in your own thread')

  // 🔥 DUPLICATE DETECTION - Check if same message was sent recently
  const duplicateKey = `${threadId}:${req.user.id}:${messageText.trim()}`
  const lastSent = recentMessages.get(duplicateKey)
  const now = Date.now()
  
  if (lastSent && (now - lastSent) < DUPLICATE_WINDOW) {
    console.log('🔒 SERVER BLOCKED DUPLICATE:', duplicateKey)
    // Return success to prevent client retries, but don't actually save
    return res.status(200).json({ 
      success: true, 
      message: 'Duplicate message blocked',
      data: { id: 'DUPLICATE_BLOCKED' }
    })
  }

  // 🔥 RECORD THIS MESSAGE
  recentMessages.set(duplicateKey, now)

  // Determine library location
  let libraryLocation = library || LIBRARY.MAIN_LIBRARY
  
  if (isStaff) {
    libraryLocation = req.user.assignedLibrary || LIBRARY.MAIN_LIBRARY
  } else {
    // Staff replying - use their assigned library
    libraryLocation = req.user.assignedLibrary || LIBRARY.MAIN_LIBRARY
  }

  const msgId = uuid()
  const timestamp = new Date().toISOString()
  const threadStatus = THREAD_STATUS.OPEN

  await appendRow(SHEETS.CHAT, [
    msgId,
    threadId,
    req.user.id,
    req.user.role,
    messageType || '',
    messageText,
    timestamp,
    'FALSE',
    threadStatus,
    libraryLocation
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

  // Broadcast to thread channel
  await trigger(ch.chat(threadId), 'new-message', payload)

  if (isStaff) {
    await trigger(ch.userNotif(threadId), 'chat-reply', {
      title:   'New reply from library staff',
      message: messageText.substring(0, 80)
    })
    await appendRow(SHEETS.NOTIFICATIONS, [
      uuid(), threadId, NOTIF_TYPE.CHAT_REPLY,
      'Library Staff Replied',
      `Staff replied: "${messageText.substring(0, 60)}${messageText.length > 60 ? '…' : ''}"`,
      msgId, 'FALSE', timestamp
    ])
  } else {
    await trigger(ch.adminInbox(libraryLocation), 'new-chat-message', {
      threadId, userName: req.user.name, preview: messageText.substring(0, 80),
      library: libraryLocation
    })
  }

  res.status(201).json({ success: true, data: payload })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handler)