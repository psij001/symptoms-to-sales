'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Triangle,
  Mail,
  MessageSquare,
  FolderOpen,
  Settings,
  LogOut,
  ChevronUp,
  Home,
  Ship,
  Fingerprint,
} from 'lucide-react'

const strategyTools = [
  {
    title: "Noah's Ark",
    url: '/dashboard/tools/noahs-ark',
    icon: Ship,
    description: '7-email urgency campaign',
  },
]

const tools = [
  {
    title: 'Triangle of Insight',
    url: '/dashboard/tools/triangle',
    icon: Triangle,
    description: 'Symptom → Wisdom → Metaphor',
  },
  {
    title: 'T1 Email Creator',
    url: '/dashboard/tools/t1-email',
    icon: Mail,
    description: '7 email types, 3 drafts',
  },
  {
    title: 'Subject Lines',
    url: '/dashboard/tools/subject-lines',
    icon: MessageSquare,
    description: '10 attention-grabbing headlines',
  },
]

const setupTools = [
  {
    title: 'Voice DNA Generator',
    url: '/dashboard/tools/voice-dna-generator',
    icon: Fingerprint,
    description: 'Create your Voice DNA',
  },
]

const navigation = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Outputs',
    url: '/dashboard/outputs',
    icon: FolderOpen,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
]

interface AppSidebarProps {
  user: {
    email: string
    name?: string | null
    profileImageUrl?: string | null
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  const handleSignOut = () => {
    window.location.href = '/api/logout'
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/s2s-logo.png"
            alt="Symptoms to Sales"
            width={200}
            height={100}
            className="w-full max-w-[180px]"
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Strategy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {strategyTools.map((tool) => (
                <SidebarMenuItem key={tool.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === tool.url}
                    tooltip={tool.description}
                  >
                    <Link href={tool.url}>
                      <tool.icon className="h-4 w-4" />
                      <span>{tool.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === tool.url}
                    tooltip={tool.description}
                  >
                    <Link href={tool.url}>
                      <tool.icon className="h-4 w-4" />
                      <span>{tool.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Setup</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {setupTools.map((tool) => (
                <SidebarMenuItem key={tool.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === tool.url}
                    tooltip={tool.description}
                  >
                    <Link href={tool.url}>
                      <tool.icon className="h-4 w-4" />
                      <span>{tool.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    {user.profileImageUrl && (
                      <AvatarImage src={user.profileImageUrl} alt={user.name || user.email} />
                    )}
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name || user.email}</span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
