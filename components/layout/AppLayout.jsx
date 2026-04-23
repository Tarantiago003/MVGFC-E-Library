

import TopBar    from './TopBar'
import BottomNav from './BottomNav'

export default function AppLayout({ title, children, back }) {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col safe-top">
      <TopBar title={title} back={back} />
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
