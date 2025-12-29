// Test script to verify Kie.ai payload generation with callback URL
process.env.KIE_CALLBACK_URL = 'https://ugcvid.vercel.app/api/webhooks/kie';

console.log('Testing Kie.ai payload generation with callback URL...\n');

// Mock the required dependencies
const QUALITY_TIERS = {
  standard: {
    resolution: '720p',
    fps: 30,
    modelPreference: 'standard',
    enhancedPrompts: false,
    description: 'Fast, cost-effective generation'
  },
  premium: {
    resolution: '1080p',
    fps: 60,
    modelPreference: 'premium',
    enhancedPrompts: true,
    description: 'High-quality, cinematic generation'
  }
};

const MODEL_QUALITY_CONFIGS = {
  'sora-2-text-to-video': {
    negativePrompt: ['extra fingers', 'blurry text'],
    qualityInstructions: 'High fidelity, sharp details',
    recommendedFor: ['conversational', 'authentic'],
    avoidFor: ['complex hands', 'detailed text']
  }
};

const NEGATIVE_PROMPTS = ['blurry', 'low quality', 'artifacts'];

function enhancePromptWithQualityInstructions(prompt, riskLevel) {
  // Simple mock implementation
  return prompt;
}

// Simplified version of generateVideoGenerationPayload
function generateVideoGenerationPayload(params) {
  const {
    prompt,
    imageUrls,
    aspectRatio = 'portrait',
    quality = 'hd',
    duration,
    model = 'sora-2-text-to-video',
    riskLevel = 'low',
    qualityTier = 'standard'
  } = params;

  const enhancedPrompt = enhancePromptWithQualityInstructions(prompt, riskLevel);
  const modelConfig = MODEL_QUALITY_CONFIGS[model];
  const allNegativePrompts = modelConfig
    ? [...new Set([...NEGATIVE_PROMPTS, ...modelConfig.negativePrompt])]
    : NEGATIVE_PROMPTS;

  const negativePromptString = ` Avoid ${allNegativePrompts.join(', ')}.`;
  const modelInstructions = modelConfig?.qualityInstructions
    ? ` ${modelConfig.qualityInstructions}.`
    : '';

  const finalPrompt = enhancedPrompt + modelInstructions + negativePromptString;
  const qualityConfig = QUALITY_TIERS[qualityTier];

  const payload = {
    model,
    input: {
      prompt: finalPrompt,
      image_urls: imageUrls,
      aspect_ratio: aspectRatio,
      quality: quality,
      resolution: qualityConfig.resolution,
      fps: qualityConfig.fps,
      ...(duration && { duration })
    }
  };

  // Only add callback URL if explicitly configured
  if (process.env.KIE_CALLBACK_URL) {
    payload.callBackUrl = process.env.KIE_CALLBACK_URL;
  }

  return payload;
}

// Test the payload generation
try {
  const payload = generateVideoGenerationPayload({
    prompt: 'Test video generation prompt',
    imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    aspectRatio: 'portrait',
    quality: 'hd',
    duration: 15,
    model: 'sora-2-text-to-video',
    riskLevel: 'low',
    qualityTier: 'premium'
  });

  console.log('✅ Payload generated successfully!');
  console.log('📋 Generated payload:');
  console.log(JSON.stringify(payload, null, 2));

  console.log('\n🔍 Payload analysis:');
  console.log('• Model:', payload.model);
  console.log('• Has callback URL:', 'callBackUrl' in payload);
  console.log('• Callback URL:', payload.callBackUrl || 'Not set');
  console.log('• Duration:', payload.input.duration);
  console.log('• Resolution:', payload.input.resolution);
  console.log('• FPS:', payload.input.fps);
  console.log('• Image URLs count:', payload.input.image_urls.length);

} catch (error) {
  console.error('❌ Error generating payload:', error.message);
}
