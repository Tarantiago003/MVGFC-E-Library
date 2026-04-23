
import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { readSheet, appendRow } from '../../../lib/sheets'
import * as cache from '../../../lib/cache'
import { SHEETS, COL, ROLES, USER_STATUS, USER_TYPE } from '../../../lib/constants'

const studentSchema = Joi.object({
  name:       Joi.string().max(255).required(),
  email:      Joi.string().email().required(),
  password:   Joi.string().min(6).required(),
  userType:   Joi.string().valid(USER_TYPE.STUDENT).required(),
  studentId:  Joi.string().max(50).required(),
  year:       Joi.string().max(20).required(),
  section:    Joi.string().max(50).required()
})

const employeeSchema = Joi.object({
  name:          Joi.string().max(255).required(),
  email:         Joi.string().email().required(),  
  password:      Joi.string().min(6).required(),
  userType:      Joi.string().valid(USER_TYPE.EMPLOYEE).required(),
  employeeNum:   Joi.string().max(50).required(),
  position:      Joi.string().max(100).required(),
  office:        Joi.string().max(100).required()
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { userType } = req.body
    
    // Validate based on user type
    const schema = userType === USER_TYPE.STUDENT ? studentSchema : employeeSchema
    const { error, value } = schema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      })
    }

    // Check if ID already exists
    const users = await readSheet(SHEETS.USERS)

    // Check for duplicate email
    const existingEmail = users.find(r => r[COL.USERS.EMAIL] === value.email)
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      })
    }
    
    let existing = null
    if (userType === USER_TYPE.STUDENT) {
      existing = users.find(r => r[COL.USERS.STUDENT_ID] === value.studentId)
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Student ID already registered'
        })
      }
    } else {
      existing = users.find(r => r[COL.USERS.EMPLOYEE_NUM] === value.employeeNum)
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Employee number already registered'
        })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10)

    // Create new user row
    const now = new Date().toISOString()
    const userId = uuid()
    
    // Generate email based on type (optional - for notifications)
    let email = ''
    if (userType === USER_TYPE.STUDENT) {
      email = `${value.studentId}@student.mvgfc.edu.ph`
    } else {
      email = `${value.employeeNum}@mvgfc.edu.ph`
    }
    
      const newRow = [
        userId,                    // A: UserID
        value.name,                // B: FullName
        value.email,               // C: Email (from form)
        ROLES.USER,                // D: Role
        '',                        // E: Department
        USER_STATUS.ACTIVE,        // F: Status
        '',                        // G: GoogleID
        now,                       // H: CreatedAt
        now,                       // I: LastLoginAt
        value.userType,            // J: UserType
        value.studentId   || '',   // K: StudentID
        value.year        || '',   // L: Year
        value.section     || '',   // M: Section
        value.employeeNum || '',   // N: EmployeeNumber
        value.position    || '',   // O: Position
        value.office      || '',   // P: Office
        '',                        // Q: AssignedLibrary
        hashedPassword             // R: Password
      ]


    await appendRow(SHEETS.USERS, newRow)
    cache.del('users')

    return res.status(201).json({
      success: true,
      message: 'Registration successful'
    })

  } catch (err) {
    console.error('[Registration error]', err)
    return res.status(500).json({
      success: false,
      error: 'Registration failed'
    })
  }
}