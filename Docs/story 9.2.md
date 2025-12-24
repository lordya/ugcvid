Story 9.2: The "Post to Social" Modal

Parent Epic: Epic 9 - Social Media Management & Auto-Posting

Description

As a User,
I want to click a "Post" button on a completed video and customize the metadata,
So that I can tailor the caption and hashtags for each platform.

Acceptance Criteria

[ ] Entry Points: "Share/Post" action added to:

The Video Player Modal (VideoPlayerModal.tsx)

The Library card menu (VideoCard.tsx)

[ ] Modal UI:

Platform Toggles: Checkboxes for connected accounts (e.g., [x] TikTok, [ ] YouTube).

Caption Input: Text area auto-filled with the video description.

Hashtags Input: Separate field or appended to caption.

[ ] Validation: Enforce platform-specific character limits (e.g., TikTok caption max length).

[ ] Action: "Post Now" button triggers the publication process via API.

Technical Notes

Endpoint: POST /api/social/publish

Payload: { videoId: string, platforms: ['tiktok', 'youtube'], caption: string, tags: string[] }

Logic: The backend will handle the multi-platform posting logic (likely delegating to an async job if processing time is high).