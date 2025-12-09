import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import {
  SUBJECT_LINES_SYSTEM_PROMPT,
  SUBJECT_LINES_GENERATION_PROMPT,
} from '@/lib/prompts/subject-lines'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { audience, problem, t1Email } = body

    if (!t1Email && (!audience || !problem)) {
      return new Response(
        'Missing required fields: provide either (audience and problem) or t1Email',
        { status: 400 }
      )
    }

    const systemPrompt = `${SUBJECT_LINES_SYSTEM_PROMPT}\n\n${SUBJECT_LINES_GENERATION_PROMPT}`

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
