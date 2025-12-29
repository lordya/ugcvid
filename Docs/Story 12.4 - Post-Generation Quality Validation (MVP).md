# Story 12.4: Post-Generation Quality Validation (MVP)

## Overview
As a System, I want to automatically flag potential quality issues post-generation, so that I can ensure users only pay for videos that meet quality standards and automatically refund credits for failed generations.

## Acceptance Criteria ✅

### Validation Service
- ✅ Created `src/lib/quality-validation.ts` with comprehensive validation
- ✅ Implemented `validateVideoQuality(videoUrl, requestedDuration, kieMetadata)` function
- ✅ Returns `QualityValidationResult` with score (0-1) and issues array

### Validation Checks (MVP)

#### Duration Check
- ✅ Fail if video duration < 50% of requested duration
- ✅ Prevents "short video" issues

#### Content Safety Check
- ✅ Flag videos with API-reported content safety warnings
- ✅ Integration with Kie.ai safety metadata

#### Quality Score Calculation
- ✅ 1.0: Perfect (passes all checks)
- ✅ 0.8: Minor issues but acceptable
- ✅ 0.5: Major issues requiring refund
- ✅ 0.0: Critical failure

### Database Integration
- ✅ Created `supabase/migrations/20250129000001_add_quality_metrics.sql`
- ✅ Added `quality_score`, `quality_issues`, `quality_validated_at` to videos table
- ✅ Updated `src/types/supabase-generated.ts` with new types

### Auto-Refund Logic
- ✅ If validation score < 0.5, update video status to `FAILED`
- ✅ Automatically refund credits to user account
- ✅ Log refund reason for analytics

### Integration Points
- ✅ Updated `src/app/api/videos/[id]/status/route.ts` to call validation on `COMPLETED` status
- ✅ Validation runs immediately after Kie.ai completion
- ✅ Results stored in database for future reference

## Technical Implementation

### Quality Validation Service

```typescript
export interface QualityValidationResult {
  score: number // 0.0 to 1.0
  issues: QualityIssue[]
  passed: boolean
  validationTime: Date
}

export interface QualityIssue {
  type: 'duration' | 'content_safety' | 'metadata'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details?: any
}
```

### Validation Algorithm

```typescript
export async function validateVideoQuality(
  videoUrl: string,
  requestedDuration: number,
  kieMetadata: any
): Promise<QualityValidationResult>
```

**Validation Steps:**
1. **Duration Validation**: Compare actual vs requested duration
2. **Metadata Analysis**: Check Kie.ai response for safety flags
3. **Score Calculation**: Weighted scoring based on issue severity
4. **Issue Categorization**: Classify problems by type and severity

### Duration Validation Logic

**Critical Failure (< 50% duration):**
```typescript
const durationRatio = actualDuration / requestedDuration
if (durationRatio < 0.5) {
  issues.push({
    type: 'duration',
    severity: 'critical',
    description: `Video too short (${actualDuration}s vs requested ${requestedDuration}s)`,
    details: { actualDuration, requestedDuration, ratio: durationRatio }
  })
}
```

**Major Issue (50-80% duration):**
```typescript
else if (durationRatio < 0.8) {
  issues.push({
    type: 'duration',
    severity: 'high',
    description: `Video significantly shorter than requested`,
    details: { actualDuration, requestedDuration }
  })
}
```

### Content Safety Validation

**Kie.ai Safety Flags:**
```typescript
if (kieMetadata?.content_safety?.flagged) {
  issues.push({
    type: 'content_safety',
    severity: 'critical',
    description: 'Content safety violation detected',
    details: kieMetadata.content_safety
  })
}
```

**Additional Safety Checks:**
```typescript
if (kieMetadata?.warnings?.length > 0) {
  kieMetadata.warnings.forEach(warning => {
    issues.push({
      type: 'metadata',
      severity: 'medium',
      description: `API Warning: ${warning.message}`,
      details: warning
    })
  })
}
```

### Quality Score Calculation

```typescript
function calculateQualityScore(issues: QualityIssue[]): number {
  if (issues.length === 0) return 1.0 // Perfect

  const severityWeights = {
    low: 0.1,
    medium: 0.25,
    high: 0.5,
    critical: 1.0
  }

  // Calculate weighted penalty
  const totalPenalty = issues.reduce((sum, issue) =>
    sum + severityWeights[issue.severity], 0
  )

  // Ensure score doesn't go below 0.0
  return Math.max(0.0, 1.0 - Math.min(1.0, totalPenalty))
}
```

### Database Schema Changes

