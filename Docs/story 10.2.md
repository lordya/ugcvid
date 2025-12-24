Story 10.2: The "Winner" Tagging Logic

Parent Epic: Epic 10 - The AI Feedback Loop (Performance Analytics)

Description

As a System,
I want to identify top-performing scripts relative to the user's average,
So that we know which content styles are winning.

Acceptance Criteria

[ ] Calculation: Implement logic to calculate a "Performance Score" (e.g., raw views, or views relative to user's follower count if available).

[ ] Benchmarking: Compare a video's score against the user's rolling average for the last 20 videos.

[ ] Tagging:

If Score > (Average * 1.5) -> Tag as is_high_performer.

If Score < (Average * 0.5) -> Tag as is_low_performer.

[ ] Notification: User sees a "High Performer" badge (e.g., a flame icon) on these videos in the dashboard.

Technical Notes

Trigger: This logic runs immediately after the Social Analytics Polling job updates the stats.

Database: Boolean column is_high_performer on videos table (or derived query).