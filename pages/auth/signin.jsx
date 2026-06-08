import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Logo from '../../components/ui/Logo'

export default function SignIn() {
  const { data: session } = useSession()
  const router = useRouter()

  const [userType,    setUserType]   = useState('student')
  const [identifier,  setIdentifier] = useState('')
  const [password,    setPassword]   = useState('')
  const [loading,     setLoading]    = useState(false)
  const [error,       setError]      = useState('')

  if (session) {
    router.replace('/dashboard')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        redirect: false, userType, identifier, password
      })
      if (result?.error) setError('Invalid credentials. Please try again.')
      else router.push('/dashboard')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center px-6">
      {/* Logo + wordmark */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-xl mb-4 p-2">
          <Logo size={16} dark={false}/>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">MVGFC E-Library</h1>
        <p className="text-green-200 text-sm mt-1">Academic Library Management System</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-green-800 text-xl font-bold mb-1">Welcome Back</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to access your library account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* User Type Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-green-800 mb-2">I am a</label>
          <div className="grid grid-cols-2 gap-3">
            {[['student','🎓 Student'],['employee','💼 Employee']].map(([val,lbl]) => (
              <button key={val} type="button" onClick={() => setUserType(val)}
                className={`py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition
                  ${userType === val
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-green-800 mb-1.5">
              {userType === 'student' ? 'Student ID Number' : 'Employee Number'}
            </label>
            <input type="text" value={identifier}
              onChange={e => setIdentifier(e.target.value)} required
              className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={userType === 'student' ? '2024-12345' : 'EMP-12345'}/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-green-800 mb-1.5">Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your password"/>
          </div>

          <button onClick={handleSubmit}
            disabled={loading || !identifier || !password}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold
              py-3 px-4 rounded-2xl transition-all disabled:opacity-60">
            {loading ? 'Signing in…' : '→ Sign In'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>

      <p className="text-green-300 text-xs mt-8">
        © {new Date().getFullYear()} Manuel V. Gallego Foundation Colleges · All rights reserved
      </p>
    </div>
  )
}