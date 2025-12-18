import { test, expect, Page, Route } from '@playwright/test'

/**
 * Happy Path E2E Test
 * 
 * Tests the full user journey:
 * 1. Login (mocked auth)
 * 2. Navigate to wizard
 * 3. Enter Amazon URL and fetch product
 * 4. Review script and select images
 * 5. Generate video
 * 6. Verify video appears in library
 */

test.describe('Happy Path: Video Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - bypass login by setting session cookie
    // In a real scenario, you might want to use actual test credentials
    // For now, we'll mock the auth check to return a user
    await page.addInitScript(() => {
      // Mock Supabase auth to always return a test user
      // This is a simplified approach - in production you'd use actual test auth
      window.localStorage.setItem('test-user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com'
      }))
    })

    // Mock all external API calls
    await setupMocks(page)
  })

  test('User can generate a video through the full wizard flow', async ({ page }) => {
    // Step 1: Navigate to wizard (will redirect to login if not authenticated)
    // Since we're mocking auth, we'll navigate directly to wizard
    await page.goto('/wizard')

    // Wait for wizard page to load
    await expect(page.locator('h1')).toContainText(/Create Your Video|Script Review/i)

    // Step 2: If we're on the input page, fill Amazon URL
    const amazonUrlInput = page.locator('input[type="url"], input[placeholder*="amazon"]').first()
    if (await amazonUrlInput.isVisible()) {
      await amazonUrlInput.fill('https://www.amazon.com/dp/B08N5WRWNW')
      
      // Click "Fetch Product Details" button
      const fetchButton = page.locator('button:has-text("Fetch"), button:has-text("Fetch Product")').first()
      await fetchButton.click()

      // Wait for navigation to script review page
      await page.waitForURL('/wizard/script', { timeout: 10000 })
    }

    // Step 3: Verify we're on the script review page
    await expect(page.locator('h1')).toContainText(/Script Review|Review/i)

    // Wait for script to be generated (mocked API should return immediately)
    await page.waitForTimeout(1000)

    // Verify script textarea has content
    const scriptTextarea = page.locator('textarea').first()
    await expect(scriptTextarea).not.toBeEmpty({ timeout: 5000 })

    // Step 4: Select at least one image
    // Look for image selection buttons/checkboxes
    const imageSelectors = page.locator('img, [data-image], button[aria-label*="image" i]')
    const imageCount = await imageSelectors.count()
    
    if (imageCount > 0) {
      // Click the first image to select it
      await imageSelectors.first().click()
      await page.waitForTimeout(500)
    }

    // Step 5: Click "Generate Video" button
    const generateButton = page.locator('button:has-text("Generate Video"), button:has-text("Generate")').filter({ hasText: /video/i }).first()
    
    // Wait for button to be enabled
    await expect(generateButton).toBeEnabled({ timeout: 5000 })
    
    // Click generate
    await generateButton.click()

    // Step 6: Wait for redirect to library
    await page.waitForURL('/library', { timeout: 10000 })

    // Step 7: Verify we're on the library page
    await expect(page.locator('h1')).toContainText(/Library/i)

    // Step 8: Verify video card appears (with PROCESSING or COMPLETED status)
    // The video should appear in the library grid
    const videoCard = page.locator('[data-video-id], .video-card, [class*="card"]').first()
    await expect(videoCard).toBeVisible({ timeout: 10000 })

    // Verify video status badge is visible
    const statusBadge = page.locator('text=/Processing|Ready|Completed|Generating/i').first()
    await expect(statusBadge).toBeVisible({ timeout: 5000 })
  })

  test('User sees toast notification when generation starts', async ({ page }) => {
    await page.goto('/wizard')

    // Navigate through wizard quickly
    const amazonUrlInput = page.locator('input[type="url"]').first()
    if (await amazonUrlInput.isVisible()) {
      await amazonUrlInput.fill('https://www.amazon.com/dp/B08N5WRWNW')
      const fetchButton = page.locator('button:has-text("Fetch")').first()
      await fetchButton.click()
      await page.waitForURL('/wizard/script')
    }

    // Wait for script
    await page.waitForTimeout(1000)

    // Select image
    const imageSelector = page.locator('img, [data-image]').first()
    if (await imageSelector.isVisible()) {
      await imageSelector.click()
      await page.waitForTimeout(500)
    }

    // Generate video
    const generateButton = page.locator('button:has-text("Generate Video")').first()
    await generateButton.click()

    // Check for toast notification
    const toast = page.locator('text=/Generation started|Your video is being created/i')
    await expect(toast).toBeVisible({ timeout: 2000 })
  })
})

/**
 * Setup API mocks for all external dependencies
 */
async function setupMocks(page: Page) {
  // Mock Amazon scraping API
  await page.route('**/api/generate/scrape', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Test Product - Premium Wireless Headphones',
        description: 'Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design.',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
        ],
      }),
    })
  })

  // Mock script generation API
  await page.route('**/api/generate/script', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        script: 'Hey everyone! Today I\'m reviewing these amazing wireless headphones. The sound quality is incredible, and the noise cancellation is a game-changer. Perfect for your daily commute or workout. Check them out in the link below!',
      }),
    })
  })

  // Mock video generation API (Kie.ai)
  let videoIdCounter = 1
  await page.route('**/api/generate/video', async (route: Route) => {
    const videoId = `test-video-${videoIdCounter++}`
    const taskId = `test-task-${Date.now()}`
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        videoId,
        status: 'PROCESSING',
        task_id: taskId,
      }),
    })
  })

  // Mock video status API - return COMPLETED after first poll
  let statusPollCount = 0
  await page.route('**/api/videos/*/status', async (route: Route) => {
    statusPollCount++
    
    if (statusPollCount === 1) {
      // First poll: return COMPLETED immediately (mocked fast completion)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-video-1',
          status: 'COMPLETED',
          videoUrl: 'https://example.com/video/test-video.mp4',
        }),
      })
    } else {
      // Subsequent polls: return COMPLETED
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-video-1',
          status: 'COMPLETED',
          videoUrl: 'https://example.com/video/test-video.mp4',
        }),
      })
    }
  })

  // Mock payment endpoints (Lemon Squeezy)
  await page.route('**/api/payment/lemonsqueezy/checkout', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        checkoutUrl: 'https://checkout.lemonsqueezy.com/test-checkout',
        orderId: 'test-order-123',
      }),
    })
  })

  // Mock payment endpoints (Cryptomus)
  await page.route('**/api/payment/cryptomus/checkout', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        paymentUrl: 'https://pay.cryptomus.com/test-payment',
        orderId: 'test-order-456',
        paymentId: 'test-payment-789',
      }),
    })
  })

  // Mock library API to return a video after generation
  await page.route('**/library**', async (route: Route) => {
    // Let the route continue normally, but we'll intercept the API calls
    await route.continue()
  })
}

