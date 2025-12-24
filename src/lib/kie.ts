/**
 * Kie.ai API Client
 * Handles video generation job creation and status checking
 */

import { generateVideoGenerationPayload, VideoGenerationParams } from './prompts'

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1'


export interface CreateVideoTaskParams {
  script: string
  imageUrls: string[]
  aspectRatio?: string
  quality?: string
  duration?: number // Duration in seconds
  model?: string // Model name for Kie.ai API (e.g., 'sora-2-text-to-video', 'wan-2-6-text-to-video')
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
  aspectRatio = 'portrait',
  quality = 'hd',
  duration, // Optional duration parameter
  model, // Optional model parameter
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
    // Generate the request payload using the structured prompts module
    const requestBody = generateVideoGenerationPayload({
      prompt: script,
      imageUrls,
      aspectRatio,
      quality,
      duration, // Pass duration to payload generator
      model, // Pass model to payload generator
    })

    console.log('kie.ts:47 - createVideoTask: About to call Kie.ai API', {requestBody,imageUrlCount:imageUrls.length,aspectRatio});
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
    console.log('kie.ts:81 - createVideoTask: Received response from Kie.ai', {status:response.status,statusText:response.statusText,ok:response.ok});
    // #endregion

    // Read response text once (can only be read once)
    const responseText = await response.text();

