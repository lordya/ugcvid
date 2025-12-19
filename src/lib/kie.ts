/**
 * Kie.ai API Client
 * Handles video generation job creation and status checking
 */

import { appendFile } from 'fs/promises'
import { join } from 'path'

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1'
const LOG_PATH = join(process.cwd(), '.cursor', 'debug.log')

async function logDebug(entry: any) {
  try {
    await appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8')
  } catch (e) {
    // Ignore logging errors
  }
}

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

interface KieApiWrappedResponse<T = any> {
  code?: number
  msg?: string
  message?: string
  data?: T
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
    // #region agent log
    const requestBody = {
      model: 'sora-2-text-to-video',
      input: {
        prompt: script,
        image_urls: imageUrls,
      },
      aspect_ratio: aspectRatio,
    };
    await logDebug({location:'kie.ts:47',message:'createVideoTask: About to call Kie.ai API',data:{requestBody,imageUrlCount:imageUrls.length,aspectRatio},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'});
    // #endregion

    const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    // #region agent log
    await logDebug({location:'kie.ts:81',message:'createVideoTask: Received response from Kie.ai',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'});
    // #endregion

    // Read response text once (can only be read once)
    const responseText = await response.text();

    if (!response.ok) {
      // #region agent log
      await logDebug({location:'kie.ts:88',message:'createVideoTask: Response not OK',data:{responseText,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        // Response is not JSON, use empty object
      }
      const errorMessage =
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`Kie.ai API error: ${errorMessage}`)
    }

    // #region agent log
    await logDebug({location:'kie.ts:103',message:'createVideoTask: Raw response text before parsing',data:{responseText,responseTextLength:responseText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'});
    // #endregion

    const parsedResponse: KieApiWrappedResponse<CreateVideoTaskResponse> = JSON.parse(responseText);

    // #region agent log
    await logDebug({location:'kie.ts:107',message:'createVideoTask: Parsed JSON data structure',data:{parsedData:parsedResponse,dataKeys:Object.keys(parsedResponse),hasCode:'code' in parsedResponse,hasData:'data' in parsedResponse,codeValue:parsedResponse.code,dataValue:parsedResponse.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'});
    // #endregion

    // Check if the response indicates an error at the API level (matching getTaskStatus pattern)
    if (parsedResponse.code !== undefined && parsedResponse.code !== 200) {
      const errorMsg = parsedResponse.msg || parsedResponse.message || 'Failed to create video task'
      // #region agent log
      await logDebug({location:'kie.ts:113',message:'createVideoTask: API returned error code',data:{code:parsedResponse.code,msg:errorMsg,fullResponse:parsedResponse},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      throw new Error(`Kie.ai API error: ${errorMsg}`)
    }

    // Extract actual data from wrapped response (if wrapped) or use response directly (for backward compatibility)
    const responseData: CreateVideoTaskResponse | any = parsedResponse.data || (parsedResponse as any);

    // #region agent log
    await logDebug({location:'kie.ts:120',message:'createVideoTask: Extracted response data',data:{responseData,responseDataKeys:Object.keys(responseData),hasTaskId:'task_id' in responseData,hasTaskIdCamel:'taskId' in responseData,taskIdValue:responseData.task_id,taskIdCamelValue:responseData.taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'});
    // #endregion

    // Try to extract task_id from multiple possible locations (with fallbacks)
    const taskId: string | undefined = 
      responseData.task_id ||           // Primary: snake_case, wrapped
      responseData.taskId ||              // Fallback: camelCase, wrapped
      (parsedResponse as any).task_id || // Fallback: snake_case, direct
      (parsedResponse as any).taskId;    // Fallback: camelCase, direct

    if (!taskId) {
      // #region agent log
      await logDebug({location:'kie.ts:130',message:'createVideoTask: task_id missing, throwing error',data:{parsedResponse,responseData,allKeys:Object.keys(parsedResponse),responseDataKeys:Object.keys(responseData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'});
      // #endregion
      throw new Error(
        `Kie.ai did not return a task_id. Response structure: ${JSON.stringify(parsedResponse, null, 2)}`
      )
    }

    // #region agent log
    await logDebug({location:'kie.ts:137',message:'createVideoTask: Successfully extracted task_id',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'});
    // #endregion

    return taskId
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

