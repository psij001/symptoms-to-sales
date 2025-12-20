'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface VoiceDNAUploaderProps {
  /** Current Voice DNA content (from project or session) */
  currentContent?: string | null
  /** Label for the current source (e.g., "Project: My Campaign") */
  currentSource?: string
  /** Callback when new Voice DNA is uploaded */
  onUpload: (content: string, fileName: string) => void
  /** Callback when Voice DNA is cleared */
  onClear?: () => void
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Compact mode for inline display */
  compact?: boolean
}

export function VoiceDNAUploader({
  currentContent,
  currentSource,
  onUpload,
  onClear,
  isLoading = false,
  compact = false,
}: VoiceDNAUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      // Validate file type
      const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const validExtensions = ['.pdf', '.txt', '.md', '.docx']
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        throw new Error('Please upload a PDF, DOCX, TXT, or MD file')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File must be less than 5MB')
      }

      let content: string

      if (file.type === 'application/pdf' || fileExtension === '.pdf' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === '.docx') {
        // Parse PDF or DOCX via API
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
        // Read text file directly
        content = await file.text()
      }

      if (!content || content.trim().length === 0) {
        throw new Error('File appears to be empty')
      }

      setUploadedFileName(file.name)
      onUpload(content, file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [processFile])

  const handleClear = useCallback(() => {
    setUploadedFileName(null)
    setError(null)
    onClear?.()
  }, [onClear])

  // Show current Voice DNA status
  const hasContent = currentContent && currentContent.trim().length > 0

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {hasContent ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success" />
              <span className="text-text-secondary">
                {uploadedFileName || currentSource || 'Voice DNA loaded'}
              </span>
            </div>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing || isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              className="pointer-events-none"
              disabled={isProcessing || isLoading}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Voice DNA
                </>
              )}
            </Button>
          </label>
        )}
      </div>
    )
  }

  return (
    <Card className={`transition-all ${isDragging ? 'border-accent' : ''}`}>
      <CardContent className="p-4">
        {hasContent ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Voice DNA Active</p>
                  <p className="text-text-tertiary text-xs">
                    {uploadedFileName || currentSource || 'Custom Voice DNA'}
                  </p>
                </div>
              </div>
              {onClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto p-1 text-text-tertiary hover:text-error"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Preview */}
            <div className="bg-surface rounded-md p-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-6">
                {currentContent.slice(0, 500)}
                {currentContent.length > 500 && '...'}
              </p>
            </div>

            {/* Replace option */}
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full pointer-events-none"
                disabled={isProcessing || isLoading}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Replace Voice DNA
                  </>
                )}
              </Button>
            </label>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center
              transition-all cursor-pointer
              ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-border-hover'}
            `}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || isLoading}
              />
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 text-accent animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-text-tertiary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isProcessing ? 'Processing...' : 'Upload Voice DNA'}
                  </p>
                  <p className="text-text-tertiary text-xs mt-1">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-text-tertiary text-xs">
                    PDF, DOCX, TXT, or MD (max 5MB)
                  </p>
                </div>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-md">
            <p className="text-error text-xs">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
