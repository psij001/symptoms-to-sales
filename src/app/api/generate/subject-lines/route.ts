import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import { buildSystemPrompt } from '@/lib/claude/context-builder'
import {
  SUBJECT_LINES_SYSTEM_PROMPT,
  SUBJECT_LINES_GENERATION_PROMPT,
} from '@/lib/prompts/subject-lines'
import type { Project, VoiceDNA, OfferContext } from '@/types/database'

type ProjectWithContext = Project & {
  voice_dna: VoiceDNA[]
  offer_contexts: OfferContext[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { audience, problem, t1Email, projectId } = body

    // Validate - need either audience+problem OR t1Email
    if (!t1Email && (!audience || !problem)) {
      return new Response(
        'Missing required fields: provide either (audience and problem) or t1Email',
        { status: 400 }
      )
    }

    // Get project context if provided
    let project: ProjectWithContext | null = null
    let voiceDNA: VoiceDNA | null = null
    let offerContext: OfferContext | null = null

    if (projectId) {
      const { data } = await supabase
        .from('projects')
        .select('*, voice_dna(*), offer_contexts(*)')
        .eq('id', projectId)
        .single()

      if (data) {
        const projectData = data as unknown as ProjectWithContext
        project = projectData
        voiceDNA =
          projectData.voice_dna?.find((v) => v.is_active) ??
          projectData.voice_dna?.[0] ??
          null
        offerContext =
          projectData.offer_contexts?.find((o) => o.is_active) ??
          projectData.offer_contexts?.[0] ??
          null
      }
    }

    // Build system prompt with context
    const toolPrompt = `${SUBJECT_LINES_SYSTEM_PROMPT}\n\n${SUBJECT_LINES_GENERATION_PROMPT}`
    const systemPrompt = project
      ? buildSystemPrompt({
          project,
          voiceDNA,
          offerContext,
          toolPrompt,
        })
      : toolPrompt

    // Build user message based on input type
    let userMessage: string

    if (t1Email) {
      userMessage = `Based on this T1 email, generate 10 symptomatic subject lines:

---
${t1Email}
---

Generate 10 subject lines that capture the essence of this email using observable symptoms and emotional triggers.`
    } else {
      userMessage = `Target Audience: ${audience}

Biggest Problem (Hell Island): ${problem}

Generate 10 symptomatic subject lines that speak directly to this audience's pain using observable symptoms.`
    }

    const claude = getClaudeClient()

    // Use Haiku for faster subject line generation
    const stream = await claude.messages.create({
      model: MODELS.HAIKU,
      max_tokens: 1500,
      stream: true,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    // Return as streaming response
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Error generating subject lines:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
