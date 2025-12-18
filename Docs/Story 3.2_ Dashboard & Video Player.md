Story 3.2: Dashboard & Video Player

Status: Draft

Story

As a User

I want to see my generated videos and play them

so that I can review the final output

Acceptance Criteria (ACs)

Library View: 4-column grid (Desktop) of video cards.

Card States:

Processing: Blurry thumbnail + Amber pulse.

Ready: Clear thumbnail + Green checkmark.

Failed: Red badge + "Retry" (Refunded).

Player Modal: Clicking a Ready video opens a centered modal with the portrait video player.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Library UI

[ ] Create app/(dashboard)/library/page.tsx.

[ ] Implement VideoCard component with state variants.

[ ] Task 2 (AC: 3) Player

[ ] Create VideoModal component.

[ ] Use HTML5 <video> tag or a library like vidstack.

Dev Technical Guidance

Thumbnails: If Kie.ai doesn't provide a thumb, use a generic placeholder or the first image from the input data.