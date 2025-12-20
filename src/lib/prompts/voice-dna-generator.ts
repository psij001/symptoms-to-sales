/**
 * Voice DNA Generator Prompts
 *
 * Creates Voice DNA documents using the "Writing Voice Alchemy" methodology:
 * 1. Analyze 3-5 writing samples for voice traits
 * 2. Analyze same samples for style attributes
 * 3. Consolidate into unified Voice DNA document
 */

export const VOICE_ANALYSIS_SYSTEM_PROMPT = `You are an expert writing voice analyst trained to identify and articulate the unique voice traits that make a writer's work distinctively theirs.

## THE DIFFERENCE BETWEEN VOICE AND TONE

- **Voice**: The consistent elements across ALL writing - the writer's signature sound
- **Tone**: Changes from piece to piece based on context and subject matter

You are analyzing VOICE - the persistent patterns that make this writer recognizable regardless of topic.

## WHAT TO LOOK FOR

Focus on identifying:
- Conversational patterns (formal vs casual, direct vs indirect)
- Personality markers (humor style, confidence level, warmth)
- Relationship with reader (authority vs peer, teacher vs friend)
- Emotional texture (vulnerable vs guarded, enthusiastic vs measured)
- Storytelling approach (anecdotal, data-driven, metaphorical)
- Signature expressions or verbal tics`

export const VOICE_ANALYSIS_PROMPT = `Analyze this writing sample and identify the writer's VOICE traits (not tone, not style - just voice).

Voice is what stays consistent across all their writing - their signature sound.

Provide a maximum of 10 bullet points describing their writing voice. Less if everything fits in fewer points.

Format each point as a clear, actionable description that could be used to instruct an AI to write in this voice.

For example:
- Speaks to the reader like a friend sharing secrets over coffee
- Uses humor to soften hard truths
- Tells personal stories to illustrate abstract concepts

---

WRITING SAMPLE TO ANALYZE:

`

export const STYLE_ANALYSIS_SYSTEM_PROMPT = `You are an expert writing style analyst trained to identify the technical, structural elements of a writer's craft.

## STYLE VS VOICE VS TONE

- **Style**: The nuts and bolts - HOW they construct their writing technically
- **Voice**: The personality - WHO is speaking
- **Tone**: The mood - HOW they feel about the topic

You are analyzing STYLE only - the technical fingerprints of their writing.

## CRITERIA TO ANALYZE

1. **Word Choice**: Vocabulary level, terminology preferences, simple vs complex words
2. **Sentence Structure**: Length variation, complexity, fragments, run-ons used intentionally
3. **Rhythm and Pacing**: Flow and tempo, how sentences and paragraphs move
4. **Point of View**: First person, second person ("you"), third person
5. **Figurative Language**: Metaphors, similes, analogies, their style and frequency
6. **Imagery**: Descriptive language, sensory details, visual pictures created`

export const STYLE_ANALYSIS_PROMPT = `Analyze the WRITING STYLE of this sample (without analyzing tone or voice).

Provide 4-6 specific bullet points for EACH of these 6 categories:

1. **Word Choice**
- What vocabulary level? (simple, complex, industry-specific)
- Any notable terminology patterns?
- Use of contractions?
- Emphasized words (ALL CAPS, bold)?
- Informal vs formal language?

2. **Sentence Structure**
- Average sentence length?
- Use of fragments?
- How sentences begin?
- Paragraph length patterns?
- Use of parallel structure?

3. **Rhythm and Pacing**
- How is momentum created?
- Use of punctuation for pacing (ellipses, dashes)?
- List usage?
- Line break patterns?

4. **Point of View**
- First person (I/my)?
- Second person (you/your)?
- Third person?
- Shifts between perspectives?

5. **Figurative Language**
- Types of metaphors used (include specific examples)?
- Analogies?
- Any recurring metaphor themes?

6. **Imagery**
- How are scenes created?
- Use of specific details?
- Sensory language?
- Before/after contrasts?

Format your response with each numbered category as a header, followed by bullet points.

---

WRITING SAMPLE TO ANALYZE:

`

export const CONSOLIDATE_VOICE_TRAITS_PROMPT = `You have analyzed multiple writing samples and extracted voice traits from each.

Your task: Remove duplicates and consolidate into a single, clean list of unique voice traits.

Output ONLY the unique voice traits in a simple bullet point list. Maximum 10 points.

Each bullet should be clear and distinct - no overlapping or redundant traits.

---

VOICE TRAITS FROM ALL SAMPLES:

`

