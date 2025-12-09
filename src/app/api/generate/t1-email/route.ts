import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import {
  T1_SYSTEM_PROMPT,
  T1_GENERATION_PROMPT,
  EMAIL_TYPE_PROMPTS,
  type EmailTypeId,
} from '@/lib/prompts/t1-email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
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
    } = body

    if (!emailType || !audience || !problem) {
      return new Response(
        'Missing required fields: emailType, audience, and problem',
        { status: 400 }
      )
    }

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

    const emailTypePrompt = EMAIL_TYPE_PROMPTS[emailType as EmailTypeId]
    const systemPrompt = `${T1_SYSTEM_PROMPT}\n\n${emailTypePrompt}\n\n${T1_GENERATION_PROMPT}`

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
