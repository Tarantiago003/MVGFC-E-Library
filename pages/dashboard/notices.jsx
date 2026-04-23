import { useSession } from 'next-auth/react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { withDashboardAuth } from '../../components/guards/withDashboardAuth'

export default function NoticesPage() {
  const { data: session } = useSession()
  const isClerk = session?.user?.role === 'clerk'
  const assignedLibrary = session?.user?.assignedLibrary

  function openNoticeGenerator(library) {
    const url = library === 'HIGH_SCHOOL' 
      ? '/overdue-highschool.html' 
      : '/overdue-main.html'
    
    // Open in new tab
    window.open(url, '_blank')
  }

  return (
    <DashboardLayout title="📄 Generate Library Notice">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Generate Library Notice
            </h2>
            <p className="text-gray-500 text-sm">
              {isClerk 
                ? `Create overdue notices for ${assignedLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library'}`
                : 'Choose which library notice template to use'
              }
            </p>
          </div>

          {/* For Clerks - Show only their assigned library */}
          {isClerk ? (
            <button
              onClick={() => openNoticeGenerator(assignedLibrary)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold 
                py-4 px-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg
                flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <span className="text-3xl">
                  {assignedLibrary === 'HIGH_SCHOOL' ? '🎓' : '📚'}
                </span>
                <div className="text-left">
                  <p className="text-lg font-bold">
                    {assignedLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library'}
                  </p>
                  <p className="text-green-200 text-sm">
                    Click to open notice generator
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" 
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            /* For Admins - Show both options */
            <div className="space-y-4">
              <button
                onClick={() => openNoticeGenerator('MAIN_LIBRARY')}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold 
                  py-4 px-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg
                  flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">📚</span>
                  <div className="text-left">
                    <p className="text-lg font-bold">Main Library Notice</p>
                    <p className="text-green-200 text-sm">
                      For college departments and main library
                    </p>
                  </div>
                </div>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <button
                onClick={() => openNoticeGenerator('HIGH_SCHOOL')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                  py-4 px-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg
                  flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🎓</span>
                  <div className="text-left">
                    <p className="text-lg font-bold">High School Library Notice</p>
                    <p className="text-blue-200 text-sm">
                      For high school department library
                    </p>
                  </div>
                </div>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
            <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
              <span>💡</span>
              How to use:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1 ml-6 list-disc">
              <li>Click on the library button above to open the notice generator</li>
              <li>Fill in the recipient details and book information</li>
              <li>Select the reason for the notice</li>
              <li>Click "Generate Notice" to preview</li>
              <li>Download the PDF when ready</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps = withDashboardAuth()