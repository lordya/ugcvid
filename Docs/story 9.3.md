Story 9.3: Publication Queue & Status

Parent Epic: Epic 9 - Social Media Management & Auto-Posting

Description

As a User,
I want to see the status of my posts in the dashboard,
So that I know if a video was successfully published or if it failed.

Acceptance Criteria

[ ] UI Indicators: Library view cards show a "Social Status" icon row (e.g., TikTok logo with a green check or red 'X').

[ ] Detailed Status: Hovering over the indicator shows the specific status (e.g., "Published at 10:42 AM" or "Failed: Token Expired").

[ ] Error Handling: If a post fails, the user receives a specific error message and a "Retry" option.

[ ] Tracking: Successful posts store the external social_post_id in a video_posts table.

Technical Notes

New Table: video_posts (id, video_id, integration_id, external_post_id, status, error_message, posted_at).

Updates: The UI should poll or subscribe to changes in this table to update the icons asynchronously.