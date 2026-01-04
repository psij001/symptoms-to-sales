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

        // Parse incrementally and update state as new items appear
        const currentParsed = parseNumberedList(fullText)
        setSymptoms(currentParsed)
      }

      // Final parse
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
    setWisdoms([])
    setStep(2)

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

        // Parse incrementally
        const currentParsed = parseNumberedList(fullText)
        setWisdoms(currentParsed)
      }

      const parsed = parseNumberedList(fullText)
      setWisdoms(parsed)
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
    setMetaphors([])
    setStep(3)

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

        // Parse incrementally
        const currentParsed = parseNumberedList(fullText)
        setMetaphors(currentParsed)
      }

      const parsed = parseNumberedList(fullText)
      setMetaphors(parsed)
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
    setError(null)
  }

  return (
    <div className="tool-layout h-[calc(100vh-3.5rem)]">
      {/* Input Panel - Left */}
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
          {step === 1 && symptoms.length === 0 && !isGenerating && (
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
                Generate Symptoms
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Symptom Selection - Step 1 */}
          {step === 1 && (symptoms.length > 0 || isGenerating) && (
            <SelectionList
              title="Select Your Symptom"
              description="Choose the one that resonates most with your audience"
              items={symptoms}
              selected={selectedSymptom}
              onSelect={setSelectedSymptom}
              onNext={generateWisdom}
              isGenerating={isGenerating}
              icon={<Triangle className="h-4 w-4" />}
              error={error}
            />
          )}

          {/* Wisdom Selection - Step 2 */}
          {step === 2 && (
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
              error={error}
            />
          )}

          {/* Metaphor Selection - Step 3 */}
          {step === 3 && (
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
              error={error}
            />
          )}
        </div>
      </div>

      {/* Living Canvas - Right Panel */}
      <div className="p-6 overflow-y-auto bg-background-elevated">
        <TriangleCanvas
          symptom={selectedSymptom}
          wisdom={selectedWisdom}
          metaphor={selectedMetaphor}
          currentStep={step}
          isGenerating={isGenerating}
          onCopy={copyResult}
          onReset={reset}
          copied={copied}
        />
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

// Triangle Canvas - Living Document on Right Panel
function TriangleCanvas({
  symptom,
  wisdom,
  metaphor,
  currentStep,
  isGenerating,
  onCopy,
  onReset,
  copied,
}: {
  symptom: string | null
  wisdom: string | null
  metaphor: string | null
  currentStep: Step
  isGenerating: boolean
  onCopy: () => void
  onReset: () => void
  copied: boolean
}) {
  const isComplete = symptom && wisdom && metaphor

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Triangle className="h-5 w-5 text-accent" />
          <h2 className="text-h2">Your Triangle</h2>
        </div>
        {isComplete && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}>
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
            <Button variant="outline" size="sm" onClick={onReset}>
              Start Over
            </Button>
          </div>
        )}
      </div>

      {/* Symptom Slot */}
      <TriangleSlot
        label="SYMPTOM"
        icon={<Triangle className="h-4 w-4" />}
        value={symptom}
        color="border-l-project-personal"
        placeholder="Select a symptom from the options"
        isActive={currentStep === 1}
        isGenerating={isGenerating && currentStep === 1}
      />

      {/* Wisdom Slot */}
      <TriangleSlot
        label="WISDOM"
        icon={<Lightbulb className="h-4 w-4" />}
        value={wisdom}
        color="border-l-project-partner"
        placeholder={symptom ? "Select wisdom from the options" : "Complete symptom first"}
        isActive={currentStep === 2}
        isGenerating={isGenerating && currentStep === 2}
        isLocked={!symptom}
      />

      {/* Metaphor Slot */}
      <TriangleSlot
        label="METAPHOR"
        icon={<Sparkles className="h-4 w-4" />}
        value={metaphor}
        color="border-l-project-client"
        placeholder={wisdom ? "Select metaphor from the options" : "Complete wisdom first"}
        isActive={currentStep === 3}
        isGenerating={isGenerating && currentStep === 3}
        isLocked={!wisdom}
      />
    </div>
  )
}

// Triangle Slot Component - Individual slot in the canvas
function TriangleSlot({
  label,
  icon,
  value,
  color,
  placeholder,
  isActive,
  isGenerating,
  isLocked,
}: {
  label: string
  icon: React.ReactNode
  value: string | null
  color: string
  placeholder: string
  isActive?: boolean
  isGenerating?: boolean
  isLocked?: boolean
}) {
  if (value) {
    // Filled state - show the selected value
    return (
      <Card className={cn("border-l-4 transition-all", color)}>
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
            {icon}
            {label}
          </div>
          <p className="prose-generated">{value}</p>
        </CardContent>
      </Card>
    )
  }

  // Empty/placeholder state
  return (
    <Card
      className={cn(
        "border-l-4 border-dashed transition-all",
        isLocked && "opacity-50",
        isActive && !isLocked ? "border-accent/50 bg-accent/5" : "border-border"
      )}
    >
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-text-tertiary text-sm font-medium">
          {icon}
          {label}
        </div>
        <p className="text-sm text-text-tertiary">
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating options...
            </span>
          ) : (
            placeholder
          )}
        </p>
      </CardContent>
    </Card>
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
  error,
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
  error?: string | null
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

      {/* Loading state while generating */}
      {isGenerating && items.length === 0 && (
        <div className="flex items-center gap-2 text-text-secondary py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating options...</span>
        </div>
      )}

      {/* Options list with staggered animation */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-all animate-fade-in',
              selected === item
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-border-hover bg-background-elevated'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
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

      {/* Still generating indicator */}
      {isGenerating && items.length > 0 && (
        <div className="flex items-center gap-2 text-text-tertiary text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading more options...</span>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Navigation buttons */}
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
