Story 11.2: Bulk Batch Processing

Parent Epic: Epic 11 - Bulk Generation Engine (CSV Upload)

Description

As a System,
I want to process these URLs in a controlled queue,
So that I don't hit ScraperAPI or OpenAI rate limits and ensure reliable execution.

Acceptance Criteria

[ ] Batch Tracking: Backend creates a video_batches record (id, user_id, status, total_items, processed_items).

[ ] Credit Check: Global credit check performed upfront (e.g., User needs 50 credits to start a 50-video batch). Credits are reserved or deducted.

[ ] Queue Mechanism:

The system iterates through the valid rows.

Triggers the Scrape -> Script flow for each.

CRITICAL: This must be an async queue (likely needing Inngest, QStash, or a purely database-driven worker if running on Vercel without timeouts).

[ ] Rate Limiting: Concurrency limited to 5 parallel requests to avoid API bans.

Technical Notes

Architecture Decision: Since Vercel functions time out after 10-60s, we cannot loop 50 times in one API call.

Approach:

Option A: Use a recursive Vercel function (one finishes, calls the next).

Option B (Recommended): Use a robust queue solution (Inngest is great for Next.js).

Option C (MVP): Client-side "waterfall" (Browser stays open and calls API 1-by-1). Decision needed by Architect.