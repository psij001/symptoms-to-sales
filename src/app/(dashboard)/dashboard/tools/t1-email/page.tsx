'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Mail,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EMAIL_TYPES, type EmailTypeId } from '@/lib/prompts/t1-email'

interface EmailDraft {
  subject: string
  body: string
}

export default function T1EmailCreatorPage() {
  // Email type selection
  const [selectedType, setSelectedType] = useState<EmailTypeId | null>(null)

  // Input state
  const [audience, setAudience] = useState('')
  const [problem, setProblem] = useState('')
  const [symptom, setSymptom] = useState('')
  const [wisdom, setWisdom] = useState('')
  const [metaphor, setMetaphor] = useState('')
  const [showTriangleInputs, setShowTriangleInputs] = useState(false)

  // Generated content
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [activeDraft, setActiveDraft] = useState('1')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedDraft, setCopiedDraft] = useState<number | null>(null)

  // Parse drafts from streamed content
  const parseDrafts = useCallback((text: string): EmailDraft[] => {
    const drafts: EmailDraft[] = []

    // Split by draft markers
    const draftRegex = /---\s*\n\*\*Draft\s+(\d+)\*\*\s*\n\*\*Subject:\*\*\s*(.+?)\n([\s\S]*?)(?=---\s*\n\*\*Draft|\s*$)/gi
    let match

    while ((match = draftRegex.exec(text)) !== null) {
      const subject = match[2].trim()
      let body = match[3].trim()

      // Clean up the body - remove trailing signature placeholder if present
      body = body.replace(/\[Your Name\]\s*---?\s*$/i, '').trim()

      if (subject && body) {
        drafts.push({ subject, body })
      }
    }

    // If regex didn't match, try simpler parsing
    if (drafts.length === 0) {
      const sections = text.split(/---+/).filter(s => s.trim())
      for (const section of sections) {
        const subjectMatch = section.match(/\*?\*?Subject:?\*?\*?\s*(.+)/i)
        if (subjectMatch) {
          const subject = subjectMatch[1].trim()
          const bodyStart = section.indexOf('\n', section.indexOf(subjectMatch[0])) + 1
          let body = section.slice(bodyStart).trim()
          body = body.replace(/\[Your Name\]\s*$/i, '').trim()
          if (subject && body) {
            drafts.push({ subject, body })
          }
        }
      }
    }

    return drafts
  }, [])

  // Generate emails
  const generateEmails = async () => {
    if (!selectedType) {
      setError('Please select an email type')
      return
    }
    if (!audience.trim() || !problem.trim()) {
      setError('Please fill in the audience and problem fields')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setDrafts([])

    try {
      const response = await fetch('/api/generate/t1-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: selectedType,
          audience,
          problem,
          symptom: symptom.trim() || undefined,
          wisdom: wisdom.trim() || undefined,
          metaphor: metaphor.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk
        setStreamingContent(fullText)
      }

      // Parse the final content
      const parsed = parseDrafts(fullText)
      setDrafts(parsed)
      setActiveDraft('1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate emails')
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy a draft
  const copyDraft = (index: number) => {
    const draft = drafts[index]
    if (!draft) return

    const text = `Subject: ${draft.subject}\n\n${draft.body}`
    navigator.clipboard.writeText(text)
    setCopiedDraft(index)
    setTimeout(() => setCopiedDraft(null), 2000)
  }

  // Reset everything
  const reset = () => {
    setSelectedType(null)
    setAudience('')
    setProblem('')
    setSymptom('')
    setWisdom('')
    setMetaphor('')
    setDrafts([])
    setStreamingContent('')
    setError(null)
    setShowTriangleInputs(false)
  }

  const selectedEmailType = EMAIL_TYPES.find((t) => t.id === selectedType)

  return (
    <div className="grid grid-cols-[minmax(320px,400px)_1fr] w-full h-[calc(100vh-3.5rem)]">
      {/* Input Panel */}
      <div className="min-w-0 border-r border-border p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-h1">T1 Email Creator</h1>
            <p className="text-text-secondary">
              Generate 3 high-converting email drafts using the Travis T1 methodology.
            </p>
          </div>

          <Separator />

          {/* Email Type Selection */}
          {!selectedType && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-h3">Select Email Type</h3>
                <p className="text-sm text-text-secondary">
                  Choose the type of T1 email you want to create
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {EMAIL_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      'border-border hover:border-accent hover:bg-accent/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <div className="font-medium text-text-primary">
                          {type.name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          {selectedType && drafts.length === 0 && (
            <div className="space-y-4">
              {/* Selected Type Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
                  <span>{selectedEmailType?.icon}</span>
                  <span className="text-sm font-medium text-accent">
                    {selectedEmailType?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="text-text-secondary"
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience *</Label>
                <Textarea
                  id="audience"
                  placeholder="Describe your perfect customer avatar..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Biggest Problem (Hell Island) *</Label>
                <Textarea
                  id="problem"
                  placeholder="What's the painful reality they're experiencing?"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[80px]"
                />
              </div>

              {/* Triangle of Insight Inputs (Optional) */}
              <div className="border border-border rounded-lg">
                <button
                  onClick={() => setShowTriangleInputs(!showTriangleInputs)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      Triangle of Insight
                    </span>
                    <span className="text-xs text-text-tertiary">(Optional)</span>
                  </div>
                  {showTriangleInputs ? (
                    <ChevronUp className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                  )}
                </button>

                {showTriangleInputs && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                    <p className="text-xs text-text-tertiary">
                      Add elements from your Triangle of Insight for more targeted emails
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="symptom" className="text-sm">
                        Symptom
                      </Label>
                      <Textarea
                        id="symptom"
                        placeholder="The sensory-based symptom..."
                        value={symptom}
                        onChange={(e) => setSymptom(e.target.value)}
                        disabled={isGenerating}
                        className="min-h-[60px] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wisdom" className="text-sm">
                        Wisdom
                      </Label>
                      <Textarea
                        id="wisdom"
                        placeholder="The counterintuitive insight..."
                        value={wisdom}
                        onChange={(e) => setWisdom(e.target.value)}
                        disabled={isGenerating}
                        className="min-h-[60px] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaphor" className="text-sm">
                        Metaphor
                      </Label>
                      <Textarea
                        id="metaphor"
                        placeholder="The bridge metaphor..."
                        value={metaphor}
                        onChange={(e) => setMetaphor(e.target.value)}
                        disabled={isGenerating}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <Button
                onClick={generateEmails}
                disabled={isGenerating || !audience.trim() || !problem.trim()}
                className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating 3 Drafts...
                  </>
                ) : (
                  <>
                    Generate 3 Email Drafts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Post-Generation State */}
          {drafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  3 drafts generated
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-text-secondary">
                  Review your drafts in the panel on the right. Copy the one you like
                  best or generate new variations.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button
                  onClick={generateEmails}
                  disabled={isGenerating}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent-hover"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Regenerate'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Panel - 60% */}
      <div className="min-w-0 p-6 overflow-y-auto bg-background-elevated">
        {/* Streaming Content */}
        {isGenerating && streamingContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating drafts...</span>
            </div>
            <div className="prose-generated whitespace-pre-wrap text-sm">
              {streamingContent}
              <span className="inline-block w-0.5 h-5 bg-accent animate-typing-cursor ml-0.5" />
            </div>
          </div>
        )}

        {/* Tabbed Drafts View */}
        {!isGenerating && drafts.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Your T1 Email Drafts</h2>
            </div>

            <Tabs value={activeDraft} onValueChange={setActiveDraft}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1">Draft 1</TabsTrigger>
                <TabsTrigger value="2">Draft 2</TabsTrigger>
                <TabsTrigger value="3">Draft 3</TabsTrigger>
              </TabsList>

              {drafts.map((draft, index) => (
                <TabsContent key={index} value={String(index + 1)} className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="text-xs font-medium text-text-tertiary uppercase">
                            Subject Line
                          </div>
                          <CardTitle className="text-lg leading-tight">
                            {draft.subject}
                          </CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyDraft(index)}
                          >
                            {copiedDraft === index ? (
                              <>
                                <Check className="mr-1 h-4 w-4 text-success" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      <div className="prose-generated whitespace-pre-wrap">
                        {draft.body}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && drafts.length === 0 && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-h2">Create T1 Emails</h3>
              <p className="text-text-secondary">
                {selectedType
                  ? `Fill in your audience and problem to generate 3 ${selectedEmailType?.name} email drafts.`
                  : 'Select an email type and enter your audience details to generate high-converting T1 emails.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
