Story 11.3: Bulk Review Interface

Parent Epic: Epic 11 - Bulk Generation Engine (CSV Upload)

Description

As a User,
I want to see a list of generated scripts from my batch in one view,
So that I can quickly "Approve All" or edit specific ones before they go to video generation.

Acceptance Criteria

[ ] UI: New "Batch Review" page (/wizard/batch/[id]).

[ ] Layout: Grid or Accordion view of the generated items.

[ ] Status: Each item shows "Script Ready", "Failed to Scrape", etc.

[ ] Controls:

"Edit" button opens the script editor modal.

"Delete" removes the item (and refunds the credit).

"Generate Video" toggle (default: ON).

[ ] Action: "Start Processing Selected" button triggers the final Video Generation (Kie.ai) jobs for all checked items.

Technical Notes

State: This page needs to handle real-time updates (polling) as the batch progresses through the scraping/scripting phase.