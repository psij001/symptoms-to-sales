import { TRAVIS_IP_FOUNDATION, FORBIDDEN_PATTERNS } from '@/lib/prompts/foundation'
import type { Project, VoiceDNA, OfferContext } from '@/types/database'

export interface ContextOptions {
  project: Project
  voiceDNA?: VoiceDNA | null
  offerContext?: OfferContext | null
  toolPrompt: string
}

/**
 * Builds a layered system prompt with all context for Claude
 *
 * Layer Structure:
 * 1. Travis IP Foundation - Core methodology (always present)
 * 2. Tool-specific prompt - The actual instructions for the tool
 * 3. Voice DNA - Writing style from uploaded documents
 * 4. Offer Context - Project-specific context and data
 * 5. Forbidden Patterns - Style rules to avoid
 */
export function buildSystemPrompt(options: ContextOptions): string {
  const { project, voiceDNA, offerContext, toolPrompt } = options

  const voiceSection = voiceDNA?.content_text
    ? `## VOICE DNA\n${voiceDNA.content_text}`
    : `## VOICE DNA\nUse conversational Travis-style voice. Direct, informal, with vivid sensory language. Write at a 6th-grade reading level.`

  const offerSection = offerContext?.content_json
    ? `## OFFER CONTEXT\n${JSON.stringify(offerContext.content_json, null, 2)}`
    : `## OFFER CONTEXT\nNo specific offer context provided. Focus on general principles and the audience description provided.`

  return `${TRAVIS_IP_FOUNDATION}

---

${toolPrompt}

---

${voiceSection}

${offerSection}

## PROJECT CONTEXT
- Project: ${project.name}
- Type: ${project.type}

---

${FORBIDDEN_PATTERNS}`
}

/**
 * Parse streaming response to extract numbered items
 */
export function parseNumberedList(text: string): string[] {
  const lines = text.split('\n')
  const items: string[] = []

  for (const line of lines) {
    // Match lines starting with number followed by . or )
    const match = line.match(/^\d+[\.\)]\s*(.+)/)
    if (match) {
      items.push(match[1].trim())
    }
  }

  return items
}
