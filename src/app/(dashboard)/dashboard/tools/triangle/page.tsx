'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, Copy, Check, Loader2, Triangle, Lightbulb, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3

interface TriangleResult {
  symptom: string
  wisdom: string
  metaphor: string
}

export default function TriangleOfInsightPage() {
  // Input state
  const [audience, setAudience] = useState('')
  const [problem, setProblem] = useState('')

  // Step state
  const [step, setStep] = useState<Step>(1)

  // Generated options
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [wisdoms, setWisdoms] = useState<string[]>([])
  const [metaphors, setMetaphors] = useState<string[]>([])

  // Selected items
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null)
  const [selectedWisdom, setSelectedWisdom] = useState<string | null>(null)
  const [selectedMetaphor, setSelectedMetaphor] = useState<string | null>(null)

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Parse numbered list from streamed content
  const parseNumberedList = useCallback((text: string): string[] => {
    const lines = text.split('\n')
    const items: string[] = []

    for (const line of lines) {
      // Match lines starting with number followed by . or )
      const match = line.match(/^\d+[\.\)]\s*(.+)/)
      if (match) {
        items.push(match[1].trim().replace(/^["']|["']$/g, ''))
      }
    }

    return items
  }, [])

  // Generate symptoms (Step 1)
  const generateSymptoms = async () => {
    if (!audience.trim() || !problem.trim()) {
      setError('Please fill in both the audience and problem fields')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setSymptoms([])

    try {
      const response = await fetch('/api/generate/triangle/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, problem }),
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
      const parsed = parseNumberedList(fullText)
      setSymptoms(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate symptoms')
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate wisdom (Step 2)
  const generateWisdom = async () => {
    if (!selectedSymptom) {
      setError('Please select a symptom first')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setWisdoms([])

    try {
      const response = await fetch('/api/generate/triangle/wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          problem,
          selectedSymptom,
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

      const parsed = parseNumberedList(fullText)
      setWisdoms(parsed)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wisdom')
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate metaphors (Step 3)
  const generateMetaphors = async () => {
    if (!selectedWisdom) {
      setError('Please select a wisdom first')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setMetaphors([])

    try {
      const response = await fetch('/api/generate/triangle/metaphor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          problem,
          selectedSymptom,
          selectedWisdom,
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

      const parsed = parseNumberedList(fullText)
      setMetaphors(parsed)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate metaphors')
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy final result
  const copyResult = () => {
    if (!selectedSymptom || !selectedWisdom || !selectedMetaphor) return

    const text = `TRIANGLE OF INSIGHT

SYMPTOM:
${selectedSymptom}

WISDOM:
${selectedWisdom}

METAPHOR:
${selectedMetaphor}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset to start
  const reset = () => {
    setStep(1)
    setSymptoms([])
    setWisdoms([])
    setMetaphors([])
    setSelectedSymptom(null)
    setSelectedWisdom(null)
    setSelectedMetaphor(null)
    setStreamingContent('')
    setError(null)
  }

  // Check if we have a complete result
  const hasCompleteResult = selectedSymptom && selectedWisdom && selectedMetaphor

  return (
    <div className="flex w-full h-[calc(100vh-3.5rem)]">
      {/* Input Panel - 40% */}
      <div className="w-2/5 min-w-0 shrink-0 border-r border-border p-6 overflow-y-auto">
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
            <h1 className="text-h1">Triangle of Insight</h1>
            <p className="text-text-secondary">
              Build powerful nurture content with symptom, wisdom, and metaphor.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <StepIndicator step={1} current={step} label="Symptom" />
            <div className="h-px flex-1 bg-border" />
            <StepIndicator step={2} current={step} label="Wisdom" />
            <div className="h-px flex-1 bg-border" />
            <StepIndicator step={3} current={step} label="Metaphor" />
          </div>

          <Separator />

          {/* Step 1: Initial Input */}
          {step === 1 && symptoms.length === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  placeholder="Describe your perfect customer avatar..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Biggest Problem (Hell Island)</Label>
                <Textarea
                  id="problem"
                  placeholder="What's the painful reality they're experiencing?"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[100px]"
                />
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <Button
                onClick={generateSymptoms}
                disabled={isGenerating || !audience.trim() || !problem.trim()}
                className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Symptoms
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Symptom Selection */}
          {step === 1 && symptoms.length > 0 && (
            <SelectionList
              title="Select Your Symptom"
              description="Choose the one that resonates most with your audience"
              items={symptoms}
              selected={selectedSymptom}
              onSelect={setSelectedSymptom}
              onNext={generateWisdom}
              isGenerating={isGenerating}
              icon={<Triangle className="h-4 w-4" />}
            />
          )}

          {/* Wisdom Selection */}
          {step === 2 && wisdoms.length > 0 && (
            <SelectionList
              title="Select Your Wisdom"
              description="Choose the insight that creates the biggest shift"
              items={wisdoms}
              selected={selectedWisdom}
              onSelect={setSelectedWisdom}
              onNext={generateMetaphors}
              onBack={() => setStep(1)}
              isGenerating={isGenerating}
              icon={<Lightbulb className="h-4 w-4" />}
            />
          )}

          {/* Metaphor Selection */}
          {step === 3 && metaphors.length > 0 && (
            <SelectionList
              title="Select Your Metaphor"
              description="Choose the one that makes the wisdom click"
              items={metaphors}
              selected={selectedMetaphor}
              onSelect={setSelectedMetaphor}
              onBack={() => setStep(2)}
              isGenerating={isGenerating}
              icon={<Sparkles className="h-4 w-4" />}
              isFinal
            />
          )}
        </div>
      </div>

      {/* Output Panel - 60% */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto bg-background-elevated">
        {/* Streaming Content */}
        {isGenerating && streamingContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
            <div className="prose-generated whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-0.5 h-5 bg-accent animate-typing-cursor ml-0.5" />
            </div>
          </div>
        )}

        {/* Final Result */}
        {!isGenerating && hasCompleteResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Your Triangle of Insight</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}>
                  {copied ? (
                    <>
                      <Check className="mr-1 h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  Start Over
                </Button>
              </div>
            </div>

            <Card className="border-l-4 border-l-project-personal">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                  <Triangle className="h-4 w-4" />
                  SYMPTOM
                </div>
                <p className="prose-generated">{selectedSymptom}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-project-partner">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                  <Lightbulb className="h-4 w-4" />
                  WISDOM
                </div>
                <p className="prose-generated">{selectedWisdom}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-project-client">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  METAPHOR
                </div>
                <p className="prose-generated">{selectedMetaphor}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !hasCompleteResult && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                <Triangle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-h2">Build Your Triangle</h3>
              <p className="text-text-secondary">
                Enter your audience and their biggest problem to generate
                powerful Triangle of Insight components.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Step Indicator Component
function StepIndicator({
  step,
  current,
  label,
}: {
  step: number
  current: number
  label: string
}) {
  const isActive = current === step
  const isComplete = current > step

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
          isComplete && 'bg-accent text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          !isActive && !isComplete && 'bg-surface text-text-secondary'
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : step}
      </div>
      <span
        className={cn(
          'text-xs',
          isActive || isComplete ? 'text-text-primary' : 'text-text-tertiary'
        )}
      >
        {label}
      </span>
    </div>
  )
}

// Selection List Component
function SelectionList({
  title,
  description,
  items,
  selected,
  onSelect,
  onNext,
  onBack,
  isGenerating,
  icon,
  isFinal,
}: {
  title: string
  description: string
  items: string[]
  selected: string | null
  onSelect: (item: string) => void
  onNext?: () => void
  onBack?: () => void
  isGenerating: boolean
  icon: React.ReactNode
  isFinal?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-h3">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-colors',
              selected === item
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-border-hover bg-background-elevated'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                  selected === item ? 'border-accent bg-accent' : 'border-border'
                )}
              >
                {selected === item && (
                  <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                )}
              </div>
              <span className="text-sm text-text-primary">{item}</span>
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={!selected || isGenerating}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Use Selected
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
        {isFinal && selected && (
          <Button
            disabled={!selected}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            <Check className="mr-2 h-4 w-4" />
            Complete Triangle
          </Button>
        )}
      </div>
    </div>
  )
}

// Need error variable in scope
let error: string | null = null
