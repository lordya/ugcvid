Story 10.1: Social Analytics Polling (The "Ear")

Parent Epic: Epic 10 - The AI Feedback Loop (Performance Analytics)

Description

As a System,
I want to periodically check the view counts and engagement metrics of published videos,
So that we have data on actual performance.

Acceptance Criteria

[ ] Automation: A backend cron job (Vercel Cron) runs daily.

[ ] Target: It queries the social APIs (TikTok, YouTube, IG) for all video_posts created > 24 hours ago and < 30 days ago.

[ ] Data Points: Fetches view_count, like_count, share_count.

[ ] Storage: Updates the video_posts table with these metrics and a last_updated timestamp.

[ ] Resilience: The job handles API rate limits gracefully (e.g., exponential backoff or batching).

Technical Notes

Cron: /api/cron/social-stats

API Limits: Be mindful of quota usage. Prioritize videos posted more recently (last 7 days) if quotas are tight.