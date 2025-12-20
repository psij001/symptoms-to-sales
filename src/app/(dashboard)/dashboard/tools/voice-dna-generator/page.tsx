'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  FileText,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Fingerprint,
  CheckCircle2,
  Download,
  Copy,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VOICE_DNA_STEPS } from '@/lib/prompts/voice-dna-generator'

interface WritingSample {
  id: string
  name: string
  content: string
  voiceAnalysis?: string
  styleAnalysis?: string
}

type StepId = 'upload' | 'voice' | 'style' | 'generate'

export default function VoiceDNAGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<StepId>('upload')
  const [samples, setSamples] = useState<WritingSample[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(0)
  const [consolidatedVoice, setConsolidatedVoice] = useState('')
  const [consolidatedStyle, setConsolidatedStyle] = useState('')
  const [finalVoiceDNA, setFinalVoiceDNA] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const currentStepIndex = VOICE_DNA_STEPS.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / VOICE_DNA_STEPS.length) * 100

  // File handling
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError('')
    const fileArray = Array.from(files)
    const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    for (const file of fileArray) {
      const isValidType =
        validTypes.includes(file.type) ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md')

      if (!isValidType) {
        setError(`Invalid file type: ${file.name}. Only PDF, DOCX, TXT, and MD files are supported.`)
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`)
        continue
      }

      try {
        let content = ''

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
          // Parse PDF or DOCX
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/voice-dna/parse', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to parse file')
          }

          const data = await response.json()
          content = data.content
        } else {
          // Read text file
          content = await file.text()
        }

        const newSample: WritingSample = {
          id: crypto.randomUUID(),
          name: file.name,
          content: content.trim(),
        }

        setSamples((prev) => {
          if (prev.length >= 5) {
            setError('Maximum 5 samples allowed')
            return prev
          }
          return [...prev, newSample]
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file')
      }
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const removeSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id))
  }

  // Analysis functions
  const analyzeVoice = async () => {
    setIsProcessing(true)
    setError('')

    try {
      for (let i = 0; i < samples.length; i++) {
        setProcessingIndex(i)
        const sample = samples[i]

        const response = await fetch('/api/generate/voice-dna/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleContent: sample.content,
            analysisType: 'voice',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to analyze sample: ${sample.name}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream')

        let analysis = ''
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          analysis += decoder.decode(value, { stream: true })

          // Update sample with partial analysis
          setSamples((prev) =>
            prev.map((s) =>
              s.id === sample.id ? { ...s, voiceAnalysis: analysis } : s
            )
          )
        }
      }

      // Consolidate voice traits
      const allVoiceTraits = samples
        .map((s) => s.voiceAnalysis)
        .filter(Boolean) as string[]

      const consolidateResponse = await fetch('/api/generate/voice-dna/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationType: 'voice',
          voiceTraits: allVoiceTraits,
        }),
      })

      if (!consolidateResponse.ok) {
        throw new Error('Failed to consolidate voice traits')
      }

      const reader = consolidateResponse.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let consolidated = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        consolidated += decoder.decode(value, { stream: true })
        setConsolidatedVoice(consolidated)
      }

      setCurrentStep('style')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeStyle = async () => {
    setIsProcessing(true)
    setError('')

    try {
      for (let i = 0; i < samples.length; i++) {
        setProcessingIndex(i)
        const sample = samples[i]

        const response = await fetch('/api/generate/voice-dna/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleContent: sample.content,
            analysisType: 'style',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to analyze sample: ${sample.name}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream')

        let analysis = ''
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          analysis += decoder.decode(value, { stream: true })

          setSamples((prev) =>
            prev.map((s) =>
              s.id === sample.id ? { ...s, styleAnalysis: analysis } : s
            )
          )
        }
      }

      // Consolidate style traits
      const allStyleTraits = samples
        .map((s) => s.styleAnalysis)
        .filter(Boolean) as string[]

      const consolidateResponse = await fetch('/api/generate/voice-dna/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationType: 'style',
          styleTraits: allStyleTraits,
        }),
      })

      if (!consolidateResponse.ok) {
        throw new Error('Failed to consolidate style traits')
      }

      const reader = consolidateResponse.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let consolidated = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        consolidated += decoder.decode(value, { stream: true })
        setConsolidatedStyle(consolidated)
      }

      setCurrentStep('generate')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateFinalDNA = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/generate/voice-dna/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationType: 'final',
          voiceTraits: consolidatedVoice,
          styleTraits: consolidatedStyle,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate Voice DNA document')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let dna = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        dna += decoder.decode(value, { stream: true })
        setFinalVoiceDNA(dna)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalVoiceDNA)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = finalVoiceDNA
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const downloadAsTxt = () => {
    const blob = new Blob([finalVoiceDNA], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'voice-dna.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canProceed =
    currentStep === 'upload'
      ? samples.length >= 3
      : currentStep === 'voice'
        ? !!consolidatedVoice
        : currentStep === 'style'
          ? !!consolidatedStyle
          : !!finalVoiceDNA

  return (
    <div className="container max-w-4xl py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Voice DNA Generator</h1>
            <p className="text-muted-foreground">
              Create your unique Voice DNA from writing samples
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {VOICE_DNA_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center gap-1 text-center',
                    index <= currentStepIndex
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                      index < currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStepIndex
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload Writing Samples</CardTitle>
            <CardDescription>
              Add 3-5 samples of writing that represent the target voice. Use content
              that shows off the unique style - newsletters, emails, blog posts, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop files here, or
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = '.pdf,.docx,.txt,.md'
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleFiles(files)
                  }
                  input.click()
                }}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOCX, TXT, or MD files up to 5MB each
              </p>
            </div>

            {/* Sample List */}
            {samples.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Uploaded Samples ({samples.length}/5)
                </p>
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{sample.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(sample.content.length / 1000)}k chars)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSample(sample.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button onClick={analyzeVoice} disabled={!canProceed || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Voice ({processingIndex + 1}/{samples.length})
                  </>
                ) : (
                  <>
                    Analyze Voice
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'voice' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Voice Analysis</CardTitle>
            <CardDescription>
              Consolidated voice traits identified across your writing samples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Consolidated Voice Traits</h4>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm">
                  {consolidatedVoice || 'Analyzing...'}
                </pre>
              </div>
            </div>

            {/* Individual analyses (collapsed) */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View individual sample analyses
              </summary>
              <div className="mt-2 space-y-2">
                {samples.map((sample) => (
                  <div key={sample.id} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">{sample.name}</p>
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {sample.voiceAnalysis || 'Not analyzed yet'}
                    </pre>
                  </div>
                ))}
              </div>
            </details>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('upload')}
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={analyzeStyle} disabled={!canProceed || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Style ({processingIndex + 1}/{samples.length})
                  </>
                ) : (
                  <>
                    Analyze Style
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'style' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Style Analysis</CardTitle>
            <CardDescription>
              Technical style attributes identified in your writing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Consolidated Style Attributes</h4>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm">
                  {consolidatedStyle || 'Analyzing...'}
                </pre>
              </div>
            </div>

            {/* Individual analyses (collapsed) */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View individual sample analyses
              </summary>
              <div className="mt-2 space-y-2">
                {samples.map((sample) => (
                  <div key={sample.id} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">{sample.name}</p>
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {sample.styleAnalysis || 'Not analyzed yet'}
                    </pre>
                  </div>
                ))}
              </div>
            </details>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('voice')}
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={generateFinalDNA} disabled={!canProceed || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Voice DNA...
                  </>
                ) : (
                  <>
                    Generate Voice DNA
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'generate' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Your Voice DNA</CardTitle>
            <CardDescription>
              Your complete Voice DNA document - ready to use with AI writing tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {finalVoiceDNA ? (
              <>
                <Textarea
                  value={finalVoiceDNA}
                  onChange={(e) => setFinalVoiceDNA(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button onClick={downloadAsTxt} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download as TXT
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Generating your Voice DNA document...
                    </p>
                  </div>
                ) : (
                  <Button onClick={generateFinalDNA}>
                    Generate Voice DNA
                  </Button>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('style')}
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  // Reset and start over
                  setSamples([])
                  setConsolidatedVoice('')
                  setConsolidatedStyle('')
                  setFinalVoiceDNA('')
                  setCurrentStep('upload')
                }}
              >
                Start New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
