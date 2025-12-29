-- Migration: Add max_image_urls configuration to model_config
-- This migration adds the maximum number of image URLs each model can accept
-- Based on official Kie.ai API documentation

-- ============================================
-- 1. UPDATE MODEL CONFIGS WITH MAX_IMAGE_URLS
-- ============================================

-- Models that use image_url (singular) - max 1 image
-- These models only accept a single image URL, not an array

-- Bytedance models - use image_url (singular)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'bytedance/v1-lite-text-to-video',
  'bytedance/v1-lite-image-to-video',
  'bytedance/v1-pro-image-to-video'
);

-- Hailuo models - use image_url (singular)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'hailuo/02-text-to-video-pro',
  'hailuo/02-text-to-video-standard',
  'hailuo/02-image-to-video-pro'
);

-- Kling models - use image_url (singular)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'kling/v2-1-master-text-to-video',
  'kling/v2-1-master-image-to-video',
  'kling/v2-1-standard'
);

-- Runway models - use imageUrl (singular)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'runway-duration-5-generate',
  'runway-duration-10-generate'
);

-- Wan models - use image_url (singular) for image-to-video, text-to-video doesn't use images
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'wan/2-2-a14b-text-to-video-turbo',
  'wan/2-6-text-to-video',
  'wan/2-2-text-to-video',
  'wan/2-2-image-to-video',
  'wan/2-6-image-to-video'
);

-- Veo3.1 models - use image_url (singular) for image-to-video
-- Text-to-video doesn't use images, but if used, max 1
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name IN (
  'veo3',
  'veo3_fast'
);

-- Models that use image_urls (plural) - can accept multiple images
-- These models accept an array of image URLs

-- Sora2 models - use image_urls (array)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '10'::jsonb
)
WHERE kie_api_model_name IN (
  'sora-2-pro-text-to-video',
  'sora-2-pro-image-to-video',
  'sora-2-pro-storyboard'
);

-- Grok Imagine Video - use image_urls (array)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '10'::jsonb
)
WHERE kie_api_model_name IN (
  'grok-imagine/text-to-video',
  'grok-imagine/image-to-video'
);

-- Seedance models - default to 1 (not explicitly documented, but likely 1)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{max_image_urls}',
  '1'::jsonb
)
WHERE kie_api_model_name = 'seedance-pro-fast';

-- ============================================
-- 2. ADD IMAGE_URL_FIELD_NAME TO MODEL_CONFIG
-- ============================================
-- This indicates whether the model uses 'image_url' (singular) or 'image_urls' (plural)

-- Models using image_url (singular)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{image_url_field_name}',
  '"image_url"'::jsonb
)
WHERE kie_api_model_name IN (
  'bytedance/v1-lite-text-to-video',
  'bytedance/v1-lite-image-to-video',
  'bytedance/v1-pro-image-to-video',
  'hailuo/02-text-to-video-pro',
  'hailuo/02-text-to-video-standard',
  'hailuo/02-image-to-video-pro',
  'kling/v2-1-master-text-to-video',
  'kling/v2-1-master-image-to-video',
  'kling/v2-1-standard',
  'runway-duration-5-generate',
  'runway-duration-10-generate',
  'wan/2-2-a14b-text-to-video-turbo',
  'wan/2-6-text-to-video',
  'wan/2-2-text-to-video',
  'wan/2-2-image-to-video',
  'wan/2-6-image-to-video',
  'veo3',
  'veo3_fast',
  'seedance-pro-fast'
);

-- Models using image_urls (plural)
UPDATE public.model_prompts
SET model_config = jsonb_set(
  COALESCE(model_config, '{}'::jsonb),
  '{image_url_field_name}',
  '"image_urls"'::jsonb
)
WHERE kie_api_model_name IN (
  'sora-2-pro-text-to-video',
  'sora-2-pro-image-to-video',
  'sora-2-pro-storyboard',
  'grok-imagine/text-to-video',
  'grok-imagine/image-to-video'
);

-- ============================================
-- 3. COMMENTS
-- ============================================

COMMENT ON COLUMN public.model_prompts.model_config IS 'Model configuration including pricing, capabilities, constraints, max_image_urls (max number of image URLs allowed), and image_url_field_name (field name: "image_url" or "image_urls")';

