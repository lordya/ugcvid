# Image URL Limits Implementation

## Problem
The Kie.ai API was returning error 400: "The number of image URLs must not exceed 1" for certain models that only accept a single image URL, while the code was sending multiple image URLs.

## Solution
Implemented comprehensive image URL validation and limiting based on each model's capabilities according to official Kie.ai API documentation.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/20251229000000_add_max_image_urls_to_models.sql`

- Added `max_image_urls` to `model_config` JSONB field for all models
- Added `image_url_field_name` to indicate whether model uses `image_url` (singular) or `image_urls` (plural)
- Updated all existing model configurations with correct limits:
  - **Models with max 1 image URL** (use `image_url`):
    - Bytedance models
    - Hailuo models
    - Kling models
    - Runway models
    - Wan models
    - Veo3.1 models
    - Seedance models
  - **Models with multiple image URLs** (use `image_urls`):
    - Sora2 models (max 10)
    - Grok Imagine Video (max 10)

### 2. TypeScript Interface Updates
**File**: `src/lib/kie-models.ts`

- Added `maxImageUrls?: number` to `KieModel` interface
- Added `imageUrlFieldName?: 'image_url' | 'image_urls'` to `KieModel` interface
- Updated all model definitions with correct limits:
  - Models using `image_url`: `maxImageUrls: 1, imageUrlFieldName: 'image_url'`
  - Models using `image_urls`: `maxImageUrls: 10, imageUrlFieldName: 'image_urls'`

### 3. Payload Generation Updates
**File**: `src/lib/prompts.ts`

- Updated `generateVideoGenerationPayload` function to:
  1. Look up model configuration from `KIE_MODELS`
  2. Validate image URL count against `maxImageUrls`
  3. Limit image URLs to the maximum allowed (with warning log)
  4. Use correct field name (`image_url` vs `image_urls`) based on model
  5. Handle singular vs plural correctly:
     - For `image_url`: Use first image only
     - For `image_urls`: Use array of limited images

### 4. Bug Fixes
- Fixed incorrect model references (`KIE_MODELS.sora2` → `KIE_MODELS['sora-2-text-to-video']`)

## Model-Specific Configuration

| Model | Max Image URLs | Field Name | Notes |
|-------|---------------|------------|-------|
| Veo 3.1 Fast | 1 | `image_url` | Single image only |
| Veo 3.1 Quality | 1 | `image_url` | Single image only |
| Runway Gen-4 Turbo | 1 | `image_url` | Single image only |
| Wan 2.2 Turbo | 1 | `image_url` | Single image only |
| Wan 2.6 | 1 | `image_url` | Single image only |
| Kling 2.1 Master | 1 | `image_url` | Single image only |
| Kling 2.6 | 1 | `image_url` | Single image only |
| Sora 2 Text-to-Video | 10 | `image_urls` | Multiple images supported |
| Sora 2 Pro Storyboard | 10 | `image_urls` | Multiple images supported |
| Hailuo 2.3 Pro | 1 | `image_url` | Single image only |
| Bytedance v1 Lite | 1 | `image_url` | Single image only |
| Seedance Pro Fast | 1 | `image_url` | Single image only |
| Grok Imagine Video | 10 | `image_urls` | Multiple images supported |

## Validation Logic

1. **Model Lookup**: Function looks up model by `kieApiModelName` or `id` in `KIE_MODELS`
2. **Limit Check**: If `imageUrls.length > maxImageUrls`, logs warning and limits to first N URLs
3. **Field Selection**: Uses `imageUrlFieldName` to determine correct API field name
4. **Payload Construction**:
   - For `image_url`: Sets `input.image_url = limitedImageUrls[0]`
   - For `image_urls`: Sets `input.image_urls = limitedImageUrls`

## Testing Recommendations

1. Test with models that accept only 1 image URL (e.g., Kling, Wan, Bytedance)
2. Test with models that accept multiple image URLs (e.g., Sora 2)
3. Verify warning logs when image URLs are limited
4. Verify correct field names in API payloads
5. Test edge cases: empty image URLs, single image, multiple images

## Migration Instructions

1. Run the database migration:
   ```sql
   -- Execute: supabase/migrations/20251229000000_add_max_image_urls_to_models.sql
   ```

2. The code changes are backward compatible - existing code will continue to work, but now with proper validation and limiting.

## Notes

- Default behavior: If model is not found in `KIE_MODELS`, defaults to `maxImageUrls: 1` and `imageUrlFieldName: 'image_url'` (safest option)
- Warning logs help identify when image URLs are being limited
- Database migration updates existing records - no data loss
- All changes are backward compatible

