'use client'

import { useState, useCallback, useRef } from 'react'
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
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VOICE_DNA_STEPS } from '@/lib/prompts/voice-dna-generator'

interface WritingSample {
  id: string
  name: string
  content: string
  voiceAnalysis?: string
  styleAnalysis?: string
  analysisError?: string
}

// Constants for timeout and retry
const TIMEOUT_MS = 120000 // 2 minutes
const MAX_RETRIES = 1
const STATE_UPDATE_INTERVAL_MS = 300 // Batch state updates

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
  const [processingPhase, setProcessingPhase] = useState('')
  const [failedSamples, setFailedSamples] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

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

  // Helper function to read stream with timeout and batched updates
  const readStreamWithTimeout = async (
    response: Response,
    timeoutMs: number,
    signal: AbortSignal,
    onProgress?: (data: string) => void
  ): Promise<{ success: boolean; data: string; error?: string; timedOut?: boolean }> => {
    const reader = response.body?.getReader()
    if (!reader) {
      return { success: false, data: '', error: 'No response stream' }
    }

    const decoder = new TextDecoder()
    let accumulated = ''
    let lastUpdate = Date.now()

    try {
      while (true) {
        // Create a timeout promise that rejects
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
        })

        // Race between read and timeout
        const readResult = await Promise.race([
          reader.read(),
          timeoutPromise
        ])

        if (signal.aborted) {
          reader.cancel()
          return { success: false, data: accumulated, error: 'Aborted' }
        }

        const { done, value } = readResult as ReadableStreamReadResult<Uint8Array>
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

        // Batched state updates (every 300ms)
        if (onProgress && Date.now() - lastUpdate > STATE_UPDATE_INTERVAL_MS) {
          onProgress(accumulated)
          lastUpdate = Date.now()
        }
      }

      // Final update
      if (onProgress) {
        onProgress(accumulated)
      }

      return { success: true, data: accumulated }
    } catch (err) {
      reader.cancel()
      if (err instanceof Error && err.message === 'TIMEOUT') {
        return { success: false, data: accumulated, error: 'Request timed out', timedOut: true }
      }
      return { success: false, data: accumulated, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  // Cancel ongoing analysis
  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsProcessing(false)
      setProcessingPhase('')
      setError('Analysis cancelled')
    }
  }

  // Analyze a single sample with retry logic
  const analyzeSampleWithRetry = async (
    sample: WritingSample,
    analysisType: 'voice' | 'style',
    onPartialUpdate: (analysis: string) => void
  ): Promise<{ success: boolean; data: string; error?: string }> => {
    let attempts = 0
    const field = analysisType === 'voice' ? 'voiceAnalysis' : 'styleAnalysis'

    while (attempts <= MAX_RETRIES) {
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setProcessingPhase(
          attempts > 0
            ? `Retrying ${analysisType} analysis (attempt ${attempts + 1})...`
            : analysisType === 'voice'
              ? 'Identifying voice patterns...'
              : 'Analyzing style categories...'
        )

        const response = await fetch('/api/generate/voice-dna/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleContent: sample.content,
            analysisType,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to analyze sample: ${sample.name}`)
        }

        setProcessingPhase(
          analysisType === 'voice' ? 'Extracting voice traits...' : 'Categorizing style attributes...'
        )

        const result = await readStreamWithTimeout(
          response,
          TIMEOUT_MS,
          controller.signal,
          (accumulated) => {
            onPartialUpdate(accumulated)
            setSamples((prev) =>
              prev.map((s) =>
                s.id === sample.id ? { ...s, [field]: accumulated } : s
              )
            )
          }
        )

        if (result.success) {
          return { success: true, data: result.data }
        }

        // If timed out and we have retries left
        if (result.timedOut && attempts < MAX_RETRIES) {
          attempts++
          continue
        }

        return { success: false, data: result.data, error: result.error }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, data: '', error: 'Cancelled' }
        }
        if (attempts < MAX_RETRIES) {
          attempts++
          continue
        }
        return {
          success: false,
          data: '',
          error: err instanceof Error ? err.message : 'Analysis failed'
        }
      }
    }

    return { success: false, data: '', error: 'Max retries exceeded' }
  }

  // Analysis functions
  const analyzeVoice = async () => {
    setIsProcessing(true)
    setError('')
    setFailedSamples([])
    setProcessingPhase('Starting voice analysis...')

    const failedIds: string[] = []

    try {
      for (let i = 0; i < samples.length; i++) {
        setProcessingIndex(i)
        const sample = samples[i]

        const result = await analyzeSampleWithRetry(sample, 'voice', () => {})

        if (!result.success) {
          failedIds.push(sample.id)
          setSamples((prev) =>
            prev.map((s) =>
              s.id === sample.id
                ? { ...s, analysisError: result.error || 'Analysis failed' }
                : s
            )
          )
          continue // Continue with other samples
        }
      }

      // Check if any samples failed
      if (failedIds.length > 0) {
        setFailedSamples(failedIds)
        const successCount = samples.length - failedIds.length

        if (successCount === 0) {
          setError(`All ${failedIds.length} sample(s) failed to analyze. Click retry to try again.`)
          return
        }
      }

      // Get successful analyses for consolidation
      const successfulVoiceTraits = samples
        .filter((s) => !failedIds.includes(s.id) && s.voiceAnalysis)
        .map((s) => s.voiceAnalysis) as string[]

      if (successfulVoiceTraits.length === 0) {
        setError('No samples were successfully analyzed')
        return
      }

      // Consolidate voice traits
      setProcessingPhase('Consolidating voice traits...')
      const controller = new AbortController()
      abortControllerRef.current = controller

      const consolidateResponse = await fetch('/api/generate/voice-dna/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationType: 'voice',
          voiceTraits: successfulVoiceTraits,
        }),
        signal: controller.signal,
      })

      if (!consolidateResponse.ok) {
        throw new Error('Failed to consolidate voice traits')
      }

      const consolidateResult = await readStreamWithTimeout(
        consolidateResponse,
        TIMEOUT_MS,
        controller.signal,
        setConsolidatedVoice
      )

      if (!consolidateResult.success) {
        throw new Error(consolidateResult.error || 'Failed to consolidate voice traits')
      }

      setProcessingPhase('')
      setCurrentStep('style')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Analysis was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      }
    } finally {
      setIsProcessing(false)
      setProcessingPhase('')
      abortControllerRef.current = null
    }
  }

  const analyzeStyle = async () => {
    setIsProcessing(true)
    setError('')
    setFailedSamples([])
    setProcessingPhase('Starting style analysis...')

    const failedIds: string[] = []

    try {
      for (let i = 0; i < samples.length; i++) {
        setProcessingIndex(i)
        const sample = samples[i]

        const result = await analyzeSampleWithRetry(sample, 'style', () => {})

        if (!result.success) {
          failedIds.push(sample.id)
          setSamples((prev) =>
            prev.map((s) =>
              s.id === sample.id
                ? { ...s, analysisError: result.error || 'Analysis failed' }
                : s
            )
          )
          continue // Continue with other samples
        }
      }

      // Check if any samples failed
      if (failedIds.length > 0) {
        setFailedSamples(failedIds)
        const successCount = samples.length - failedIds.length

        if (successCount === 0) {
          setError(`All ${failedIds.length} sample(s) failed to analyze. Click retry to try again.`)
          return
        }
      }

      // Get successful analyses for consolidation
      const successfulStyleTraits = samples
        .filter((s) => !failedIds.includes(s.id) && s.styleAnalysis)
        .map((s) => s.styleAnalysis) as string[]

      if (successfulStyleTraits.length === 0) {
        setError('No samples were successfully analyzed')
        return
      }

      // Consolidate style traits
      setProcessingPhase('Consolidating style attributes...')
      const controller = new AbortController()
      abortControllerRef.current = controller

      const consolidateResponse = await fetch('/api/generate/voice-dna/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationType: 'style',
          styleTraits: successfulStyleTraits,
        }),
        signal: controller.signal,
      })

      if (!consolidateResponse.ok) {
        throw new Error('Failed to consolidate style traits')
      }

      const consolidateResult = await readStreamWithTimeout(
        consolidateResponse,
        TIMEOUT_MS,
        controller.signal,
        setConsolidatedStyle
      )

      if (!consolidateResult.success) {
        throw new Error(consolidateResult.error || 'Failed to consolidate style traits')
      }

      setProcessingPhase('')
      setCurrentStep('generate')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Analysis was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      }
    } finally {
      setIsProcessing(false)
      setProcessingPhase('')
      abortControllerRef.current = null
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
      ? samples.length >= 1
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
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              {failedSamples.length > 0 && !isProcessing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError('')
                      setFailedSamples([])
                      if (currentStep === 'upload' || currentStep === 'voice') {
                        analyzeVoice()
                      } else {
                        analyzeStyle()
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry All
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Analysis Progress</h4>
                <Button variant="ghost" size="sm" onClick={cancelAnalysis}>
                  Cancel
                </Button>
              </div>
              <div className="space-y-2">
                {samples.map((sample, idx) => (
                  <div
                    key={sample.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      idx === processingIndex && 'border-primary bg-primary/5',
                      idx < processingIndex && !sample.analysisError && 'border-green-500/50 bg-green-500/5',
                      sample.analysisError && 'border-destructive/50 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sample.analysisError ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : idx < processingIndex ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : idx === processingIndex ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                      <span className="text-sm font-medium">
                        Sample {idx + 1}: {sample.name}
                      </span>
                    </div>
                    {idx === processingIndex && processingPhase && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {processingPhase}
                      </p>
                    )}
                    {sample.analysisError && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        {sample.analysisError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {processingIndex >= samples.length && processingPhase && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {processingPhase}
                </div>
              )}
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
              Add 1-5 samples of writing that represent the target voice. More samples
              improve accuracy. Use newsletters, emails, blog posts, etc.
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
