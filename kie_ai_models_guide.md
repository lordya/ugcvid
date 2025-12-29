# Kie.ai AI Models Comprehensive Guide

## Overview

Kie.ai provides a comprehensive suite of AI APIs for video, audio, image, and utility services. This guide covers all available models, their setup requirements, parameters, costs, and use cases.

## Table of Contents

1. [Video Generation APIs](#video-generation-apis)
   - [Veo3.1 API](#veo31-api)
   - [Runway API](#runway-api)
   - [Luma API](#luma-api)
   - [Wan Models](#wan-models)
   - [Kling Models](#kling-models)
   - [Sora2 Models](#sora2-models)
   - [Bytedance Models](#bytedance-models)
   - [Hailuo Models](#hailuo-models)
   - [Grok Imagine Video](#grok-imagine-video)

2. [Audio & Music APIs](#audio--music-apis)
   - [Suno API](#suno-api)
   - [ElevenLabs](#elevenlabs)

3. [Image Generation APIs](#image-generation-apis)
   - [4O Image API](#4o-image-api)
   - [Flux Kontext API](#flux-kontext-api)
   - [Ideogram Models](#ideogram-models)
   - [Recraft Models](#recraft-models)
   - [Topaz Models](#topaz-models)
   - [Seedream Models](#seedream-models)
   - [Grok Imagine Image](#grok-imagine-image)

4. [Utility APIs](#utility-apis)
   - [File Upload API](#file-upload-api)
   - [Common API](#common-api)

5. [Pricing & Costs](#pricing--costs)

---

## Video Generation APIs

### Veo3.1 API

**Overview**: Google's Veo3.1 API for professional-quality video generation with 1080P high-definition output.

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/veo/generate`
- Authentication: Bearer token
- Model: `veo3` (standard) or `veo3_fast` (faster generation)

**Parameters**:
- `prompt` (string): Text description for video generation (English only)
- `aspectRatio` (string): Output aspect ratio (16:9 for HD)
- `callBackUrl` (string): Optional callback URL for completion notifications
- `model` (string): `veo3` or `veo3_fast`

**Costs**: 100-500 credits per generation

**Use Cases**:
- Professional video content creation
- Marketing videos
- Educational content
- Social media videos
- Product demonstrations

**Code Examples**:

```bash
curl -X POST "https://api.kie.ai/api/v1/veo/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
      "prompt": "A cute cat playing in a garden on a sunny day, high quality",
      "model": "veo3",
      "aspectRatio": "16:9",
      "callBackUrl": "https://your-website.com/callback"
    }'
```

```javascript
async function generateVideo() {
  try {
    const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: "A cute cat playing in a garden on a sunny day, high quality",
        model: "veo3",
        aspectRatio: "16:9",
        callBackUrl: "https://your-website.com/callback"
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 200) {
      console.log('Task submitted:', data);
      console.log('Task ID:', data.data.taskId);
      return data.data.taskId;
    } else {
      console.error('Request failed:', data.msg || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

generateVideo();
```

```python
import requests

def generate_video():
    url = "https://api.kie.ai/api/v1/veo/generate"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": "A cute cat playing in a garden on a sunny day, high quality",
        "model": "veo3",
        "aspectRatio": "16:9",
        "callBackUrl": "https://your-website.com/callback"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        result = response.json()

        if response.ok and result.get('code') == 200:
            print(f"Task submitted: {result}")
            print(f"Task ID: {result['data']['taskId']}")
            return result['data']['taskId']
        else:
            print(f"Request failed: {result.get('msg', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

generate_video()
```

### Runway API

**Overview**: Runway's advanced AI video generation with Gen-3 Alpha Turbo model for high-quality video creation.

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/runway/generate`
- Authentication: Bearer token
- Models: `runway-duration-5-generate`, `runway-duration-10-generate`, etc.

**Parameters**:
- `prompt` (string): Detailed description of desired video
- `imageUrl` (string): Optional reference image URL
- `model` (string): Specific Runway model version
- `waterMark` (string): Watermark text (default: "kie.ai")
- `callBackUrl` (string): Callback URL for notifications
- `duration` (string): Video duration ("5" or "10" seconds)
- `quality` (string): "720p" or "1080p"

**Costs**: 100-500 credits per generation

**Use Cases**:
- Text-to-video generation
- Image-to-video animation
- Video extension and modification
- Creative content production
- Advertising and marketing

**Code Examples**:

```bash
curl -X POST "https://api.kie.ai/api/v1/runway/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "prompt": "A fluffy orange cat dancing energetically in a colorful room with disco lights",
  "duration": 5,
  "quality": "720p",
  "aspectRatio": "16:9",
  "waterMark": ""
}'
```

```javascript
async function generateVideo() {
  try {
    const response = await fetch('https://api.kie.ai/api/v1/runway/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A fluffy orange cat dancing energetically in a colorful room with disco lights',
        duration: 5,
        quality: '720p',
        aspectRatio: '16:9',
        waterMark: ''
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 200) {
      console.log('Task submitted:', data);
      console.log('Task ID:', data.data.taskId);
      return data.data.taskId;
    } else {
      console.error('Request failed:', data.msg || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

generateVideo();
```

```python
import requests

def generate_video():
    url = "https://api.kie.ai/api/v1/runway/generate"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": "A fluffy orange cat dancing energetically in a colorful room with disco lights",
        "duration": 5,
        "quality": "720p",
        "aspectRatio": "16:9",
        "waterMark": ""
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        result = response.json()

        if response.ok and result.get('code') == 200:
            print(f"Task submitted: {result}")
            print(f"Task ID: {result['data']['taskId']}")
            return result['data']['taskId']
        else:
            print(f"Request failed: {result.get('msg', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

generate_video()
```

### Luma API

**Overview**: AI-powered video modifications and enhancements using Luma's technology.

**Setup**:
- API Endpoint: Various endpoints for different operations
- Authentication: Bearer token

**Parameters**:
- `video_url` (string): Input video URL
- `callBackUrl` (string): Callback URL for results
- Operation-specific parameters

**Costs**: 100-500 credits per generation

**Use Cases**:
- Video enhancement
- Style transfer
- Video modification
- Content transformation

### Wan Models

**Overview**: Advanced video generation with turbo performance from Wan AI.

**Available Models**:
- `wan/2-2-text-to-video`
- `wan/2-2-image-to-video`
- `wan/2-6-text-to-video`
- `wan/2-6-image-to-video`
- `wan/2-2-animate-replace`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token
- Unified Market API structure

**Parameters** (varies by model):
- `model` (string): Specific Wan model
- `prompt` (string): Text description for generation
- `video_url` (string): Input video URL (for image-to-video)
- `image_url` (string): Input image URL
- `resolution` (string): "480p", "580p", "720p"
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- High-speed video generation
- Video-to-video transformation
- Image animation
- Content creation workflows

**Code Examples** (Wan 2-2 Text-to-Video):

```json
{
  "model": "wan/2-2-a14b-text-to-video-turbo",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "Drone shot, fast traversal, starting inside a cracked, frosty circular pipe. The camera bursts upward through the pipe to reveal a vast polar landscape bathed in golden sunrise light. Workers in orange suits operate steaming machinery. The camera tilts up, revealing the scene from the perspective of a rising hot air balloon. It continues ascending into a glowing sky, the balloon trailing steam and displaying the letters \"KIE AI\" as it rises into breathtaking polar majesty.",
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "enable_prompt_expansion": false,
    "seed": 0,
    "acceleration": "none"
  }
}
```

**Code Examples** (Wan 2-6 Text-to-Video):

```json
{
  "model": "wan/2-6-text-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "In a hyperrealistic ASMR video, a hand uses a knitted knife to slowly slice a burger made entirely of knitted wool. The satisfyingly crisp cut reveals a detailed cross-section of knitted meat, lettuce, and tomato slices. Captured in a close-up with a shallow depth of field, the scene is set against a stark, matte black surface. Cinematic lighting makes the surreal yarn textures shine with clear reflections. The focus is on the deliberate, satisfying motion and the unique, tactile materials.",
    "duration": "5",
    "resolution": "1080p"
  }
}
```

### Kling Models

**Overview**: High-quality video generation with AI avatars from Kling AI.

**Available Models**:
- `kling/v2-1-master-text-to-video`
- `kling/v2-1-master-image-to-video`
- `kling/v2-1-standard`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Kling model
- `prompt` (string): Detailed video description
- `image_url` (string): Reference image URL (for image-to-video)
- `duration` (string): Video duration
- `aspect_ratio` (string): Output aspect ratio
- `negative_prompt` (string): Elements to avoid
- `cfg_scale` (number): Prompt adherence strength
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- AI avatar video creation
- Text-to-video with high quality
- Image-to-video animation
- Professional video content

**Code Examples** (Kling v2.1 Master Text-to-Video):

```json
{
  "model": "kling/v2-1-master-text-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "A majestic eagle soaring through a mountain landscape.",
    "duration": "5",
    "aspect_ratio": "16:9",
    "negative_prompt": "blurry, low quality",
    "cfg_scale": 7.5
  }
}
```

### Sora2 Models

**Overview**: State-of-the-art video generation from OpenAI's Sora technology.

**Available Models**:
- `sora-2-pro-text-to-video`
- `sora-2-pro-image-to-video`
- `sora-watermark-remover`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Sora2 model
- `prompt` (string): Video description
- `image_urls` (array): Input image URLs
- `aspect_ratio` (string): Output aspect ratio
- `num_frames` (number): Number of frames
- `size` (string): Video dimensions
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- High-quality video generation
- Image-to-video conversion
- Watermark removal
- Professional video production

### Bytedance Models

**Overview**: Fast and efficient video generation from Bytedance.

**Available Models**:
- `bytedance/v1-lite-text-to-video`
- `bytedance/v1-lite-image-to-video`
- `bytedance/v1-pro-image-to-video`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Bytedance model
- `prompt` (string): Video description
- `image_url` (string): Input image URL
- `resolution` (string): Video resolution
- `duration` (string): Video duration
- `camera_fixed` (boolean): Camera movement setting
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- Fast video generation
- Social media content
- Quick prototyping
- Marketing materials

**Code Examples** (Bytedance v1 Lite Text-to-Video):

```json
{
  "model": "bytedance/v1-lite-text-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "Wide-angle shot: A serene sailing boat gently sways in the harbor at dawn, surrounded by soft Impressionist hues of pink and orange with ivory accents. The camera slowly pans across the scene, capturing the delicate reflections on the water and the intricate details of the boat's sails as the light gradually brightens.",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": "5",
    "camera_fixed": false,
    "enable_safety_checker": true
  }
}
```

**Code Examples** (Bytedance v1 Pro Image-to-Video):

```json
{
  "model": "bytedance/v1-pro-image-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "A golden retriever dashing through shallow surf at the beach, back angle camera low near waterline, splashes frozen in time, blur trails in waves and paws, afternoon sun glinting off wet fur, overcast day, dramatic clouds",
    "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755179021328w1nhip18.webp",
    "resolution": "720p",
    "duration": "5",
    "camera_fixed": false,
    "seed": -1,
    "enable_safety_checker": true
  }
}
```

### Hailuo Models

**Overview**: High-quality video generation with multiple artistic styles.

**Available Models**:
- `hailuo/02-text-to-video-pro`
- `hailuo/02-text-to-video-standard`
- `hailuo/02-image-to-video-pro`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Hailuo model
- `prompt` (string): Video description (max 1500 chars)
- `image_url` (string): Input image URL
- `duration` (string): "6" or "10" seconds
- `prompt_optimizer` (boolean): Enable prompt optimization
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- Artistic video creation
- Style-consistent content
- Creative video projects
- Advertising content

### Grok Imagine Video

**Overview**: Video generation from xAI's Grok Imagine with motion capabilities.

**Available Models**:
- `grok-imagine/text-to-video`
- `grok-imagine/image-to-video`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Grok model
- `prompt` (string): Video description
- `image_urls` (array): Input image URLs
- `aspect_ratio` (string): Output aspect ratio
- `mode` (string): "fun", "normal", or "spicy"
- `callBackUrl` (string): Optional callback URL

**Costs**: 100-500 credits per generation

**Use Cases**:
- Creative video generation
- Motion graphics
- Dynamic content creation
- Experimental video projects

---

## Audio & Music APIs

### Suno API

**Overview**: High-quality AI music and audio generation with multiple models.

**Available Models**:
- V3_5 (4 minutes, better structure)
- V4 (4 minutes, improved vocals)
- V4_5 (8 minutes, enhanced speed)
- V4_5PLUS (8 minutes, enhanced)
- V4_5ALL (8 minutes, smart prompts)
- V5 (8 minutes, faster generation)

**Setup**:
- API Endpoint: Various endpoints for different operations
- Authentication: Bearer token

**Parameters** (varies by operation):
- `prompt` (string): Music description
- `style` (string): Musical genre/style
- `duration` (string): Desired length
- `model` (string): Specific Suno model
- `callBackUrl` (string): Callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Music composition
- Audio generation
- Song creation
- Soundtrack production
- Audio enhancement

**Code Examples**:

```python
import requests

class SunoAPI:
    def __init__(self, api_key, base_url='https://inference-gateway.suno.ai'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {self.api_key}'}

    def generate_music(self, prompt, custom_mode=False, instrumental=False, model='V4', style='', title=''):
        data = {
            'prompt': prompt,
            'customMode': custom_mode,
            'instrumental': instrumental,
            'model': model,
            'title': title,
            'voiceDescription': '',
            'input': '',
            'continueAt': 0,
            'duration': 15,
            'output': 'mp3',
            'song_description': '',
            'ai_description': '',
            'style': style
        }

        response = requests.post(f'{self.base_url}/generate-music',
                               headers=self.headers, json=data)
        result = response.json()

        if not response.ok or result.get('code') != 200:
            raise Exception(f"Music generation failed: {result.get('msg', 'Unknown error')}")

        return result['data']['taskId']

# Usage
api = SunoAPI('YOUR_API_KEY')
task_id = api.generate_music(
    'A nostalgic folk song about childhood memories',
    customMode=True,
    instrumental=False,
    model='V4_5',
    style='Folk, Acoustic, Nostalgic',
    title='Childhood Dreams'
)
print(f"Task ID: {task_id}")
```

```javascript
async function generateMusic() {
  try {
    const response = await fetch('https://inference-gateway.suno.ai/generate-music', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A nostalgic folk song about childhood memories',
        customMode: true,
        instrumental: false,
        model: 'V4_5',
        style: 'Folk, Acoustic, Nostalgic',
        title: 'Childhood Dreams'
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 200) {
      console.log('Music generation started:', data);
      console.log('Task ID:', data.data.taskId);
      return data.data.taskId;
    } else {
      console.error('Request failed:', data.msg || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

generateMusic();
```

### ElevenLabs

**Overview**: High-quality text-to-speech and voice synthesis.

**Available Models**:
- `elevenlabs/text-to-speech-multilingual-v2`
- `elevenlabs/speech-to-text`
- `elevenlabs/audio-isolation`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific ElevenLabs model
- `text` (string): Text to convert (max 5000 chars)
- `voice` (string): Voice selection
- `stability` (number): Voice stability (0-1)
- `similarity_boost` (number): Voice similarity (0-1)
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Text-to-speech conversion
- Voice synthesis
- Audio narration
- Voice cloning
- Audio processing

---

## Image Generation APIs

### 4O Image API

**Overview**: Advanced image generation and editing powered by GPT-4o vision model.

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/gpt4o-image/generate`
- Authentication: Bearer token

**Parameters**:
- `prompt` (string): Text description for generation
- `filesUrl` (array): Reference image URLs (up to 5)
- `size` (string): Aspect ratio ("1:1", "3:2", "2:3")
- `nVariants` (number): Number of variants (1, 2, or 4)
- `callBackUrl` (string): Optional callback URL
- `isEnhance` (boolean): Enable prompt enhancement
- `enableFallback` (boolean): Enable fallback models

**Costs**: 10-50 credits per generation (varies by variant count)

**Use Cases**:
- Text-to-image generation
- Image editing and manipulation
- Creative artwork
- Marketing visuals
- Product visualization

**Code Examples**:

```python
import requests

def generate_image():
    url = "https://api.kie.ai/api/v1/gpt4o-image/generate"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style",
        "size": "1:1",
        "nVariants": 1
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        result = response.json()

        if response.ok and result.get('code') == 200:
            print(f"Task submitted: {result}")
            print(f"Task ID: {result['data']['taskId']}")
            return result['data']['taskId']
        else:
            print(f"Request failed: {result.get('msg', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

generate_image()
```

```javascript
async function generateImage() {
  try {
    const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style',
        size: '1:1',
        nVariants: 1
      })
    });

    const data = await response.json();

    if (response.ok && data.code === 200) {
      console.log('Task submitted:', data);
      console.log('Task ID:', data.data.taskId);
      return data.data.taskId;
    } else {
      console.error('Request failed:', data.msg || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

generateImage();
```

```bash
curl -X POST "https://api.kie.ai/api/v1/gpt4o-image/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style",
    "size": "1:1",
    "nVariants": 1
  }'
```

### Flux Kontext API

**Overview**: Context-aware image generation and editing with Flux technology.

**Available Models**:
- `flux-kontext-pro` (standard performance)
- `flux-kontext-max` (enhanced capabilities)

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/flux/kontext/generate`
- Authentication: Bearer token

**Parameters**:
- `prompt` (string): Image description
- `inputImage` (string): Base image URL (for editing)
- `aspectRatio` (string): Output aspect ratio
- `model` (string): Flux model version
- `outputFormat` (string): "jpeg" or "png"
- `watermark` (string): Optional watermark
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Text-to-image generation
- Image editing
- Creative design
- Artistic projects
- Professional imaging

**Code Examples**:

```python
import requests

class FluxKontextAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://api.kie.ai/api/v1/flux/kontext'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def generate_image(self, prompt, **options):
        data = {
            'prompt': prompt,
            'aspectRatio': options.get('aspectRatio', '16:9'),
            'model': options.get('model', 'flux-kontext-pro'),
            'enableTranslation': options.get('enableTranslation', True),
            'outputFormat': options.get('outputFormat', 'jpeg'),
            **options
        }

        response = requests.post(f'{self.base_url}/generate',
                               headers=self.headers, json=data)
        result = response.json()

        if not response.ok or result.get('code') != 200:
            raise Exception(f"Generation failed: {result.get('msg', 'Unknown error')}")

        return result['data']['taskId']

# Usage
api = FluxKontextAPI('YOUR_API_KEY')
task_id = api.generate_image(
    'A futuristic cityscape at night with neon lights and flying cars',
    aspectRatio='16:9',
    model='flux-kontext-max',
    promptUpsampling=True
)
print(f"Task ID: {task_id}")
```

```javascript
class FluxKontextAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.kie.ai/api/v1/flux/kontext';
  }

  async generateImage(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: options.aspectRatio || '16:9',
        model: options.model || 'flux-kontext-pro',
        enableTranslation: options.enableTranslation !== false,
        outputFormat: options.outputFormat || 'jpeg',
        ...options
      })
    });

    const result = await response.json();
    if (!response.ok || result.code !== 200) {
      throw new Error(`Generation failed: ${result.msg || 'Unknown error'}`);
    }

    return result.data.taskId;
  }
}

// Usage
async function generateImage() {
  const api = new FluxKontextAPI('YOUR_API_KEY');
  const taskId = await api.generateImage(
    'A futuristic cityscape at night with neon lights and flying cars',
    {
      aspectRatio: '16:9',
      model: 'flux-kontext-max',
      promptUpsampling: true
    }
  );
  console.log('Task ID:', taskId);
}

generateImage();
```

```bash
curl -X POST "https://api.kie.ai/api/v1/flux/kontext/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky",
    "aspectRatio": "16:9",
    "model": "flux-kontext-pro"
  }'
```

### Ideogram Models

**Overview**: Creative image generation with character consistency.

**Available Models**:
- `ideogram/v3-text-to-image`
- `ideogram/character`
- `ideogram/character-edit`
- `ideogram/v3-reframe`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters** (varies by model):
- `model` (string): Specific Ideogram model
- `prompt` (string): Image description
- `image_url` (string): Reference image URL
- `mask_url` (string): Mask for editing
- `rendering_speed` (string): "BALANCED", "fast", "high_quality"
- `style` (string): "AUTO", "REALISTIC", "FICTION"
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Character design
- Consistent character generation
- Image editing
- Creative artwork
- Brand consistency

### Recraft Models

**Overview**: Professional image upscaling and background removal.

**Available Models**:
- `recraft/remove-background`
- `recraft/image-upscale` (implied)

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Recraft model
- `image` (string): Input image URL
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Background removal
- Image upscaling
- Professional photo editing
- E-commerce product images
- Marketing materials

### Topaz Models

**Overview**: AI-powered image enhancement and upscaling.

**Available Models**:
- `topaz/image-upscale`
- `topaz/image-enhance` (implied)

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Topaz model
- `image_url` (string): Input image URL
- `upscale_factor` (string): "1", "2", "4", or "8"
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Image upscaling
- Photo enhancement
- Quality improvement
- Professional photography
- Digital art restoration

### Seedream Models

**Overview**: Creative image generation with unique artistic styles from Bytedance.

**Available Models**:
- `bytedance/seedream`
- `bytedance/seedream-v4-text-to-image`
- `seedream/4.5-text-to-image`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Seedream model
- `prompt` (string): Image description (max 5000 chars)
- `image_size` (string): Output dimensions
- `aspect_ratio` (string): Output aspect ratio
- `guidance_scale` (number): Prompt adherence
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Artistic image creation
- Creative design
- Unique style generation
- Artistic projects
- Creative experimentation

### Grok Imagine Image

**Overview**: High-quality photorealistic images and upscaling from xAI.

**Available Models**:
- `grok-imagine/text-to-image`
- `grok-imagine/upscale`

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
- Authentication: Bearer token

**Parameters**:
- `model` (string): Specific Grok model
- `prompt` (string): Image description
- `task_id` (string): Reference task ID for upscaling
- `callBackUrl` (string): Optional callback URL

**Costs**: 10-50 credits per generation

**Use Cases**:
- Photorealistic image generation
- Image upscaling
- High-quality content creation
- Professional photography
- Marketing visuals

---

## Utility APIs

### File Upload API

**Overview**: Secure file upload and management with multiple format support.

**Setup**:
- API Endpoint: Various upload endpoints
- Authentication: Bearer token

**Parameters**:
- `file` (binary): File to upload
- `uploadCn` (boolean): Upload region selection
- Various format-specific parameters

**Costs**: Variable based on file size and type

**Use Cases**:
- File storage for generation tasks
- Asset management
- Content preparation
- Media processing

### Common API

**Overview**: Essential utilities including account management and credit tracking.

**Setup**:
- API Endpoint: `https://api.kie.ai/api/v1/user/credits`
- Authentication: Bearer token

**Parameters**:
- Various endpoint-specific parameters

**Costs**: Free for basic operations

**Use Cases**:
- Credit balance checking
- Account management
- System status monitoring
- Usage tracking

---

## Pricing & Costs

### Credit System

Kie.ai uses a flexible credit-based pricing system:

- **Image Models**: 10-50 credits per generation
- **Video Models**: 100-500 credits per generation
- **Audio Models**: 10-50 credits per generation
- **Language Models**: Charged per token usage

### Key Features

- **99.9% Uptime**: Reliable API performance
- **Affordable Pricing**: Flexible point-based system
- **High Concurrency**: Scalable solutions
- **24/7 Support**: Professional technical assistance
- **Secure Integration**: Enterprise-grade security

### Getting Started

1. Sign up at Kie.ai
2. Get API key from account management
3. Choose appropriate models for your use case
4. Implement authentication with Bearer tokens
5. Use callback URLs for production applications
6. Monitor credit usage and costs

### Best Practices

- Use callbacks instead of polling for better performance
- Download generated content promptly (URLs expire in 14-24 hours)
- Implement proper error handling for rate limits and failures
- Choose appropriate models based on quality vs. speed requirements
- Monitor credit usage to avoid unexpected costs

---

*This guide covers all Kie.ai models available as of December 2025. For the latest updates and new models, check the official Kie.ai documentation.*
