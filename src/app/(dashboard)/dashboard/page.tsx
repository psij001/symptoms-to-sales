import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Triangle, Mail, MessageSquare, ArrowRight, FileText, Clock } from 'lucide-react'
import { storage } from '@/lib/db/storage'
import { getCurrentUser } from '@/lib/auth/session'
import { CreateProjectModal } from '@/components/dashboard/create-project-modal'
import { StepConnector } from '@/components/dashboard/step-connector'

const workflowSteps = [
  {
    step: 1,
    title: 'Triangle of Insight',
    subtitle: 'Diagnose the Market',
    description: 'Build your symptom, wisdom, and metaphor. Everything starts here.',
    icon: Triangle,
    href: '/dashboard/tools/triangle',
    color: 'text-project-personal',
    bgColor: 'bg-project-personal/10',
    buttonText: 'Start Diagnosis',
  },
  {
    step: 2,
    title: 'T1 Email Creator',
    subtitle: 'The Treatment',
    description: 'Generate the Hell Island Sequence. 7 emails, 3 variations, ready to send.',
    icon: Mail,
    href: '/dashboard/tools/t1-email',
    color: 'text-project-partner',
    bgColor: 'bg-project-partner/10',
    buttonText: 'Launch',
  },
  {
    step: 3,
    title: 'Subject Lines',
    subtitle: 'The Headlines',
    description: '10 attention-grabbing headlines using the H.I./O/P framework.',
    icon: MessageSquare,
    href: '/dashboard/tools/subject-lines',
    color: 'text-project-client',
    bgColor: 'bg-project-client/10',
    buttonText: 'Launch',
  },
]

export default async function DashboardPage() {
  const isDev = process.env.NODE_ENV === 'development'

  let firstName = 'there'
  if (!isDev) {
    const session = await getCurrentUser()
    if (session) {
      const user = await storage.getUser(session.userId)
      firstName = user?.firstName || 'there'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 animate-header-entrance">
        <h1 className="text-display">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="text-text-secondary text-lg">
          Follow the steps to create high-converting content.
        </p>
      </div>

      {/* Context Bar */}
      <div className="animate-section-entrance" style={{ animationDelay: '50ms' }}>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface">
                  <FileText className="h-4 w-4 text-text-tertiary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    No project selected yet
                  </p>
                  <p className="text-text-tertiary text-xs">
                    Create a project to add Voice DNA and Offer Context
                  </p>
                </div>
              </div>
              <CreateProjectModal />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequential Workflow Steps */}
      <div className="space-y-0 animate-section-entrance" style={{ animationDelay: '100ms' }}>
        {workflowSteps.map((step, index) => (
          <div key={step.title}>
            <Link href={step.href}>
              <Card className={`card-premium group cursor-pointer animate-card-entrance stagger-${index + 1}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bgColor} ${step.color} font-serif font-bold text-lg`}>
                        {step.step}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-tertiary text-xs font-medium uppercase tracking-wider">
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold mb-1">
                        {step.title}
                      </h3>
                      <p className={`text-sm font-medium ${step.color} mb-2`}>
                        {step.subtitle}
                      </p>
                      <p className="text-text-secondary text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 self-center">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-accent hover:bg-accent-hover text-accent-foreground group-hover:translate-x-1 transition-transform"
                      >
                        {step.buttonText} <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Connector between steps */}
            {index < workflowSteps.length - 1 && (
              <StepConnector />
            )}
          </div>
        ))}
      </div>

      {/* Recent Outputs */}
      <div className="space-y-4 animate-section-entrance" style={{ animationDelay: '400ms' }}>
        <h2 className="text-caption text-text-tertiary">RECENT OUTPUTS</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-surface mb-4">
                <Clock className="h-6 w-6 text-text-tertiary" />
              </div>
              <p className="text-text-secondary text-sm mb-1">
                No outputs yet
              </p>
              <p className="text-text-tertiary text-xs">
                Your generated content will appear here
              </p>
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
