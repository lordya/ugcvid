import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse, UGCContent } from '@/types/supabase'

// Helper to determine if model uses GPT-5 style parameters
function isGPT5Model(model: string): boolean {
  return model.startsWith('gpt-5')
}

// Build model-specific parameters
function buildModelParams(
  model: string,
  systemPrompt: string,
  userPrompt: string
) {
  const baseParams = {
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
  }

  if (isGPT5Model(model)) {
    // GPT-5 models use reasoning_effort, verbosity, max_completion_tokens
    return {
      ...baseParams,
      reasoning_effort: (process.env.OPENAI_REASONING_EFFORT || 'minimal') as
        | 'minimal'
        | 'low'
        | 'medium'
        | 'high',
      verbosity: (process.env.OPENAI_VERBOSITY || 'medium') as
        | 'low'
        | 'medium'
        | 'high',
      max_completion_tokens: parseInt(
        process.env.OPENAI_MAX_COMPLETION_TOKENS || '500',
        10
      ),
    }
  } else {
    // Traditional models use temperature, max_tokens
    return {
      ...baseParams,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScriptGenerationRequest = await request.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client only when needed (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // System prompt for UGC script generation - adapted from n8n workflow (same constraints/rules, adapted for direct API usage)
    const systemPrompt = `**SYSTEM DIRECTIVE — UGC Reel Prompt Generator 🎥**

**Goal:** Generate *UGC-style short video prompts* (portrait, ≤10 seconds) formatted as strict JSON. These prompts must produce realistic, influencer-style product review videos for TikTok, Instagram Reels, and YouTube Shorts. Do not print prose. Output the JSON directly as a valid JSON object.

**Rules:**
* **Keys & casing must be exactly:** \`Title\`, \`Caption\`, \`Description\`, \`Prompt\`, \`aspect_ratio\`.
* **Title:** Must be exactly 100 characters (pad or trim as necessary to fit length).
* **Description:** Provide a clear summary/description of the product being reviewed.
* **Length:** Each \`Prompt\` ≤ 1000 characters.
* **aspect_ratio:** Only "portrait".
* No extra keys. No markdown fences. No commentary.

**Style:**
* Output only **UGC review-style videos**: natural handheld framing, selfie angles, casual influencer tone, and realistic lighting.
* Focus on **authentic dialogue**, product showcasing, and quick engaging movements.
* Use **realistic home, studio, or lifestyle backgrounds**.
* Match the user's brand tone.
* Include clear production cues: camera movement, lighting, tone, setting, and voice delivery.
* Avoid cinematic effects, fictional storylines, or filmic scenes.

**Validation:**
* Each \`Prompt\` ≤ 800 chars.
* \`Title\` length is ~100 characters.
* \`aspect_ratio\` == \`"portrait"\`.
* JSON keys exactly match the schema (\`Title\`, \`Caption\`, \`Description\`, \`Prompt\`, \`aspect_ratio\`).
* If any check fails, self-revise and output corrected JSON.

Important note:
* Never output symbols that might mess up with the JSON structure, like " or * or — etc...
* Never mention that this is a UGC review in the title, caption, and the description.
* NEVER WRITE EM DASH —

**Example of a UGC-style short video prompt:**
> *Context: Promoting a luxury red handbag inspired by the Dior Lady Bag.*
> "Generate a 10-second vertical UGC-style video for TikTok, Instagram Reels, and YouTube Shorts. A stylish young woman stands in her apartment reviewing a luxury red handbag inspired by the Dior Lady Bag. She holds it close to the camera, smiles naturally, and says, 'I finally got the red Dior Lady Bag — it's so chic and classy!' Show quick handheld close-ups of the quilted leather texture and gold hardware under soft daylight. Keep lighting natural and the tone casual, confident, and influencer-like. End with her admiring the bag and saying, 'It's giving pure elegance.'"`;

    const userPrompt = `The aspect ratio is: portrait

Product name: ${title}

Product description: ${description}

Here's what customers say about the product, take something positive they said and put it in the prompt (a good quality about the products the influencer can say): ${description}`;

    const model = process.env.OPENAI_MODEL || 'gpt-4.1' // Use gpt-4.1 like n8n workflow
    const params = buildModelParams(model, systemPrompt, userPrompt)

    const completion = await openai.chat.completions.create(params)

    const rawContent = completion.choices[0]?.message?.content?.trim()

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Failed to generate script' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let ugcContent: UGCContent;

    try {
      // The AI should return JSON directly, but we need to handle it carefully
      ugcContent = JSON.parse(rawContent);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          ugcContent = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return NextResponse.json(
            { error: 'Failed to parse AI response as JSON' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'AI response is not valid JSON' },
          { status: 500 }
        );
      }
    }

    // Validate the response structure
    if (!ugcContent.Title || !ugcContent.Caption || !ugcContent.Description ||
        !ugcContent.Prompt || !ugcContent.aspect_ratio) {
      return NextResponse.json(
        { error: 'Incomplete UGC content structure' },
        { status: 500 }
      );
    }

    // Ensure aspect_ratio is "portrait"
    ugcContent.aspect_ratio = 'portrait';

    // Ensure Title is exactly 100 characters (pad or trim)
    if (ugcContent.Title.length < 100) {
      ugcContent.Title = ugcContent.Title.padEnd(100, '!');
    } else if (ugcContent.Title.length > 100) {
      ugcContent.Title = ugcContent.Title.substring(0, 100);
    }

    return NextResponse.json({
      ugcContent,
      // Keep backward compatibility
      script: ugcContent.Prompt,
      title: ugcContent.Title,
      caption: ugcContent.Caption,
      description: ugcContent.Description,
      aspectRatio: ugcContent.aspect_ratio
    })
  } catch (error) {
    console.error('Script generation API error:', error)
    
    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}

