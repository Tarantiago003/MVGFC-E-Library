
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { readSheet, updateRange, rowNum, cellRange } from '../../../lib/sheets'
import * as cache from '../../../lib/cache'
import { SHEETS, COL, USER_STATUS } from '../../../lib/constants'

const USERS_TTL = parseInt(process.env.CACHE_TTL_USERS_MS) || 5 * 60 * 1000

async function getUsers() {
  const cached = cache.get('users')
  if (cached) return cached
  const rows = await readSheet(SHEETS.USERS)
  cache.set('users', rows, USERS_TTL)
  return rows
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userType: { label: "User Type", type: "text" },
        identifier: { label: "ID Number", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { userType, identifier, password } = credentials
          
          const users = await getUsers()
          
          // Find user by identifier (Student ID or Employee Number)
          let user = null
          if (userType === 'student') {
            user = users.find(r => r[COL.USERS.STUDENT_ID] === identifier)
          } else if (userType === 'employee') {
            user = users.find(r => r[COL.USERS.EMPLOYEE_NUM] === identifier)
          }
          
          if (!user) {
            throw new Error('Invalid credentials')
          }
          
          // Check status
          if (user[COL.USERS.STATUS] !== USER_STATUS.ACTIVE) {
            throw new Error('Account is inactive or suspended')
          }
          
          // Verify password
          const storedPassword = user[COL.USERS.PASSWORD]
          const isValid = await bcrypt.compare(password, storedPassword)
          
          if (!isValid) {
            throw new Error('Invalid credentials')
          }
          
          // Update last login
          const rn = rowNum(users, COL.USERS.ID, user[COL.USERS.ID])
          if (rn !== -1) {
            await updateRange(
              cellRange(SHEETS.USERS, rn, COL.USERS.LAST_LOGIN),
              [new Date().toISOString()]
            )
          }
          
          // Return user object
          return {
            id: user[COL.USERS.ID],
            name: user[COL.USERS.NAME],
            email: user[COL.USERS.EMAIL],
            role: user[COL.USERS.ROLE],
            status: user[COL.USERS.STATUS],
            dept: user[COL.USERS.DEPT],
            userType: user[COL.USERS.USER_TYPE],
            assignedLibrary: user[COL.USERS.ASSIGNED_LIBRARY],
            studentId: user[COL.USERS.STUDENT_ID],
            year: user[COL.USERS.YEAR],
            section: user[COL.USERS.SECTION],
            employeeNum: user[COL.USERS.EMPLOYEE_NUM],
            position: user[COL.USERS.POSITION],
            office: user[COL.USERS.OFFICE]
          }
        } catch (error) {
          console.error('[Auth error]', error)
          return null
        }
      }
    })
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },

 callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.userId = user.id
      token.role = user.role
      token.status = user.status
      token.dept = user.dept
      token.userType = user.userType
      token.assignedLibrary = user.assignedLibrary
      
      if (user.userType === 'student') {
        token.studentId = user.studentId
        token.year = user.year
        token.section = user.section
      }
      
      if (user.userType === 'employee') {
        token.employeeNum = user.employeeNum
        token.position = user.position
        token.office = user.office
      }
    }
    return token
  },

  async session({ session, token }) {
    if (session?.user) {
      session.user.id = token.userId
      session.user.role = token.role
      session.user.status = token.status
      session.user.dept = token.dept || ''
      session.user.userType = token.userType
      session.user.assignedLibrary = token.assignedLibrary || ''
      
      // Remove image field completely - don't set it at all
      delete session.user.image
      
      if (token.userType === 'student') {
        session.user.studentId = token.studentId || ''
        session.user.year = token.year || ''
        session.user.section = token.section || ''
      }
      
      if (token.userType === 'employee') {
        session.user.employeeNum = token.employeeNum || ''
        session.user.position = token.position || ''
        session.user.office = token.office || ''
      }
    }
    
    return session
  }
}
}

export default NextAuth(authOptions)