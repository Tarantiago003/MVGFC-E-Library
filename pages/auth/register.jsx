
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  
  const [userType, setUserType] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student fields
    studentId: '',
    year: '',
    section: '',
    // Employee fields
    employeeNum: '',
    position: '',
    office: ''
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType,
        ...(userType === 'student' ? {
          studentId: formData.studentId,
          year: formData.year,
          section: formData.section
        } : {
          employeeNum: formData.employeeNum,
          position: formData.position,
          office: formData.office
        })
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Registration successful! Please sign in.')
        router.push('/auth/signin')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl mb-4">
          <span className="text-4xl">📚</span>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">Create Account</h1>
        <p className="text-green-200 text-sm mt-1">MVGFC E-Library System</p>
      </div>

      {/* Registration Form */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 max-h-[85vh] overflow-y-auto">
        <h2 className="text-green-800 text-xl font-bold mb-1">Welcome!</h2>
        <p className="text-gray-500 text-sm mb-6">Create your library account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-green-800 mb-2">
              I am a <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType('student')}
                className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition ${
                  userType === 'student'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => setUserType('employee')}
                className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition ${
                  userType === 'employee'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                💼 Employee
              </button>
            </div>
          </div>

          {/* Common Fields */}
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              {/* ADD EMAIL FIELD */}
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={userType === 'student' ? 'student@mvgfc.edu.ph' : 'employee@mvgfc.edu.ph'}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use your official school email for notifications
                </p>
              </div>

          {/* Student-Specific Fields */}
          {userType === 'student' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Student ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="2024-12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-1.5">
                    Year Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-1.5">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="A, B, C..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Employee-Specific Fields */}
          {userType === 'employee' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Employee Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeNum"
                  value={formData.employeeNum}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="EMP-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Faculty, Staff, Administrator..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-800 mb-1.5">
                  Office/Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Registrar, IT, Library..."
                />
              </div>
            </>
          )}

          {/* Password Fields */}
          <div>
            <label className="block text-sm font-semibold text-green-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-green-800 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Re-enter password"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold
              py-3 px-4 rounded-2xl transition-all disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating Account...' : '✓ Create Account'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-green-700 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <p className="text-green-300 text-xs mt-8">
        © {new Date().getFullYear()} MVGFC · All rights reserved
      </p>
    </div>
  )
}