    if (!response.ok) {
      // #region agent log
      console.log('kie.ts:88 - createVideoTask: Response not OK', {responseText,status:response.status,statusText:response.statusText});
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
    console.log('kie.ts:103 - createVideoTask: Raw response text before parsing', {responseText,responseTextLength:responseText.length});
    // #endregion

    const parsedResponse: KieApiWrappedResponse<CreateVideoTaskResponse> = JSON.parse(responseText);

    // #region agent log
    console.log('kie.ts:107 - createVideoTask: Parsed JSON data structure', {parsedData:parsedResponse,dataKeys:Object.keys(parsedResponse),hasCode:'code' in parsedResponse,hasData:'data' in parsedResponse,codeValue:parsedResponse.code,dataValue:parsedResponse.data});
    // #endregion

    // Check if the response indicates an error at the API level (matching getTaskStatus pattern)
    if (parsedResponse.code !== undefined && parsedResponse.code !== 200) {
      const errorMsg = parsedResponse.msg || parsedResponse.message || 'Failed to create video task'
      // #region agent log
      console.log('kie.ts:113 - createVideoTask: API returned error code', {code:parsedResponse.code,msg:errorMsg,fullResponse:parsedResponse});
      // #endregion
      throw new Error(`Kie.ai API error: ${errorMsg}`)
    }

    // Extract actual data from wrapped response (if wrapped) or use response directly (for backward compatibility)
    const responseData: CreateVideoTaskResponse | any = parsedResponse.data || (parsedResponse as any);

    // #region agent log
    console.log('kie.ts:120 - createVideoTask: Extracted response data', {responseData,responseDataKeys:Object.keys(responseData),hasTaskId:'task_id' in responseData,hasTaskIdCamel:'taskId' in responseData,taskIdValue:responseData.task_id,taskIdCamelValue:responseData.taskId});
    // #endregion

    // Try to extract task_id from multiple possible locations (with fallbacks)
    const taskId: string | undefined = 
      responseData.task_id ||           // Primary: snake_case, wrapped
      responseData.taskId ||              // Fallback: camelCase, wrapped
      (parsedResponse as any).task_id || // Fallback: snake_case, direct
      (parsedResponse as any).taskId;    // Fallback: camelCase, direct

    if (!taskId) {
      // #region agent log
      console.log('kie.ts:130 - createVideoTask: task_id missing, throwing error', {parsedResponse,responseData,allKeys:Object.keys(parsedResponse),responseDataKeys:Object.keys(responseData)});
      // #endregion
      throw new Error(
        `Kie.ai did not return a task_id. Response structure: ${JSON.stringify(parsedResponse, null, 2)}`
      )
    }

    // #region agent log
    console.log('kie.ts:137 - createVideoTask: Successfully extracted task_id', {taskId});
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
  state?: string // Actual API format: "generating", "processing", "success", "failed"
  successFlag?: number // Backward compatibility: 0 = processing, 1 = completed, 2 = failed, 3 = task created but generation failed, 4 = generation succeeded but callback failed
  resultJson?: string // Actual API format - JSON string containing video URLs
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
      `${KIE_API_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    // HANDLE HTTP ERROR CODES EXPLICITLY
    if (!response.ok) {
      const status = response.status;
      let errorMsg = `HTTP ${status}: ${response.statusText}`;

      // Try to parse error details
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorData.msg || errorMsg;
      } catch (e) { /* ignore parse error */ }

      // Map specific HTTP codes to "FAILED" status immediately
      // 402: Insufficient Credits
      // 422: Validation Error
      // 501: Generation Failed
      if (status === 402 || status === 422 || status === 501) {
         return {
            status: 'FAILED',
            errorMessage: `Provider Error (${status}): ${errorMsg}`,
         };
      }

      // 404: Not Found (Task ID invalid/expired) -> Also Fail
      if (status === 404) {
          return {
            status: 'FAILED',
            errorMessage: `Task Not Found (404): The video generation task no longer exists.`,
         };
      }

      // 500/505/429: These might be transient, but usually fatal for a specific task check
      // For now, treat 500 as FAILED to stop the spinner.
      if (status >= 500) {
          return {
            status: 'FAILED',
            errorMessage: `Provider Server Error (${status}): ${errorMsg}`,
         };
      }

      throw new Error(`Kie.ai API error: ${errorMsg}`)
    }

    const data = await response.json()

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Kie.ai API error: Invalid response format')
    }

    // Check if the response indicates an error at the API level
    if (data.code !== undefined && data.code !== 200) {
      // Check multiple error message fields with proper trimming
      const errorMsg = 
        (data.msg && data.msg.trim()) ||
        (data.message && data.message.trim()) ||
        (data.error && data.error.trim()) ||
        `Failed to check task status (error code: ${data.code})`
      
      throw new Error(`Kie.ai API error: ${errorMsg}`)
    }

    const taskData: TaskStatusResponse = data.data

    if (!taskData) {
      throw new Error('Kie.ai did not return task data')
    }

    // Debug logging to capture actual response structure
    console.log('kie.ts:getTaskStatus - Received task data structure', {
      taskData,
      hasState: 'state' in taskData,
      hasSuccessFlag: 'successFlag' in taskData,
      hasResultJson: 'resultJson' in taskData,
      hasResponse: 'response' in taskData,
      stateValue: taskData.state,
      successFlagValue: taskData.successFlag,
      resultJsonLength: taskData.resultJson?.length,
    })

    // Map state/successFlag to our status enum
    // Priority: Check state (actual format) first, fallback to successFlag (old format)
    const statusValue = taskData.state || taskData.successFlag

    // Validate that we have a status value
    if (statusValue === undefined) {
      throw new Error(
        `Kie.ai API error: Task data missing both 'state' and 'successFlag' fields. Available fields: ${Object.keys(taskData).join(', ')}`
      )
    }

    // Helper function to extract video URL from both formats
    const extractVideoUrl = (): string | undefined => {
      // Try new format: parse resultJson JSON string
      if (taskData.resultJson) {
        try {
          const resultData = JSON.parse(taskData.resultJson) as {
            resultUrls?: string[]
            result_urls?: string[]
          }
          return resultData.resultUrls?.[0] || resultData.result_urls?.[0]
        } catch (parseError) {
          // Log parse error but continue to try other formats
          console.error(
            'Failed to parse resultJson:',
            parseError instanceof Error ? parseError.message : String(parseError)
          )
        }
      }

      // Fallback to old format: direct response object
      if (taskData.response) {
        return (
          taskData.response.resultUrls?.[0] ||
          taskData.response.result_urls?.[0] ||
          taskData.response.videoUrl ||
          taskData.response.video_url
        )
      }

      return undefined
    }

    switch (statusValue) {
      // New format: string states
      case 'generating':
      case 'processing':
      // Old format: numeric successFlag
      case 0:
        // Still processing
        return {
          status: 'PROCESSING',
          progress: taskData.progress ? parseFloat(taskData.progress) : undefined,
        }

      // New format: success state
      case 'success':
      // Old format: completed
      case 1:
        // Completed successfully
        const videoUrl = extractVideoUrl()

        if (!videoUrl) {
          throw new Error('Kie.ai returned success but no video URL found')
        }

        return {
          status: 'COMPLETED',
          videoUrl,
        }

      // New format: failed state
      case 'failed':
      // Old format: task creation or generation failed
      case 2:
      case 3:
        // Failed
        return {
          status: 'FAILED',
          errorMessage:
            taskData.errorMessage ||
            `Generation failed (status: ${statusValue})`,
        }

      // Old format: generation succeeded but callback failed
      case 4:
        // Generation succeeded but callback failed - we still have the video URL
        const url = extractVideoUrl()

        if (url) {
          return {
            status: 'COMPLETED',
            videoUrl: url,
            errorMessage: taskData.errorMessage
              ? `Warning: ${taskData.errorMessage}`
              : undefined,
          }
        }

        return {
          status: 'FAILED',
          errorMessage:
            taskData.errorMessage ||
            'Generation completed but callback failed',
        }

      default:
        throw new Error(
          `Unknown task status: ${statusValue} (type: ${typeof statusValue}). Available fields: state=${taskData.state}, successFlag=${taskData.successFlag}, hasResultJson=${!!taskData.resultJson}, hasResponse=${!!taskData.response}`
        )
    }
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to get task status: ${String(error)}`)
  }
}

