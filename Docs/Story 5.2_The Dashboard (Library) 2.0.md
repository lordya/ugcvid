Story 5.2: The Dashboard (Library) 2.0

Status: Draft

Story

As a User

I want a dashboard that gives me a quick overview of my activity and tools to manage my video library

so that I can stay organized as I scale my content production

Acceptance Criteria (ACs)

Stats Header: "Recent Activity" section at the top of the Library displaying: "Credits Left", "Videos this Month", "Total Generated".

Filtering & Sorting: Toolbar to filter videos by Status (Ready, Processing, Failed) and Sort by Date (Newest/Oldest).

Bulk Selection: Ability to switch grid to "Selection Mode" (or use checkboxes) to select multiple videos.

Bulk Actions: "Delete Selected" and "Download Selected" (zips files) actions appear when items are selected.

Quick Preview: Hovering a video card (desktop) plays a low-res preview or cycles through thumbnails (if supported by Kie.ai) or just shows a larger "Play" overlay.

Tasks / Subtasks

[ ] Task 1 (AC: 1) Stats Components

[ ] Create DashboardStats component.

[ ] Fetch stats (optimally cached or from users table).

[ ] Task 2 (AC: 2) Filter Bar

[ ] Add Select inputs for Status and Sort.

[ ] Implement client-side filtering (or server-side params) for the video list.

[ ] Task 3 (AC: 3, 4) Bulk Mode

[ ] Add "Select" button to toolbar.

[ ] Add checkbox overlay to Video Cards.

[ ] Implement handleBulkDelete and handleBulkDownload.

Dev Technical Guidance

Bulk Download: Generating a ZIP file on the client (using JSZip) is better than multiple file downloads which browsers might block.

State: Local state (useState) is fine for filters/selection within the page.