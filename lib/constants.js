
export const ROLES = { ADMIN: 'admin', CLERK: 'clerk', USER: 'user' }

export const USER_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive', SUSPENDED: 'suspended' }

export const USER_TYPE = { STUDENT: 'student', EMPLOYEE: 'employee' }

export const BORROW_STATUS = {
  PENDING: 'PENDING', APPROVED: 'APPROVED',
  REJECTED: 'REJECTED', RETURNED: 'RETURNED'
}

export const LIBRARY = { HIGH_SCHOOL: 'HIGH_SCHOOL', MAIN_LIBRARY: 'MAIN_LIBRARY' }

export const THREAD_STATUS = { OPEN: 'OPEN', RESOLVED: 'RESOLVED' }

export const MSG_TYPE = { INQUIRY: 'INQUIRY', FEEDBACK: 'FEEDBACK', COMPLAINT: 'COMPLAINT' }

export const NOTIF_TYPE = {
  BORROW_APPROVED:  'BORROW_APPROVED',
  BORROW_REJECTED:  'BORROW_REJECTED',
  BORROW_DUE:       'BORROW_DUE',
  CHAT_REPLY:       'CHAT_REPLY',
  ACCOUNT_STATUS:   'ACCOUNT_STATUS'
}

// Exact Google Sheet tab names
export const SHEETS = {
  USERS:              'Users',
  BOOKS_MAIN:         'Books_MainLibrary',
  BOOKS_HS:           'Books_HighSchool',
  BORROWS:            'BorrowRequests',
  CHAT:               'ChatMessages',
  NOTIFICATIONS:      'Notifications'
}

// NOTE: "ID" column in Books sheet represents "Accession Number" (Assc. No.)
export const COL = {
  USERS: {
    ID:0, NAME:1, EMAIL:2, ROLE:3, DEPT:4,
    STATUS:5, GOOGLE_ID:6, CREATED:7, LAST_LOGIN:8,
    USER_TYPE:9, STUDENT_ID:10, YEAR:11, SECTION:12,
    EMPLOYEE_NUM:13, POSITION:14, OFFICE:15, ASSIGNED_LIBRARY:16,
    PASSWORD:17  // NEW: Password column
  },
  BOOKS: {
    ID:0, TITLE:1, AUTHOR:2, ISBN:3, CATEGORY:4, LOCATION:5,
    TOTAL:6, AVAILABLE:7, DESC:8, COVER:9, ADDED_AT:10, ADDED_BY:11
  },
  BORROWS: {
    ID:0, USER_ID:1, BOOK_ID:2, LOCATION:3, STATUS:4,
    REQ_DATE:5, APPROVAL_DATE:6, DUE_DATE:7, RETURN_DATE:8,
    PROCESSED_BY:9, NOTES:10
  },
  CHAT: {
    ID:0, THREAD_ID:1, SENDER_ID:2, SENDER_ROLE:3, MSG_TYPE:4,
    TEXT:5, TIMESTAMP:6, IS_READ:7, THREAD_STATUS:8, LIBRARY_LOCATION:9
  },
  NOTIFS: {
    ID:0, RECIPIENT_ID:1, TYPE:2, TITLE:3, MESSAGE:4,
    RELATED_ID:5, IS_READ:6, CREATED:7
  }
}

export const LETTER = (n) => String.fromCharCode(65 + n)

// Helper: Get correct books sheet name based on library location
export function getBooksSheet(libraryLocation) {
  return libraryLocation === LIBRARY.HIGH_SCHOOL ? SHEETS.BOOKS_HS : SHEETS.BOOKS_MAIN
}