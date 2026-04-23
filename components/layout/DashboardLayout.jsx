
import Sidebar         from './Sidebar'
import DashboardTopBar from './DashboardTopBar'

export default function DashboardLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar/>
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar title={title}/>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}