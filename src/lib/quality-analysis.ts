export type QualityRiskLevel = 'low' | 'medium' | 'high'

/**
 * Analyzes script content and input images to determine quality risk level
 * for video generation. Returns a risk assessment that helps select appropriate
 * AI models and configurations.
 *
 * Risk Levels:
 * - High: Complex elements like hands, text overlays, fine details
 * - Medium: Text elements, complex scenes, longer scripts
 * - Low: Generic scenes, scenery, simple talking heads
 */
export function analyzeContentForQuality(script: string, images: string[]): QualityRiskLevel {
  // Normalize script for analysis
  const normalizedScript = script.toLowerCase().trim()

  // Count words for complexity analysis
  const wordCount = normalizedScript.split(/\s+/).length

  // High Risk Keywords (hands, fine motor skills, detailed gestures)
  const highRiskKeywords = [
    'hand', 'hands', 'finger', 'fingers', 'holding', 'writing', 'typing',
    'gesture', 'gestures', 'pointing', 'grabbing', 'touching', 'waving'
  ]

  // Check for high risk keywords
  const hasHighRiskKeywords = highRiskKeywords.some(keyword =>
    normalizedScript.includes(keyword)
  )

  // Detect text overlays (> 3 text elements)
  // Look for patterns that suggest multiple text overlays
  const textOverlayIndicators = [
    // Multiple "text:" or "overlay:" mentions
    /(?:text|overlay)[\s:]+[^.]*(?:text|overlay)[\s:]+[^.]*(?:text|overlay)[\s:]+[^.]*(?:text|overlay)/i,
    // Multiple quoted text elements
    /"[^"]*"[^"]*"[^"]*"[^"]*"/,
    // Multiple instances of text-related terms
    /(?:shows?|displays?|says?|reads?)\s+["'][^"']*["'][^"']*["'][^"']*["']/i,
    // Structured text overlays (common in video scripts)
    /text\s+overlay[\s\S]*?text\s+overlay[\s\S]*?text\s+overlay[\s\S]*?text\s+overlay/i,
    // Multiple numbered/counted text elements
    /(?:first|second|third|1st|2nd|3rd|4th|5th).*?(?:first|second|third|1st|2nd|3rd|4th|5th).*?(?:first|second|third|1st|2nd|3rd|4th|5th).*?(?:first|second|third|1st|2nd|3rd|4th|5th)/i
  ]

  const hasMultipleTextOverlays = textOverlayIndicators.some(pattern =>
    pattern.test(normalizedScript)
  )

  // High Risk: Hands/fine details OR multiple text overlays
  if (hasHighRiskKeywords || hasMultipleTextOverlays) {
    return 'high'
  }

  // Medium Risk Keywords (text elements, reading, signs)
  const mediumRiskKeywords = [
    'read', 'reading', 'reads', 'text', 'texts', 'sign', 'signs',
    'label', 'labels', 'screen', 'screens', 'display', 'displays',
    'caption', 'captions', 'subtitle', 'subtitles'
  ]

  // Check for medium risk keywords
  const hasMediumRiskKeywords = mediumRiskKeywords.some(keyword =>
    normalizedScript.includes(keyword)
  )

  // Medium Risk: Text-related keywords OR long script (>120 words)
  if (hasMediumRiskKeywords || wordCount > 120) {
    return 'medium'
  }

  // Low Risk: Everything else (generic b-roll, scenery, talking heads without hands)
  return 'low'
}

/**
 * Utility function to get risk level description for logging/debugging
 */
export function getRiskLevelDescription(risk: QualityRiskLevel): string {
  switch (risk) {
    case 'high':
      return 'High Risk - Complex elements (hands, gestures, multiple text overlays)'
    case 'medium':
      return 'Medium Risk - Text elements or complex pacing (long scripts)'
    case 'low':
      return 'Low Risk - Generic scenes (b-roll, scenery, simple talking heads)'
  }
}
