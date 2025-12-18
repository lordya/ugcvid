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

export interface TaskStatusResponse {
  successFlag: number // 0 = processing, 1 = completed, 2 = failed, 3 = task created but generation failed, 4 = generation succeeded but callback failed
  response?: {
    resultUrls?: string[]
    result_urls?: string[]
    videoUrl?: string
    video_url?: string
  }
  errorMessage?: string
  errorCode?: string
  createTime?: string
  completeTime?: string
  progress?: string
}

export interface GetTaskStatusResult {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  videoUrl?: string
  errorMessage?: string
  progress?: number
}

/**
 * Gets the status of a video generation task from Kie.ai
 * @param taskId - The task ID returned from createVideoTask
 * @returns Task status information
 */
export async function getTaskStatus(taskId: string): Promise<GetTaskStatusResult> {
  const apiKey = process.env.KIE_API_KEY

  if (!apiKey) {
    throw new Error('KIE_API_KEY environment variable is not set')
  }

  if (!taskId || taskId.trim().length === 0) {
    throw new Error('Task ID is required')
  }

  try {
    const response = await fetch(
      `${KIE_API_BASE_URL}/jobs/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.message || errorData.error || errorData.msg || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`Kie.ai API error: ${errorMessage}`)
    }

    const data = await response.json()

    // Check if the response indicates an error at the API level
    if (data.code !== 200) {
      throw new Error(data.msg || 'Failed to check task status')
    }

    const taskData: TaskStatusResponse = data.data

    if (!taskData) {
      throw new Error('Kie.ai did not return task data')
    }

    // Map successFlag to our status enum
    // successFlag: 0 = processing, 1 = completed, 2 = failed, 3 = task created but generation failed, 4 = generation succeeded but callback failed
    switch (taskData.successFlag) {
      case 0:
        // Still processing
        return {
          status: 'PROCESSING',
          progress: taskData.progress ? parseFloat(taskData.progress) : undefined,
        }

      case 1:
        // Completed successfully
        const videoUrl =
          taskData.response?.resultUrls?.[0] ||
          taskData.response?.result_urls?.[0] ||
          taskData.response?.videoUrl ||
          taskData.response?.video_url

        if (!videoUrl) {
          throw new Error('Kie.ai returned success but no video URL')
        }

        return {
          status: 'COMPLETED',
          videoUrl,
        }

      case 2:
      case 3:
        // Failed (2 = task creation failed, 3 = generation failed)
        return {
          status: 'FAILED',
          errorMessage: taskData.errorMessage || `Generation failed (error code: ${taskData.errorCode || taskData.successFlag})`,
        }

      case 4:
        // Generation succeeded but callback failed - we still have the video URL
        const url =
          taskData.response?.resultUrls?.[0] ||
          taskData.response?.result_urls?.[0] ||
          taskData.response?.videoUrl ||
          taskData.response?.video_url

        if (url) {
          return {
            status: 'COMPLETED',
            videoUrl: url,
            errorMessage: taskData.errorMessage ? `Warning: ${taskData.errorMessage}` : undefined,
          }
        }

        return {
          status: 'FAILED',
          errorMessage: taskData.errorMessage || 'Generation completed but callback failed',
        }

      default:
        throw new Error(`Unknown task status: ${taskData.successFlag}`)
    }
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to get task status: ${String(error)}`)
  }
}

