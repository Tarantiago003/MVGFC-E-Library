import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { readSheet, appendRow } from '../../../lib/sheets'
import * as cache from '../../../lib/cache'
import { SHEETS, COL, ROLES, USER_STATUS, USER_TYPE, INSTITUTES } from '../../../lib/constants'

const commonFields = {
  name:      Joi.string().max(255).required(),
  email:     Joi.string().email().required(),
  password:  Joi.string().min(6).required(),
  institute: Joi.string().valid(...INSTITUTES).required()
}

const studentSchema = Joi.object({
  ...commonFields,
  userType:  Joi.string().valid(USER_TYPE.STUDENT).required(),
  studentId: Joi.string().max(50).required(),
  year:      Joi.string().max(20).required(),
  section:   Joi.string().max(50).required()
})

const employeeSchema = Joi.object({
  ...commonFields,
  userType:    Joi.string().valid(USER_TYPE.EMPLOYEE).required(),
  employeeNum: Joi.string().max(50).required(),
  position:    Joi.string().max(100).required(),
  office:      Joi.string().max(100).required()
})

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  try {
    const { userType } = req.body
    const schema = userType === USER_TYPE.STUDENT ? studentSchema : employeeSchema
    const { error, value } = schema.validate(req.body)

    if (error)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      })

    const users = await readSheet(SHEETS.USERS)

    // Duplicate email check
    if (users.find(r => r[COL.USERS.EMAIL] === value.email))
      return res.status(409).json({ success: false, error: 'Email already registered' })

    // Duplicate ID check
    if (userType === USER_TYPE.STUDENT) {
      if (users.find(r => r[COL.USERS.STUDENT_ID] === value.studentId))
        return res.status(409).json({ success: false, error: 'Student ID already registered' })
    } else {
      if (users.find(r => r[COL.USERS.EMPLOYEE_NUM] === value.employeeNum))
        return res.status(409).json({ success: false, error: 'Employee number already registered' })
    }

    const hashedPassword = await bcrypt.hash(value.password, 10)
    const now    = new Date().toISOString()
    const userId = uuid()

    // Columns must match COL.USERS exactly (0–18)
    const newRow = [
      userId,                    // 0  UserID
      value.name,                // 1  FullName
      value.email,               // 2  Email
      ROLES.USER,                // 3  Role
      '',                        // 4  Department
      USER_STATUS.ACTIVE,        // 5  Status
      '',                        // 6  GoogleID
      now,                       // 7  CreatedAt
      now,                       // 8  LastLoginAt
      value.userType,            // 9  UserType
      value.studentId   || '',   // 10 StudentID
      value.year        || '',   // 11 Year
      value.section     || '',   // 12 Section
      value.employeeNum || '',   // 13 EmployeeNumber
      value.position    || '',   // 14 Position
      value.office      || '',   // 15 Office
      '',                        // 16 AssignedLibrary
      hashedPassword,            // 17 Password
      value.institute   || '',   // 18 Institute  ← NEW column S
    ]

    await appendRow(SHEETS.USERS, newRow)
    cache.del('users')

    return res.status(201).json({ success: true, message: 'Registration successful' })
  } catch (err) {
    console.error('[Registration error]', err)
    return res.status(500).json({ success: false, error: 'Registration failed' })
  }
}