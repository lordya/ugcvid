export interface QualityIssue {
  type: 'duration' | 'content_safety' | 'metadata' | 'technical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
}

export interface QualityValidationResult {
  score: number // 0-1, where 1 is perfect quality
  issues: QualityIssue[]
  passed: boolean
  validatedAt: string
}

/**
 * Validates the quality of a generated video
 * This is the foundational plumbing for post-generation quality checks
 *
 * @param videoUrl - URL of the generated video
 * @param requestedDuration - Original requested duration in seconds
 * @param actualDuration - Actual duration returned by the API (if available)
 * @param metadata - Additional metadata from the API response
 * @returns Quality validation result with score and issues
 */
export async function validateVideoQuality(
  videoUrl: string,
  requestedDuration: number,
  actualDuration?: number,
  metadata?: any
): Promise<QualityValidationResult> {
  const issues: QualityIssue[] = []
  let score = 1.0 // Start with perfect score, deduct for issues

  // 1. Duration Validation
  if (actualDuration !== undefined) {
    const durationRatio = actualDuration / requestedDuration

    if (durationRatio < 0.5) {
      // Critical: Video is less than 50% of requested duration
      issues.push({
        type: 'duration',
        severity: 'critical',
        message: `Video duration is critically short: ${actualDuration}s vs requested ${requestedDuration}s (${(durationRatio * 100).toFixed(1)}%)`,
        details: { requestedDuration, actualDuration, ratio: durationRatio }
      })
      score -= 0.6 // Major deduction for critical duration issues
    } else if (durationRatio < 0.8) {
      // High severity: Video is significantly shorter than requested
      issues.push({
        type: 'duration',
        severity: 'high',
        message: `Video duration is shorter than requested: ${actualDuration}s vs ${requestedDuration}s (${(durationRatio * 100).toFixed(1)}%)`,
        details: { requestedDuration, actualDuration, ratio: durationRatio }
      })
      score -= 0.3
    } else if (durationRatio < 0.95) {
      // Medium severity: Video is slightly shorter
      issues.push({
        type: 'duration',
        severity: 'medium',
        message: `Video duration is slightly shorter: ${actualDuration}s vs ${requestedDuration}s (${(durationRatio * 100).toFixed(1)}%)`,
        details: { requestedDuration, actualDuration, ratio: durationRatio }
      })
      score -= 0.1
    }
  } else {
    // Note: Actual duration not provided - this is informational for future enhancement
    console.log(`[Quality Validation] Duration validation skipped - actual duration not provided for video: ${videoUrl}`)
  }

  // 2. Content Safety Validation
  if (metadata?.content_safety) {
    // Check for API-reported content safety warnings
    const safetyWarnings = Array.isArray(metadata.content_safety)
      ? metadata.content_safety
      : [metadata.content_safety]

    for (const warning of safetyWarnings) {
      if (warning && typeof warning === 'string') {
        issues.push({
          type: 'content_safety',
          severity: 'high',
          message: `Content safety warning: ${warning}`,
          details: { warning, metadata }
        })
        score -= 0.4 // Significant deduction for content safety issues
      }
    }
  }

  // 3. Metadata Validation
  if (metadata?.error || metadata?.status === 'failed') {
    issues.push({
      type: 'metadata',
      severity: 'critical',
      message: `API reported generation failure: ${metadata.error || 'Unknown error'}`,
      details: metadata
    })
    score -= 0.8 // Critical deduction for API-reported failures
  }

  // 4. Technical Validation (placeholder for future computer vision)
  // TODO: Future enhancement - analyze video for:
  // - Black frames
  // - Frozen content
  // - Audio/video sync issues
  // - Resolution/format problems
  // - Artifacts or corruption

  // 5. Basic URL Validation
  if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
    issues.push({
      type: 'technical',
      severity: 'critical',
      message: 'Invalid or missing video URL',
      details: { videoUrl }
    })
    score -= 1.0 // Complete failure if no video URL
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  // Round to 2 decimal places
  score = Math.round(score * 100) / 100

  const result: QualityValidationResult = {
    score,
    issues,
    passed: score >= 0.5, // Pass threshold: 50% or higher
    validatedAt: new Date().toISOString()
  }

  console.log(`[Quality Validation] Video: ${videoUrl.substring(0, 50)}... | Score: ${score} | Passed: ${result.passed} | Issues: ${issues.length}`)

  return result
}

/**
 * Determines if a video should be automatically refunded based on quality score
 * @param qualityScore - Quality score from validation (0-1)
 * @returns true if the video should be auto-refunded
 */
export function shouldAutoRefund(qualityScore: number): boolean {
  return qualityScore < 0.5 // Refund if quality score is below 50%
}

/**
 * Gets a human-readable summary of quality issues
 * @param issues - Array of quality issues
 * @returns Formatted summary string
 */
export function getQualityIssuesSummary(issues: QualityIssue[]): string {
  if (issues.length === 0) {
    return 'No quality issues detected'
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length
  const lowCount = issues.filter(i => i.severity === 'low').length

  const summary = []
  if (criticalCount > 0) summary.push(`${criticalCount} critical`)
  if (highCount > 0) summary.push(`${highCount} high`)
  if (mediumCount > 0) summary.push(`${mediumCount} medium`)
  if (lowCount > 0) summary.push(`${lowCount} low`)

  return `${issues.length} quality issue${issues.length !== 1 ? 's' : ''} found (${summary.join(', ')})`
}
