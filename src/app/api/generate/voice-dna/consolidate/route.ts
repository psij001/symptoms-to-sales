import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import {
  CONSOLIDATE_VOICE_TRAITS_PROMPT,
  CONSOLIDATE_STYLE_TRAITS_PROMPT,
  CREATE_VOICE_DNA_SYSTEM_PROMPT,
  CREATE_VOICE_DNA_PROMPT,
} from '@/lib/prompts/voice-dna-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { consolidationType, voiceTraits, styleTraits } = body

    if (!consolidationType || !['voice', 'style', 'final'].includes(consolidationType)) {
      return new Response(
        'Invalid consolidationType. Must be "voice", "style", or "final"',
        { status: 400 }
      )
    }

    let systemPrompt = ''
    let userPrompt = ''

    if (consolidationType === 'voice') {
      if (!voiceTraits || !Array.isArray(voiceTraits)) {
        return new Response('Missing required field: voiceTraits (array)', { status: 400 })
      }
      systemPrompt = 'You are a writing voice analyst consolidating multiple analyses.'
      userPrompt = CONSOLIDATE_VOICE_TRAITS_PROMPT + voiceTraits.join('\n\n---\n\n')
    } else if (consolidationType === 'style') {
      if (!styleTraits || !Array.isArray(styleTraits)) {
        return new Response('Missing required field: styleTraits (array)', { status: 400 })
      }
      systemPrompt = 'You are a writing style analyst consolidating multiple analyses.'
      userPrompt = CONSOLIDATE_STYLE_TRAITS_PROMPT + styleTraits.join('\n\n---\n\n')
    } else {
      // final - create Voice DNA document
      if (!voiceTraits || !styleTraits) {
        return new Response(
          'Missing required fields: voiceTraits and styleTraits for final consolidation',
          { status: 400 }
        )
      }
      systemPrompt = CREATE_VOICE_DNA_SYSTEM_PROMPT
      userPrompt = CREATE_VOICE_DNA_PROMPT
        .replace('{voiceTraits}', typeof voiceTraits === 'string' ? voiceTraits : voiceTraits.join('\n'))
        .replace('{styleTraits}', typeof styleTraits === 'string' ? styleTraits : styleTraits.join('\n'))
    }

    const claude = getClaudeClient()

    const stream = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: consolidationType === 'final' ? 3000 : 1500,
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
    console.error('Error consolidating Voice DNA:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
