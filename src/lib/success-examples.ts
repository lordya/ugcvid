import { createClient } from '@/lib/supabase/server'

export interface SuccessfulExample {
  id: string
  final_script: string
  performance_score: number
  created_at: string
}

/**
 * Fetches the top 3 high-performing video scripts for a user
 * @param userId - The user ID to fetch examples for
 * @returns Array of successful examples (max 3)
 */
export async function getUserSuccessfulExamples(userId: string): Promise<SuccessfulExample[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select('id, final_script, performance_score, created_at')
    .eq('user_id', userId)
    .eq('is_high_performer', true)
    .not('final_script', 'is', null)
    .order('performance_score', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching successful examples:', error)
    return []
  }

  return data || []
}

/**
 * Global best practices examples to use when user has no high performers
 * These are anonymized, high-quality example scripts
 */
export const GLOBAL_BEST_PRACTICES: SuccessfulExample[] = [
  {
    id: 'global-example-1',
    final_script: JSON.stringify({
      style: "UGC Authenticité (30s)",
      tone_instructions: "Conversational, enthusiastic but authentic. Real struggle to real solution.",
      visual_cues: [
        "0-3s: Close-up of unorganized desk with scattered papers and tangled cables",
        "3-10s: Show the problem - messy workspace causing frustration",
        "10-15s: Product enters frame, clean and organized",
        "15-25s: Demonstrate the organizing process, hands using product",
        "25-30s: Final organized result, creator smiling and pointing to link"
      ],
      voiceover: [
        "Hook (0-3s): 'My desk was such a disaster, I could never find anything!'",
        "Body (3-10s): 'Papers everywhere, cables tangled, it was driving me crazy trying to work.'",
        "Demonstration (10-20s): 'Then I found this organizing system. Look how it all fits perfectly.'",
        "CTA (20-30s): 'My workspace is finally organized. Link in bio if you want the same!'"
      ],
      text_overlay: [
        "0-3s: 'DESK CHAOS 😫'",
        "5-10s: 'Lost 2 hours a day searching'",
        "15-20s: 'This changed everything ✨'",
        "25-30s: 'Finally organized! 🔗'"
      ]
    }),
    performance_score: 1500,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'global-example-2',
    final_script: JSON.stringify({
      style: "Problème-Agitation-Solution (PAS) (30s)",
      tone_instructions: "Empathetic problem identification, building frustration, then triumphant solution reveal.",
      visual_cues: [
        "0-3s: Person looking frustrated at dull, scratched surface",
        "3-10s: Close-ups showing scratches, dullness, imperfections",
        "10-15s: Product application with satisfying transformation",
        "15-25s: Before/after comparison shots",
        "25-30s: Final gleaming result with product visible"
      ],
      voiceover: [
        "Hook (0-3s): 'Tired of dealing with scratches and dull surfaces?'",
        "Agitate (3-10s): 'It looks bad, feels rough, and nothing seems to fix it permanently.'",
        "Solution (10-15s): 'Until I tried this restoration product.'",
        "Results (15-25s): 'One application and it looks brand new. No more scratches!'",
        "CTA (25-30s): 'Transform yours today. 50% off with code RESTORE50!'"
      ],
      text_overlay: [
        "0-3s: 'Scratches everywhere 😩'",
        "5-10s: 'Looks terrible • Feels rough • Never fixes'",
        "12-15s: 'FOUND THE SOLUTION! ✨'",
        "18-25s: 'Like new again! 🪄'",
        "28-30s: '50% OFF - Link below 🔗'"
      ]
    }),
    performance_score: 1200,
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'global-example-3',
    final_script: JSON.stringify({
      style: "Before/After Transformation (30s)",
      tone_instructions: "Genuine surprise and delight at the transformation results.",
      visual_cues: [
        "0-3s: Split screen showing 'before' state - dull, tired appearance",
        "3-8s: Transition effect revealing product application process",
        "8-12s: 'After' reveal with dramatic improvement",
        "12-25s: Multiple before/after angles and close-ups",
        "25-30s: Final result with product packaging visible"
      ],
      voiceover: [
        "Hook (0-3s): 'Look at how dull and tired everything looked before.'",
        "Transition (3-8s): 'I decided to try this product for 2 weeks.'",
        "Reveal (8-12s): 'WOW! I cannot believe the difference!'",
        "Proof (12-25s): 'It actually works. The transformation is incredible.'",
        "CTA (25-30s): 'Ready for your transformation? Link in bio. 30-day guarantee!'"
      ],
      text_overlay: [
        "0-3s: 'BEFORE: Dull & Tired ❌'",
        "5-8s: 'After 2 weeks... ⏰'",
        "8-12s: 'AFTER: Amazing! ✅'",
        "15-20s: 'Real results • Noticeable difference • Lasting effect'",
        "25-30s: 'Your turn! 🔗 30-day guarantee'"
      ]
    }),
    performance_score: 1100,
    created_at: '2024-01-03T00:00:00Z'
  }
]

