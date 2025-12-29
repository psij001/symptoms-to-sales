'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Loader2, Sun, Moon, Monitor, Crown, LogOut } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'

interface UsageStats {
  totalOutputs: number
  byTool: Record<string, number>
  memberSince: string
}

interface UserSettings {
  firstName: string
  lastName: string
  email: string
  subscriptionTier: string
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const toolDisplayNames: Record<string, string> = {
  'triangle': 'Triangle of Insight',
  'triangle-symptom': 'Triangle of Insight',
  'triangle-wisdom': 'Triangle of Insight',
  'triangle-metaphor': 'Triangle of Insight',
  't1-email': 'T1 Email',
  'subject-lines': 'Subject Lines',
  'noahs-ark': "Noah's Ark",
  'voice-dna': 'Voice DNA',
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [subscriptionTier, setSubscriptionTier] = useState('free')
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    if (open) {
      loadSettings()
      loadUsageStats()
    }
  }, [open])

  useEffect(() => {
    if (originalSettings) {
      const changed =
        firstName !== originalSettings.firstName ||
        lastName !== originalSettings.lastName
      setHasChanges(changed)
    }
  }, [firstName, lastName, originalSettings])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.email || '')
        setSubscriptionTier(data.subscriptionTier || 'free')
        setOriginalSettings({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          subscriptionTier: data.subscriptionTier || 'free',
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/user/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageStats(data)
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      })

      if (response.ok) {
        setOriginalSettings({ firstName, lastName, email, subscriptionTier })
        setHasChanges(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = () => {
    window.location.href = '/api/logout'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  const getToolName = (toolType: string): string => {
    return toolDisplayNames[toolType] || toolType
  }

  // Consolidate tool stats (e.g., triangle variants)
  const consolidatedStats = usageStats?.byTool
    ? Object.entries(usageStats.byTool).reduce((acc, [tool, count]) => {
        const displayName = getToolName(tool)
        acc[displayName] = (acc[displayName] || 0) + count
        return acc
      }, {} as Record<string, number>)
    : {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Profile
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-sm">{email}</p>
              </div>
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>

            <Separator />

            {/* Subscription Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Subscription
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <span className="font-medium capitalize">{subscriptionTier} Plan</span>
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            </div>

            <Separator />

            {/* Usage Stats Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Progress
              </h3>
              {usageStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span>{formatDate(usageStats.memberSince)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total content generated</span>
                    <span className="font-medium">{usageStats.totalOutputs}</span>
                  </div>
                  {Object.keys(consolidatedStats).length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs text-muted-foreground">By tool</span>
                      {Object.entries(consolidatedStats).map(([tool, count]) => (
                        <div key={tool} className="flex items-center justify-between text-sm pl-2">
                          <span className="text-muted-foreground">{tool}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Appearance
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex-1"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>

            <Separator />

            {/* Account Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Account
              </h3>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
