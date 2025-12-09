import Anthropic from '@anthropic-ai/sdk'

// Server-side only - do not import in client components
export function getClaudeClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}

// Model constants
export const MODELS = {
  // Best writing quality - use for T1 emails, Triangle outputs
  SONNET: 'claude-sonnet-4-20250514',
  // Fast, pattern-based - use for subject lines
  HAIKU: 'claude-3-5-haiku-20241022',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]
