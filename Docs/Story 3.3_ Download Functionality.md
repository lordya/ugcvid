Story 3.3: Download Functionality

Status: Draft

Story

As a User

I want to download the MP4 file

so that I can upload it to TikTok or Reels

Acceptance Criteria (ACs)

"Download" button available in the Player Modal.

Clicking triggers a direct browser download.

Filename is formatted as afp-ugc-{id}.mp4.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Download Logic

[ ] Implement handleDownload function.

[ ] If URL is direct, use a.download.

[ ] If CORS issues arise, create a proxy route api/download/[id].

Dev Technical Guidance

Proxy: Start with direct download. Only build the proxy if cross-origin headers block the download attribute.