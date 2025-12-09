import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { storage } from '@/lib/db/storage'
import { getCurrentUser } from '@/lib/auth/session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentUser()

  if (!session) {
    redirect('/login')
  }

  const user = await storage.getUser(session.userId)

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          email: session.email,
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          profileImageUrl: user?.profileImageUrl || undefined,
        }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
