import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Triangle, Mail, MessageSquare, ArrowRight } from 'lucide-react'
import { storage } from '@/lib/db/storage'
import { getCurrentUser } from '@/lib/auth/session'

const tools = [
  {
    title: 'Triangle of Insight',
    description: 'Build your symptom, wisdom, and metaphor for powerful nurture content.',
    icon: Triangle,
    href: '/dashboard/tools/triangle',
    color: 'text-project-personal',
  },
  {
    title: 'T1 Email Creator',
    description: '7 email types with 3 drafts each. Hell Island, Heaven Island, and more.',
    icon: Mail,
    href: '/dashboard/tools/t1-email',
    color: 'text-project-partner',
  },
  {
    title: 'Subject Lines',
    description: '10 attention-grabbing headlines using the H.I./O/P framework.',
    icon: MessageSquare,
    href: '/dashboard/tools/subject-lines',
    color: 'text-project-client',
  },
]

export default async function DashboardPage() {
  const session = await getCurrentUser()
  
  let firstName = 'there'
  if (session) {
    const user = await storage.getUser(session.userId)
    firstName = user?.firstName || 'there'
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-display">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="text-text-secondary text-lg">
          What would you like to create today?
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-caption text-text-tertiary">TOOLS</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="h-full transition-colors hover:border-border-hover group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-surface ${tool.color}`}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-h3">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-text-secondary">
                    {tool.description}
                  </CardDescription>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-accent hover:text-accent-hover group-hover:translate-x-1 transition-transform"
                  >
                    Launch <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-caption text-text-tertiary">CONTEXT</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-text-secondary text-sm">
                  No project selected yet
                </p>
                <p className="text-text-tertiary text-xs">
                  Create a project to add Voice DNA and Offer Context
                </p>
              </div>
              <Button variant="outline" size="sm">
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
