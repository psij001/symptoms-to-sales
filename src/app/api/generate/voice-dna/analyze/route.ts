import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import {
  VOICE_ANALYSIS_SYSTEM_PROMPT,
  VOICE_ANALYSIS_PROMPT,
  STYLE_ANALYSIS_SYSTEM_PROMPT,
  STYLE_ANALYSIS_PROMPT,
} from '@/lib/prompts/voice-dna-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { sampleContent, analysisType } = body

    if (!sampleContent || typeof sampleContent !== 'string') {
      return new Response('Missing required field: sampleContent', { status: 400 })
    }

    if (!analysisType || !['voice', 'style'].includes(analysisType)) {
      return new Response('Invalid analysisType. Must be "voice" or "style"', { status: 400 })
    }

    const systemPrompt = analysisType === 'voice'
      ? VOICE_ANALYSIS_SYSTEM_PROMPT
      : STYLE_ANALYSIS_SYSTEM_PROMPT

    const userPrompt = analysisType === 'voice'
      ? VOICE_ANALYSIS_PROMPT + sampleContent
      : STYLE_ANALYSIS_PROMPT + sampleContent

    const claude = getClaudeClient()

    const stream = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 1500,
      stream: true,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

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
    console.error('Error analyzing writing sample:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
