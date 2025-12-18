import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { CommandMenu } from '@/components/layout/CommandMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation - Hidden on desktop */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Command Palette - Global */}
      <CommandMenu />

      {/* Main Content Area */}
      <main className="min-h-screen bg-layer-1 ml-0 lg:ml-64 pb-16 lg:pb-0">
        {children}
      </main>
    </>
  )
}