/**
 * Gets successful examples for prompt injection, with fallback to global best practices
 * @param userId - The user ID to fetch examples for
 * @returns Array of successful examples (max 3)
 */
export async function getSuccessfulExamplesForPrompt(userId: string): Promise<SuccessfulExample[]> {
  const userExamples = await getUserSuccessfulExamples(userId)

  // If user has successful examples, return them
  if (userExamples.length > 0) {
    return userExamples
  }

  // Otherwise, return global best practices (limit to 3)
  return GLOBAL_BEST_PRACTICES.slice(0, 3)
}

/**
 * Rough token estimation (1 token ≈ 4 characters for English text)
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Formats successful examples for inclusion in system prompts
 * @param examples - Array of successful examples
 * @param maxTokens - Maximum tokens allowed for examples (default: 1000)
 * @returns Formatted string for prompt injection
 */
export function formatExamplesForPrompt(examples: SuccessfulExample[], maxTokens: number = 1000): string {
  if (examples.length === 0) {
    return ''
  }

  let formattedExamples = '\n\nLEARNING FROM SUCCESS:\n\n'

  formattedExamples += 'Here are examples of highly successful video scripts from users who achieved exceptional performance:\n\n'

  const maxExamples = Math.min(examples.length, 3) // Limit to 3 examples max as per requirements
  let currentTokens = estimateTokens(formattedExamples)

  for (let i = 0; i < maxExamples; i++) {
    const example = examples[i]
    let exampleText = ''

    try {
      const scriptData = JSON.parse(example.final_script)
      exampleText += `SUCCESSFUL EXAMPLE ${i + 1}:\n`
      exampleText += `Style: ${scriptData.style}\n`

      if (scriptData.voiceover && Array.isArray(scriptData.voiceover)) {
        exampleText += `Script: ${scriptData.voiceover.join(' ')}\n`
      }

      if (scriptData.tone_instructions) {
        exampleText += `Why it worked: ${scriptData.tone_instructions}\n`
      }

      exampleText += '\n'
    } catch (error) {
      // If JSON parsing fails, include raw script (truncated)
      exampleText += `SUCCESSFUL EXAMPLE ${i + 1}:\n`
      exampleText += `${example.final_script.substring(0, 300)}...\n\n`
    }

    // Check if adding this example would exceed token limit
    const exampleTokens = estimateTokens(exampleText)
    if (currentTokens + exampleTokens > maxTokens) {
      break // Stop adding examples if we'd exceed the limit
    }

    formattedExamples += exampleText
    currentTokens += exampleTokens
  }

  // Add instruction (check token limit)
  const instructionText = 'INSTRUCTION: Analyze the tone and structure of these successful examples. Notice how they:\n' +
    '- Use authentic, conversational language\n' +
    '- Follow proven psychological frameworks (problem-solution, before-after)\n' +
    '- Include specific benefits and social proof\n' +
    '- End with clear calls-to-action\n\n' +
    'Emulate this winning structure and tone for the new product video.\n'

  const instructionTokens = estimateTokens(instructionText)
  if (currentTokens + instructionTokens <= maxTokens) {
    formattedExamples += instructionText
  }

  return formattedExamples
}