**Migration: 20250129000001_add_quality_metrics.sql**
```sql
-- Add quality validation columns to videos table
ALTER TABLE videos
ADD COLUMN quality_score double precision,
ADD COLUMN quality_issues jsonb DEFAULT '[]'::jsonb,
ADD COLUMN quality_validated_at timestamp with time zone;

-- Add check constraint for quality score range
ALTER TABLE videos
ADD CONSTRAINT quality_score_range
CHECK (quality_score >= 0 AND quality_score <= 1);

-- Add comments
COMMENT ON COLUMN videos.quality_score IS 'Quality score from post-generation validation (0-1 scale, 1.0 = perfect)';
COMMENT ON COLUMN videos.quality_issues IS 'Array of quality issues found during validation';
COMMENT ON COLUMN videos.quality_validated_at IS 'Timestamp when quality validation was performed';

-- Create index for quality score queries
CREATE INDEX idx_videos_quality_score ON videos(quality_score);
CREATE INDEX idx_videos_quality_validated_at ON videos(quality_validated_at);
```

### Auto-Refund Implementation

**Credit Refund Logic:**
```typescript
if (validationResult.score < 0.5) {
  // Update video status to FAILED
  await supabase
    .from('videos')
    .update({
      status: 'FAILED',
      error_reason: `Quality validation failed: ${validationResult.issues.map(i => i.description).join(', ')}`
    })
    .eq('id', videoId)

  // Refund credits to user
  const refundAmount = generationCostCredits // Amount deducted during generation
  await supabase.rpc('add_credits', {
    user_id: userId,
    amount: refundAmount,
    type: 'REFUND',
    metadata: {
      reason: 'quality_validation_failure',
      video_id: videoId,
      quality_score: validationResult.score,
      issues: validationResult.issues
    }
  })

  console.log(`[Quality Validation] Refunded ${refundAmount} credits to user ${userId} for failed video ${videoId}`)
}
```

### Integration in Status Polling Route

**Video Status Route Update:**
```typescript
// In src/app/api/videos/[id]/status/route.ts
if (status === 'COMPLETED' && !existingVideo.quality_validated_at) {
  // Run quality validation
  const validationResult = await validateVideoQuality(
    videoData.video_url,
    existingVideo.input_metadata?.duration || 10,
    videoData.metadata
  )

  // Update database with validation results
  await supabase
    .from('videos')
    .update({
      quality_score: validationResult.score,
      quality_issues: validationResult.issues,
      quality_validated_at: new Date().toISOString()
    })
    .eq('id', id)

  // Handle auto-refund for failed quality
  if (!validationResult.passed && validationResult.score < 0.5) {
    await handleQualityFailureRefund(id, userId, generationCostCredits, validationResult)
  }

  console.log(`[Quality Validation] Video ${id} validated with score ${validationResult.score}`)
}
```

### Error Handling and Resilience

**Validation Failure Handling:**
- Graceful degradation if validation service fails
- Manual review queue for ambiguous cases
- Audit trail for all validation decisions

**Network Resilience:**
- Timeout handling for video URL access
- Retry logic for transient failures
- Fallback to metadata-only validation

### Monitoring and Analytics

**Quality Metrics Tracking:**
```sql
-- Quality score distribution
SELECT
  CASE
    WHEN quality_score >= 0.9 THEN 'Excellent (0.9-1.0)'
    WHEN quality_score >= 0.7 THEN 'Good (0.7-0.9)'
    WHEN quality_score >= 0.5 THEN 'Acceptable (0.5-0.7)'
    ELSE 'Poor (< 0.5)'
  END as quality_range,
  COUNT(*) as video_count
FROM videos
WHERE quality_validated_at IS NOT NULL
GROUP BY quality_range
ORDER BY quality_range;
```

**Refund Analytics:**
```sql
-- Quality-related refunds
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as refund_count,
  SUM(amount) as total_credits_refunded
FROM transactions
WHERE type = 'REFUND'
  AND metadata->>'reason' = 'quality_validation_failure'
GROUP BY date
ORDER BY date DESC;
```

### Future Enhancements

**Computer Vision Validation:**
- Visual quality assessment (black frames, artifacts)
- Content accuracy verification (hand count, text legibility)
- Motion quality analysis

**Machine Learning Integration:**
- Predictive quality scoring
- Automated issue classification
- Quality improvement recommendations

**Advanced Features:**
- User feedback integration
- Quality trend analysis
- Model-specific validation rules

## Files Modified
- `src/lib/quality-validation.ts` (new)
- `src/app/api/videos/[id]/status/route.ts` (modified)
- `src/types/supabase-generated.ts` (updated)
- `supabase/migrations/20250129000001_add_quality_metrics.sql` (new)

## Database Schema Changes
- Added `quality_score` (double precision) to videos table
- Added `quality_issues` (jsonb) to videos table
- Added `quality_validated_at` (timestamp) to videos table
- Added check constraints and indexes

## Dependencies
- Supabase client for database operations
- Video URL access for duration validation
- Kie.ai metadata for content safety checks

## Success Metrics
- ✅ All completed videos receive quality validation
- ✅ Failed videos (< 0.5 score) trigger automatic refunds
- ✅ Quality metrics properly stored in database
- ✅ No performance impact on status polling
- ✅ Comprehensive error handling and logging
- ✅ Analytics provide insights into quality trends
