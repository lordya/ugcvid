Story 2.3: The "Review Step" UI (Trust Builder)

Status: Draft

Story

As a User

I want to review/edit the script and select visual assets in a split-screen view

so that I have full control over the output before spending credits

Acceptance Criteria (ACs)

Split-Screen Layout: Left Col (Reference/Assets) vs Right Col (Script Editor). Stacks on mobile.

Asset Selection: Grid of images from the scraper/upload. User must select 1-5 images. Selected state uses Electric Indigo border.

Script Editor: Large textarea with live character count (Amber warning if <50 or >500).

Primary CTA: Large "Generate Video" button explicitly labeled with cost ("-1 Credit").

Validation: Button disabled if 0 images selected or script empty.

Tasks / Subtasks

[ ] Task 1 (AC: 1) Layout Implementation

[ ] Create app/(dashboard)/wizard/script/page.tsx (if not created in 2.2).

[ ] Use grid-cols-1 lg:grid-cols-2 for layout.

[ ] Task 2 (AC: 2) Asset Grid

[ ] Render images from store.

[ ] Implement toggle selection logic (limit max 5).

[ ] Visual feedback: Opacity for unselected, Border Ring for selected.

[ ] Task 3 (AC: 3, 4, 5) Script & Actions

[ ] Bind Textarea to useWizardStore.script.

[ ] Add "Regenerate" button (Secondary) to re-trigger Story 2.2 logic.

[ ] Add "Generate Video" button (Primary) with validation logic.

Dev Technical Guidance

Psychology: This is the "Control Paradox" step. Ensure the UI feels stable and editable. The user is the editor-in-chief here.

Images: Handle potential CORS issues with external Amazon images by using referrerPolicy="no-referrer" or a simple proxy if needed.