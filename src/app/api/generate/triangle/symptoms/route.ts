import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import { TRIANGLE_SYSTEM_PROMPT, SYMPTOM_PROMPT } from '@/lib/prompts/triangle-of-insight'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { audience, problem } = body

    if (!audience || !problem) {
      return new Response('Missing required fields: audience and problem', {
        status: 400,
      })
    }

    const systemPrompt = `${TRIANGLE_SYSTEM_PROMPT}\n\n${SYMPTOM_PROMPT}`

    const claude = getClaudeClient()

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

Generate 10 sensory-based symptoms now.`,
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
    console.error('Error generating symptoms:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
