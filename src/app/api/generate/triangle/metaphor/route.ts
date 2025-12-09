import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import { buildSystemPrompt } from '@/lib/claude/context-builder'
import { TRIANGLE_SYSTEM_PROMPT, METAPHOR_PROMPT } from '@/lib/prompts/triangle-of-insight'
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
    const { audience, problem, selectedSymptom, selectedWisdom, projectId } = body

    if (!audience || !problem || !selectedSymptom || !selectedWisdom) {
      return new Response(
        'Missing required fields: audience, problem, selectedSymptom, and selectedWisdom',
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
        voiceDNA = projectData.voice_dna?.find((v) => v.is_active) ?? projectData.voice_dna?.[0] ?? null
        offerContext = projectData.offer_contexts?.find((o) => o.is_active) ?? projectData.offer_contexts?.[0] ?? null
      }
    }

    // Build system prompt with context
    const systemPrompt = project
      ? buildSystemPrompt({
          project,
          voiceDNA,
          offerContext,
          toolPrompt: `${TRIANGLE_SYSTEM_PROMPT}\n\n${METAPHOR_PROMPT}`,
        })
      : `${TRIANGLE_SYSTEM_PROMPT}\n\n${METAPHOR_PROMPT}`

    const claude = getClaudeClient()

    // Create streaming response
    const stream = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 2000,
      stream: true,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Target Audience: ${audience}

Biggest Problem (Hell Island): ${problem}

Selected Symptom: "${selectedSymptom}"

Selected Wisdom: "${selectedWisdom}"

Based on this symptom and wisdom, generate 10 vivid metaphors or analogies that bridge the gap and make the wisdom click.`,
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
    console.error('Error generating metaphors:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
