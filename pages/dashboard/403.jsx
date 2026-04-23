

import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-center px-6">
      <span className="text-6xl mb-6">🚫</span>
      <h1 className="text-3xl font-bold text-green-800 mb-2">Access Denied</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        You don't have permission to view this page. This area requires a higher privilege level.
      </p>
      <Link href="/dashboard/home"
        className="bg-green-700 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-green-800 transition">
        ← Back to Dashboard
      </Link>
    </div>
  )
}
