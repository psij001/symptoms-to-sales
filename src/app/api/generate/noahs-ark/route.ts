import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/serverAuth'
import { getClaudeClient, MODELS } from '@/lib/claude/client'
import {
  NOAHS_ARK_SYSTEM_PROMPT,
  NOAHS_ARK_EMAIL_PROMPTS,
  NOAHS_ARK_CAMPAIGN_PROMPT,
  type NoahsArkEmailTypeId,
} from '@/lib/prompts/noahs-ark'

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
      storm,
      ark,
      scarcity,
      symptom,
      wisdom,
      metaphor,
      voiceDNAContent,
    } = body

    if (!emailType || !audience || !storm || !ark) {
      return new Response(
        'Missing required fields: emailType, audience, storm, and ark',
        { status: 400 }
      )
    }

    const validEmailTypes: NoahsArkEmailTypeId[] = [
      'storm-warning',
      'proof-points',
      'ark-reveal',
      'passenger-profiles',
      'boarding-call',
      'urgency-escalation',
      'final-call',
    ]

    if (!validEmailTypes.includes(emailType)) {
      return new Response(`Invalid email type: ${emailType}`, { status: 400 })
    }

    const emailTypePrompt = NOAHS_ARK_EMAIL_PROMPTS[emailType as NoahsArkEmailTypeId]

    // Build system prompt with optional Voice DNA
    let systemPrompt = `${NOAHS_ARK_SYSTEM_PROMPT}\n\n${emailTypePrompt}\n\n${NOAHS_ARK_CAMPAIGN_PROMPT}`

    if (voiceDNAContent && typeof voiceDNAContent === 'string' && voiceDNAContent.trim()) {
      systemPrompt += `\n\n## VOICE DNA - CRITICAL WRITING STYLE INSTRUCTIONS

The following Voice DNA document describes the exact writing voice and style to use for this email.
You MUST follow these voice and style guidelines carefully to ensure the output sounds authentic.

---
${voiceDNAContent.trim()}
---

Apply these voice characteristics throughout the email. It should sound like it was written by the person described in the Voice DNA.`
    }

    let userMessage = `## CAMPAIGN DETAILS

**Target Audience:** ${audience}

**The Storm (Crisis/Change):** ${storm}

**The Ark (Your Solution):** ${ark}`

    if (scarcity) {
      userMessage += `\n\n**Scarcity/Limits:** ${scarcity}`
    }

    if (symptom) {
      userMessage += `\n\n**Symptom (from Triangle of Insight):** "${symptom}"`
    }
    if (wisdom) {
      userMessage += `\n\n**Wisdom (from Triangle of Insight):** "${wisdom}"`
    }
    if (metaphor) {
      userMessage += `\n\n**Metaphor (from Triangle of Insight):** "${metaphor}"`
    }

    userMessage += `\n\nGenerate the ${emailType.toUpperCase().replace(/-/g, ' ')} email for this Noah's Ark campaign now.`

    const claude = getClaudeClient()

    const stream = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 2000,
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
    console.error('Error generating Noah\'s Ark email:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
