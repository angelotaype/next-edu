'use client'

import { useState } from 'react'
import MobileHeader from '@/components/MobileHeader'
import Sidebar from '@/components/Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  schoolName?: string
  userName?: string
  userRole?: string
}

export default function DashboardShell({
  children,
  schoolName = 'Next Edu',
  userName = 'Usuario',
  userRole = 'admin',
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        schoolName={schoolName}
        userName={userName}
        userRole={userRole}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <MobileHeader onMenuClick={() => setMobileOpen(true)} schoolName={schoolName} userName={userName} />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  )
}
