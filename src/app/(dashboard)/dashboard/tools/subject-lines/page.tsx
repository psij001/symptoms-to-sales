'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Heart,
  CopyCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubjectLine {
  text: string
  framework: string
}

export default function SubjectLinesPage() {
  // Input mode
  const [inputMode, setInputMode] = useState<'audience' | 't1'>('audience')

  // Input state
  const [audience, setAudience] = useState('')
  const [problem, setProblem] = useState('')
  const [t1Email, setT1Email] = useState('')

  // Generated content
  const [subjectLines, setSubjectLines] = useState<SubjectLine[]>([])

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  // Parse subject lines from streamed content
  const parseSubjectLines = useCallback((text: string): SubjectLine[] => {
    const lines = text.split('\n')
    const subjectLines: SubjectLine[] = []

    for (const line of lines) {
      // Match lines starting with number followed by . or )
      // Expected format: "1. Subject line here (H.I.)"
      const match = line.match(/^\d+[\.\)]\s*(.+?)\s*\(([A-Z\.]+)\)?\s*$/)
      if (match) {
        subjectLines.push({
          text: match[1].trim().replace(/^["']|["']$/g, ''),
          framework: match[2] || '',
        })
      } else {
        // Try simpler match without framework tag
        const simpleMatch = line.match(/^\d+[\.\)]\s*(.+)/)
        if (simpleMatch) {
          const textContent = simpleMatch[1].trim()
          // Check if there's a framework tag at the end
          const frameworkMatch = textContent.match(/\(([A-Z\.]+)\)$/)
          if (frameworkMatch) {
            subjectLines.push({
              text: textContent.replace(/\s*\([A-Z\.]+\)$/, '').trim(),
              framework: frameworkMatch[1],
            })
          } else {
            subjectLines.push({
              text: textContent.replace(/^["']|["']$/g, ''),
              framework: '',
            })
          }
        }
      }
    }

    return subjectLines
  }, [])

  // Generate subject lines
  const generateSubjectLines = async () => {
    if (inputMode === 'audience' && (!audience.trim() || !problem.trim())) {
      setError('Please fill in both the audience and problem fields')
      return
    }
    if (inputMode === 't1' && !t1Email.trim()) {
      setError('Please paste a T1 email')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setSubjectLines([])
    setFavorites(new Set())

    try {
      const response = await fetch('/api/generate/subject-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          inputMode === 'audience'
            ? { audience, problem }
            : { t1Email }
        ),
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
      const parsed = parseSubjectLines(fullText)
      setSubjectLines(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate subject lines')
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy a single subject line
  const copySubjectLine = (index: number) => {
    const line = subjectLines[index]
    if (!line) return

    navigator.clipboard.writeText(line.text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Copy all subject lines
  const copyAll = () => {
    const text = subjectLines.map((line, i) => `${i + 1}. ${line.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  // Toggle favorite
  const toggleFavorite = (index: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(index)) {
      newFavorites.delete(index)
    } else {
      newFavorites.add(index)
    }
    setFavorites(newFavorites)
  }

  // Reset everything
  const reset = () => {
    setAudience('')
    setProblem('')
    setT1Email('')
    setSubjectLines([])
    setStreamingContent('')
    setError(null)
    setFavorites(new Set())
  }

  // Get framework badge color
  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'H.I.':
        return 'bg-red-500/20 text-red-400'
      case 'O':
        return 'bg-orange-500/20 text-orange-400'
      case 'P':
        return 'bg-green-500/20 text-green-400'
      case 'S':
        return 'bg-purple-500/20 text-purple-400'
      default:
        return 'bg-text-tertiary/20 text-text-tertiary'
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Input Panel - 40% */}
      <div className="w-[40%] border-r border-border p-6 overflow-y-auto">
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
            <h1 className="text-h1">Subject Lines</h1>
            <p className="text-text-secondary">
              Generate 10 symptomatic, curiosity-driven subject lines using the H.I./O/P framework.
            </p>
          </div>

          <Separator />

          {/* Input Mode Tabs */}
          {subjectLines.length === 0 && (
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'audience' | 't1')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="audience">From Audience</TabsTrigger>
                <TabsTrigger value="t1">From T1 Email</TabsTrigger>
              </TabsList>

              <TabsContent value="audience" className="mt-4 space-y-4">
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
              </TabsContent>

              <TabsContent value="t1" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="t1Email">T1 Email</Label>
                  <Textarea
                    id="t1Email"
                    placeholder="Paste your polished T1 email here..."
                    value={t1Email}
                    onChange={(e) => setT1Email(e.target.value)}
                    disabled={isGenerating}
                    className="min-h-[240px]"
                  />
                  <p className="text-xs text-text-tertiary">
                    Tip: Use a polished T1, not a raw draft
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Generate Button */}
          {subjectLines.length === 0 && (
            <div className="space-y-2">
              {error && <p className="text-sm text-error">{error}</p>}

              <Button
                onClick={generateSubjectLines}
                disabled={
                  isGenerating ||
                  (inputMode === 'audience' && (!audience.trim() || !problem.trim())) ||
                  (inputMode === 't1' && !t1Email.trim())
                }
                className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate 10 Subject Lines
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Post-Generation State */}
          {subjectLines.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  10 subject lines generated
                </span>
              </div>

              <p className="text-sm text-text-secondary">
                Click any subject line to copy it. Use the heart to mark your favorites.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="flex-1">
                  Start Over
                </Button>
                <Button
                  onClick={generateSubjectLines}
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
      <div className="w-[60%] p-6 overflow-y-auto bg-background-elevated">
        {/* Streaming Content */}
        {isGenerating && streamingContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating subject lines...</span>
            </div>
            <div className="prose-generated whitespace-pre-wrap text-sm">
              {streamingContent}
              <span className="inline-block w-0.5 h-5 bg-accent animate-typing-cursor ml-0.5" />
            </div>
          </div>
        )}

        {/* Subject Lines List */}
        {!isGenerating && subjectLines.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Your Subject Lines</h2>
              <Button variant="outline" size="sm" onClick={copyAll}>
                {copiedAll ? (
                  <>
                    <CopyCheck className="mr-1 h-4 w-4 text-success" />
                    Copied All!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {subjectLines.map((line, index) => (
                <Card
                  key={index}
                  className={cn(
                    'transition-colors cursor-pointer group',
                    favorites.has(index) && 'border-accent/50 bg-accent/5'
                  )}
                  onClick={() => copySubjectLine(index)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-sm font-medium text-text-tertiary w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary truncate">{line.text}</p>
                    </div>
                    {line.framework && (
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          getFrameworkColor(line.framework)
                        )}
                      >
                        {line.framework}
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 text-text-tertiary" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(index)
                      }}
                      className="p-1 hover:bg-surface rounded"
                    >
                      <Heart
                        className={cn(
                          'h-4 w-4 transition-colors',
                          favorites.has(index)
                            ? 'fill-accent text-accent'
                            : 'text-text-tertiary hover:text-accent'
                        )}
                      />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {favorites.size > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  {favorites.size} favorite{favorites.size !== 1 ? 's' : ''} marked
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && subjectLines.length === 0 && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-h2">Generate Subject Lines</h3>
              <p className="text-text-secondary">
                {inputMode === 'audience'
                  ? 'Enter your target audience and their biggest problem to generate 10 curiosity-driven subject lines.'
                  : 'Paste a polished T1 email to generate matching subject lines that capture its essence.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
