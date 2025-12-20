/**
 * UGC Video Generation Prompts
 *
 * This module contains all prompts for script and video generation,
 * extracted and adapted from the AFP UGC n8n workflow for production SaaS use.
 */

export interface ScriptGenerationParams {
  productName: string
  productDescription: string
  customersSay: string
  aspectRatio?: string
}

export interface UGCContentSchema {
  Title: string
  Caption: string
  Description: string
  Prompt: string
  aspect_ratio: 'portrait'
}

/**
 * System prompt for UGC script generation
 * Adapted from AFP UGC n8n workflow AI Agent node
 * Includes the jsonSchemaExample from the Structure node for proper output formatting
 */
export const UGC_SCRIPT_GENERATION_SYSTEM_PROMPT = `**SYSTEM DIRECTIVE — UGC Reel Prompt Generator 🎥**

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

**Example Output Format (jsonSchemaExample from AFP UGC workflow):**
\`\`\`json
{
  "Title": "Discover the Ultimate Luxury Red Handbag That Transforms Your Outfit Into Pure Elegance Instantly!!!",
  "Caption": "Obsessed with this red beauty! ❤️✨ It's giving pure elegance. #fashion #luxurybag #styleinspo #ootd #musthave",
  "Description": "A high-end, Dior-inspired red handbag featuring quilted leather and gold hardware, perfect for chic daily wear.",
  "Prompt": "Generate a 10-second vertical UGC-style video for TikTok. A stylish young woman stands in her apartment reviewing a luxury red handbag inspired by the Dior Lady Bag. She holds it close to the camera, smiles naturally, and says, 'I finally got the red Dior Lady Bag — it's so chic and classy!' Show quick handheld close-ups of the quilted leather texture and gold hardware under soft daylight. Keep lighting natural and the tone casual, confident, and influencer-like.",
  "aspect_ratio": "portrait"
}
\`\`\`

**Example of a UGC-style short video prompt:**
> *Context: Promoting a luxury red handbag inspired by the Dior Lady Bag.*
> "Generate a 10-second vertical UGC-style video for TikTok, Instagram Reels, and YouTube Shorts. A stylish young woman stands in her apartment reviewing a luxury red handbag inspired by the Dior Lady Bag. She holds it close to the camera, smiles naturally, and says, 'I finally got the red Dior Lady Bag — it's so chic and classy!' Show quick handheld close-ups of the quilted leather texture and gold hardware under soft daylight. Keep lighting natural and the tone casual, confident, and influencer-like. End with her admiring the bag and saying, 'It's giving pure elegance.'"`

/**
 * Generates the user prompt for UGC script generation
 * @param params - Script generation parameters
 * @returns Formatted user prompt string
 */
export function generateScriptGenerationUserPrompt(params: ScriptGenerationParams): string {
  const { productName, productDescription, customersSay, aspectRatio = 'portrait' } = params

  return `The aspect ratio is: ${aspectRatio}

Product name: ${productName}

Product description: ${productDescription}

Here's what customers say about the product, take something positive they said and put it in the prompt (a good quality about the products the influencer can say): ${customersSay}`
}

/**
 * Video generation configuration constants
 * Based on AFP UGC n8n workflow "Create Video" node
 */
export const VIDEO_GENERATION_CONFIG = {
  MODEL: 'sora-2-text-to-video',
  DEFAULT_ASPECT_RATIO: 'portrait',
  DEFAULT_QUALITY: 'hd',
  MAX_PROMPT_LENGTH: 1000,
  MAX_TITLE_LENGTH: 100,
} as const

export interface VideoGenerationParams {
  prompt: string
  imageUrls: string[]
  aspectRatio?: string
  quality?: string
}

/**
 * Generates the video generation request payload for Kie.ai API
 * Based on the AFP UGC n8n workflow "Create Video" HTTP Request node
 * @param params - Video generation parameters
 * @returns Request payload for Kie.ai API
 */
export function generateVideoGenerationPayload(params: VideoGenerationParams) {
  const { prompt, imageUrls, aspectRatio = VIDEO_GENERATION_CONFIG.DEFAULT_ASPECT_RATIO, quality = VIDEO_GENERATION_CONFIG.DEFAULT_QUALITY } = params

  return {
    model: VIDEO_GENERATION_CONFIG.MODEL,
    input: {
      prompt,
      image_urls: imageUrls,
    },
    aspect_ratio: aspectRatio,
    quality,
  }
}

/**
 * Validates UGC content structure
 * @param content - UGC content to validate
 * @returns Validation result with errors if any
 */
export function validateUGCContent(content: Partial<UGCContentSchema>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required keys
  const requiredKeys: (keyof UGCContentSchema)[] = ['Title', 'Caption', 'Description', 'Prompt', 'aspect_ratio']
  for (const key of requiredKeys) {
    if (!(key in content)) {
      errors.push(`Missing required key: ${key}`)
    }
  }

  if (content.Title && content.Title.length !== VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH) {
    errors.push(`Title must be exactly ${VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH} characters, got ${content.Title.length}`)
  }

  if (content.Prompt && content.Prompt.length > VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH) {
    errors.push(`Prompt exceeds maximum length of ${VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH} characters`)
  }

  if (content.aspect_ratio && content.aspect_ratio !== 'portrait') {
    errors.push(`aspect_ratio must be "portrait", got "${content.aspect_ratio}"`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Normalizes UGC content to ensure compliance with requirements
 * @param content - Raw UGC content
 * @returns Normalized UGC content
 */
export function normalizeUGCContent(content: UGCContentSchema): UGCContentSchema {
  const normalized = { ...content }

  // Ensure aspect_ratio is always portrait
  normalized.aspect_ratio = 'portrait'

  // Ensure Title is exactly 100 characters
  if (normalized.Title.length < VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH) {
    normalized.Title = normalized.Title.padEnd(VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH, '!')
  } else if (normalized.Title.length > VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH) {
    normalized.Title = normalized.Title.substring(0, VIDEO_GENERATION_CONFIG.MAX_TITLE_LENGTH)
  }

  // Ensure Prompt doesn't exceed max length
  if (normalized.Prompt.length > VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH) {
    normalized.Prompt = normalized.Prompt.substring(0, VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH)
  }

  return normalized
}
