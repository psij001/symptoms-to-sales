import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import { buildSystemPrompt } from '@/lib/claude/context-builder'
import {
  T1_SYSTEM_PROMPT,
  T1_GENERATION_PROMPT,
  EMAIL_TYPE_PROMPTS,
  type EmailTypeId,
} from '@/lib/prompts/t1-email'
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
    const {
      emailType,
      audience,
      problem,
      symptom,
      wisdom,
      metaphor,
      projectId,
    } = body

    // Validate required fields
    if (!emailType || !audience || !problem) {
      return new Response(
        'Missing required fields: emailType, audience, and problem',
        { status: 400 }
      )
    }

    // Validate email type
    const validEmailTypes: EmailTypeId[] = [
      'rsvp',
      'hell-island',
      'heaven-island',
      'mechanism',
      'shark-killer',
      'fence-tipper',
      'pre-t1',
    ]
    if (!validEmailTypes.includes(emailType)) {
      return new Response(`Invalid email type: ${emailType}`, { status: 400 })
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

    // Get type-specific prompt
    const emailTypePrompt = EMAIL_TYPE_PROMPTS[emailType as EmailTypeId]

    // Build system prompt with context
    const toolPrompt = `${T1_SYSTEM_PROMPT}\n\n${emailTypePrompt}\n\n${T1_GENERATION_PROMPT}`
    const systemPrompt = project
      ? buildSystemPrompt({
          project,
          voiceDNA,
          offerContext,
          toolPrompt,
        })
      : toolPrompt

    // Build user message with Triangle of Insight context
    let userMessage = `Target Audience: ${audience}

Biggest Problem (Hell Island): ${problem}`

    if (symptom) {
      userMessage += `\n\nSelected Symptom: "${symptom}"`
    }
    if (wisdom) {
      userMessage += `\n\nCounterIntuitive Wisdom: "${wisdom}"`
    }
    if (metaphor) {
      userMessage += `\n\nBridge Metaphor: "${metaphor}"`
    }

    userMessage += `\n\nGenerate 3 distinct T1 email drafts of the ${emailType.toUpperCase()} type now.`

    const claude = getClaudeClient()

    // Create streaming response
    const stream = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 4000,
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
    console.error('Error generating T1 email:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