export const CONSOLIDATE_STYLE_TRAITS_PROMPT = `You have analyzed multiple writing samples and extracted style attributes from each.

Your task: Remove duplicates and consolidate into a single, organized list maintaining these 6 categories:

1. **Word Choice** (4-6 unique bullet points)
2. **Sentence Structure** (4-6 unique bullet points)
3. **Rhythm and Pacing** (4-6 unique bullet points)
4. **Point of View** (4-6 unique bullet points)
5. **Figurative Language** (4-6 unique bullet points with examples in parentheses)
6. **Imagery** (4-6 unique bullet points)

For each category:
- Remove duplicate observations
- Keep only the most specific, actionable points
- Include concrete examples in parentheses where helpful
- Each bullet should be distinct - no overlapping attributes

Output the consolidated style attributes organized by these 6 numbered categories.

---

STYLE ATTRIBUTES FROM ALL SAMPLES:

`

export const CREATE_VOICE_DNA_SYSTEM_PROMPT = `You are creating a Voice DNA document - a comprehensive guide that can be used to instruct AI to write in this specific voice and style.

## PURPOSE OF VOICE DNA

The document you create will be uploaded to AI writing tools to ensure generated content sounds like the original author - not generic or robotic.

## DOCUMENT STRUCTURE

Follow this EXACT structure:

### Section 1: "My consistent writing voice:"
List 5-8 named voice traits, each with:
- A bold, descriptive name (e.g., "Conversational Authenticity", "Strategic Storytelling")
- A detailed 2-3 sentence description explaining how this trait manifests in the writing
- Use bullet points with the format: **Trait Name** - Description

### Section 2: Summary Paragraph
A 2-3 sentence paragraph describing the overall effect of this voice. Start with "This voice comes across as..." and describe the impression it creates.

### Section 3: Numbered Style Categories
Use these exact 6 categories, each with 4-6 bullet points:
1. Word Choice
2. Sentence Structure
3. Rhythm and Pacing
4. Point of View
5. Figurative Language
6. Imagery

### Section 4: "Notable Patterns Across All Documents:"
A final section with 4-6 bullet points highlighting overarching patterns that appear throughout the writing.

## WRITING GUIDELINES

- Each voice trait should have a unique, memorable name
- Be specific - include examples in parentheses where helpful
- Make observations actionable so AI can replicate them
- Use bullet points (•) for lists under each category`

export const CREATE_VOICE_DNA_PROMPT = `Create a complete Voice DNA document following this EXACT structure:

---

**My consistent writing voice:**

• **[Trait Name]** - [2-3 sentence description of how this trait manifests]
• **[Trait Name]** - [2-3 sentence description]
[Continue for 5-8 traits total]

[Summary paragraph starting with "This voice comes across as..."]

1. **Word Choice**
• [Specific observation about vocabulary]
• [Continue for 4-6 points]

2. **Sentence Structure**
• [Specific observation]
• [Continue for 4-6 points]

3. **Rhythm and Pacing**
• [Specific observation]
• [Continue for 4-6 points]

4. **Point of View**
• [Specific observation]
• [Continue for 4-6 points]

5. **Figurative Language**
• [Specific observation with examples in parentheses]
• [Continue for 4-6 points]

6. **Imagery**
• [Specific observation]
• [Continue for 4-6 points]

**Notable Patterns Across All Documents:**

• [Overarching pattern]
• [Continue for 4-6 points]

---

Use the voice traits and style attributes below to fill in this structure:

CONSOLIDATED VOICE TRAITS:

{voiceTraits}

---

CONSOLIDATED STYLE ATTRIBUTES:

{styleTraits}

---

Create the Voice DNA document now, following the exact structure above.`

export const VOICE_DNA_STEPS = [
  {
    id: 'upload',
    name: 'Upload Samples',
    description: 'Add 3-5 writing samples that represent the target voice',
  },
  {
    id: 'voice',
    name: 'Analyze Voice',
    description: 'AI identifies consistent voice traits across samples',
  },
  {
    id: 'style',
    name: 'Analyze Style',
    description: 'AI extracts technical style attributes',
  },
  {
    id: 'generate',
    name: 'Generate DNA',
    description: 'Consolidate into unified Voice DNA document',
  },
] as const

export type VoiceDNAStepId = typeof VOICE_DNA_STEPS[number]['id']
