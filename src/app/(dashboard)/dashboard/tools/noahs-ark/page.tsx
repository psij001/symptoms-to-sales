'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Ship,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  CloudRain,
  AlertTriangle,
} from 'lucide-react'
import { NOAHS_ARK_EMAIL_TYPES, type NoahsArkEmailTypeId } from '@/lib/prompts/noahs-ark'
import { VoiceDNAUploader } from '@/components/voice-dna/voice-dna-uploader'

interface GeneratedEmail {
  type: NoahsArkEmailTypeId
  subject: string
  body: string
}

export default function NoahsArkPage() {
  // Campaign input state
  const [audience, setAudience] = useState('')
  const [storm, setStorm] = useState('')
  const [ark, setArk] = useState('')
  const [scarcity, setScarcity] = useState('')

  // Optional Triangle of Insight
  const [symptom, setSymptom] = useState('')
  const [wisdom, setWisdom] = useState('')
  const [metaphor, setMetaphor] = useState('')
  const [showTriangleInputs, setShowTriangleInputs] = useState(false)

  // Voice DNA state
  const [voiceDNAContent, setVoiceDNAContent] = useState<string | null>(null)
  const [voiceDNAFileName, setVoiceDNAFileName] = useState<string | null>(null)
  const [showVoiceDNA, setShowVoiceDNA] = useState(false)

  // Generated emails
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([])
  const [activeDay, setActiveDay] = useState<string>('1')

  // UI state
  const [currentlyGenerating, setCurrentlyGenerating] = useState<NoahsArkEmailTypeId | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<number | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Parse email from streamed content
  const parseEmail = useCallback((text: string): { subject: string; body: string } | null => {
    const subjectMatch = text.match(/\*?\*?Subject:?\*?\*?\s*(.+)/i)
    if (!subjectMatch) return null

    const subject = subjectMatch[1].trim()
    const bodyStart = text.indexOf('\n', text.indexOf(subjectMatch[0])) + 1
    let body = text.slice(bodyStart).trim()
    body = body.replace(/\[Your Name\]\s*$/i, '').trim()

    return { subject, body }
  }, [])

  // Generate a single email
  const generateEmail = async (emailType: NoahsArkEmailTypeId) => {
    setCurrentlyGenerating(emailType)
    setError(null)
    setStreamingContent('')

    try {
      const response = await fetch('/api/generate/noahs-ark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          audience,
          storm,
          ark,
          scarcity: scarcity.trim() || undefined,
          symptom: symptom.trim() || undefined,
          wisdom: wisdom.trim() || undefined,
          metaphor: metaphor.trim() || undefined,
          voiceDNAContent: voiceDNAContent || undefined,
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

      // Parse the email
      const parsed = parseEmail(fullText)
      if (parsed) {
        setGeneratedEmails((prev) => {
          const existing = prev.findIndex((e) => e.type === emailType)
          const newEmail: GeneratedEmail = { type: emailType, ...parsed }
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = newEmail
            return updated
          }
          return [...prev, newEmail]
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email')
    } finally {
      setCurrentlyGenerating(null)
      setStreamingContent('')
    }
  }

  // Generate all emails in sequence
  const generateAllEmails = async () => {
    if (!audience.trim() || !storm.trim() || !ark.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setGeneratedEmails([])
    setGenerationProgress(0)

    for (let i = 0; i < NOAHS_ARK_EMAIL_TYPES.length; i++) {
      const emailType = NOAHS_ARK_EMAIL_TYPES[i]
      await generateEmail(emailType.id)
      setGenerationProgress(((i + 1) / NOAHS_ARK_EMAIL_TYPES.length) * 100)
      setActiveDay(String(i + 1))
    }
  }

  // Copy an email
  const copyEmail = (index: number) => {
    const email = generatedEmails[index]
    if (!email) return

    const text = `Subject: ${email.subject}\n\n${email.body}`
    navigator.clipboard.writeText(text)
    setCopiedEmail(index)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // Reset everything
  const reset = () => {
    setAudience('')
    setStorm('')
    setArk('')
    setScarcity('')
    setSymptom('')
    setWisdom('')
    setMetaphor('')
    setGeneratedEmails([])
    setError(null)
    setShowTriangleInputs(false)
    setGenerationProgress(0)
  }

  // Handle Voice DNA
  const handleVoiceDNAUpload = (content: string, fileName: string) => {
    setVoiceDNAContent(content)
    setVoiceDNAFileName(fileName)
  }

  const handleVoiceDNAClear = () => {
    setVoiceDNAContent(null)
    setVoiceDNAFileName(null)
  }

  const isGenerating = currentlyGenerating !== null
  const canGenerate = audience.trim() && storm.trim() && ark.trim()

  return (
    <div className="tool-layout h-[calc(100vh-3.5rem)]">
      {/* Input Panel */}
      <div className="border-r border-border p-6 overflow-y-auto">
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Ship className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h1 className="text-h1">Noah's Ark Campaign</h1>
                <p className="text-text-secondary text-sm">
                  7-email urgency sequence for market shifts
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience *</Label>
              <Textarea
                id="audience"
                placeholder="Who are you writing to? (e.g., Small business owners who rely on Facebook ads)"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={isGenerating}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storm" className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-warning" />
                The Storm (Crisis/Change) *
              </Label>
              <Textarea
                id="storm"
                placeholder="What major change or crisis is coming to their market? (e.g., iOS privacy changes killing tracking, AI disrupting their industry)"
                value={storm}
                onChange={(e) => setStorm(e.target.value)}
                disabled={isGenerating}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ark" className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-success" />
                The Ark (Your Solution) *
              </Label>
              <Textarea
                id="ark"
                placeholder="What is your solution that helps them survive/thrive? (e.g., My email marketing system, my coaching program)"
                value={ark}
                onChange={(e) => setArk(e.target.value)}
                disabled={isGenerating}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scarcity" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-error" />
                Scarcity/Limits (Optional)
              </Label>
              <Textarea
                id="scarcity"
                placeholder="How many spots? Deadline? (e.g., Only 10 spots available, Doors close Friday at midnight)"
                value={scarcity}
                onChange={(e) => setScarcity(e.target.value)}
                disabled={isGenerating}
                className="min-h-[60px]"
              />
            </div>

            {/* Voice DNA (Optional) */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => setShowVoiceDNA(!showVoiceDNA)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">
                    Voice DNA
                  </span>
                  {voiceDNAContent ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-text-tertiary">(Optional)</span>
                  )}
                </div>
                {showVoiceDNA ? (
                  <ChevronUp className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
              </button>

              {showVoiceDNA && (
                <div className="px-3 pb-3 border-t border-border pt-3">
                  <p className="text-xs text-text-tertiary mb-3">
                    Upload your Voice DNA to generate emails in your unique writing style
                  </p>
                  <VoiceDNAUploader
                    currentContent={voiceDNAContent}
                    currentSource={voiceDNAFileName || undefined}
                    onUpload={handleVoiceDNAUpload}
                    onClear={handleVoiceDNAClear}
                    isLoading={isGenerating}
                  />
                </div>
              )}
            </div>

            {/* Triangle of Insight (Optional) */}
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
                    Add elements from your Triangle of Insight for more targeted messaging
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="symptom" className="text-sm">Symptom</Label>
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
                    <Label htmlFor="wisdom" className="text-sm">Wisdom</Label>
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
                    <Label htmlFor="metaphor" className="text-sm">Metaphor</Label>
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

            {/* Progress Bar */}
            {isGenerating && generationProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Generating campaign...</span>
                  <span className="text-accent">{Math.round(generationProgress)}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={generateAllEmails}
              disabled={isGenerating || !canGenerate}
              className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {currentlyGenerating?.replace(/-/g, ' ')}...
                </>
              ) : (
                <>
                  Generate 7-Email Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {generatedEmails.length > 0 && !isGenerating && (
              <Button
                variant="outline"
                onClick={reset}
                className="w-full"
              >
                Start New Campaign
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="p-6 overflow-y-auto bg-background-elevated">
        {/* Streaming Content */}
        {isGenerating && streamingContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Generating {currentlyGenerating?.replace(/-/g, ' ')}...
              </span>
            </div>
            <div className="prose-generated whitespace-pre-wrap text-sm">
              {streamingContent}
              <span className="inline-block w-0.5 h-5 bg-accent animate-typing-cursor ml-0.5" />
            </div>
          </div>
        )}

        {/* Generated Emails Tabs */}
        {!isGenerating && generatedEmails.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Your Noah's Ark Campaign</h2>
              <span className="text-sm text-text-secondary">
                {generatedEmails.length} of 7 emails
              </span>
            </div>

            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-7">
                {NOAHS_ARK_EMAIL_TYPES.map((type) => {
                  const hasEmail = generatedEmails.some((e) => e.type === type.id)
                  return (
                    <TabsTrigger
                      key={type.id}
                      value={String(type.dayNumber)}
                      disabled={!hasEmail}
                      className="text-xs"
                    >
                      Day {type.dayNumber}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {NOAHS_ARK_EMAIL_TYPES.map((type) => {
                const email = generatedEmails.find((e) => e.type === type.id)
                const emailIndex = generatedEmails.findIndex((e) => e.type === type.id)
                if (!email) return null

                return (
                  <TabsContent key={type.id} value={String(type.dayNumber)} className="mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-warning uppercase">
                                Day {type.dayNumber}: {type.name}
                              </span>
                            </div>
                            <div className="text-xs text-text-tertiary">
                              Subject Line
                            </div>
                            <CardTitle className="text-lg leading-tight">
                              {email.subject}
                            </CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyEmail(emailIndex)}
                            >
                              {copiedEmail === emailIndex ? (
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
                          </div>
                        </div>
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-4">
                        <div className="prose-generated whitespace-pre-wrap">
                          {email.body}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && generatedEmails.length === 0 && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <Ship className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-h2">Build Your Ark</h3>
              <p className="text-text-secondary">
                The Noah's Ark campaign creates urgency around real market shifts.
                Fill in your storm (the crisis), your ark (the solution), and generate
                a complete 7-email sequence that converts.
              </p>
              <div className="text-left bg-surface rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">The 7-Day Sequence:</p>
                <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                  <li>Storm Warning - Wake them up</li>
                  <li>Proof Points - Show the evidence</li>
                  <li>Ark Reveal - Present your solution</li>
                  <li>Passenger Profiles - Who belongs on board</li>
                  <li>Boarding Call - Open for enrollment</li>
                  <li>Urgency Escalation - Spots filling</li>
                  <li>Final Call - Last chance</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
