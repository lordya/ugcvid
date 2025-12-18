/**
 * Kie.ai API Client
 * Handles video generation job creation and status checking
 */

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1'

export interface CreateVideoTaskParams {
  script: string
  imageUrls: string[]
  aspectRatio?: string
}

export interface CreateVideoTaskResponse {
  task_id: string
  status?: string
  message?: string
}

/**
 * Creates a video generation task on Kie.ai
 * @param script - The video script/prompt
 * @param imageUrls - Array of image URLs to use in the video
 * @param aspectRatio - Video aspect ratio (default: "9:16")
 * @returns Task ID from Kie.ai
 */
export async function createVideoTask({
  script,
  imageUrls,
  aspectRatio = '9:16',
}: CreateVideoTaskParams): Promise<string> {
  const apiKey = process.env.KIE_API_KEY

  if (!apiKey) {
    throw new Error('KIE_API_KEY environment variable is not set')
  }

  // Validate inputs
  if (!script || script.trim().length === 0) {
    throw new Error('Script is required')
  }

  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('At least one image URL is required')
  }

  try {
    const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sora-2-text-to-video',
        input: {
          prompt: script,
          image_urls: imageUrls,
        },
        aspect_ratio: aspectRatio,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`Kie.ai API error: ${errorMessage}`)
    }

    const data: CreateVideoTaskResponse = await response.json()

    if (!data.task_id) {
      throw new Error('Kie.ai did not return a task_id')
    }

    return data.task_id
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to create video task: ${String(error)}`)
  }
}

