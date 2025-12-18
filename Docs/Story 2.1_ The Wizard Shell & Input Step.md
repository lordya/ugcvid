Story 2.1: The Wizard Shell & Input Step

Status: Draft

Story

As a User

I want to enter an Amazon URL or manual product details via a sleek, professional wizard

so that I can start the video creation process without friction

Acceptance Criteria (ACs)

Wizard Layout: Multi-step shell created with a progress stepper (Input -> Review -> Processing).

Professional UI: Background #0A0E14, Cards #161B22, Primary Actions #6366F1.

Input Options: Tabbed interface for "Amazon URL" (default) and "Manual Input".

Validation: Amazon URL input validates format; Manual input requires Title/Description.

State Persistence: Wizard data (URL, fetched metadata, images) persists across steps using a global store (Zustand).

Scraper Stub: Backend route api/generate/scrape returns mock data for now to unblock UI dev.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Wizard Shell

[ ] Create app/(dashboard)/wizard/layout.tsx.

[ ] Implement WizardStepper component (Active step: Electric Indigo).

[ ] Initialize useWizardStore (Zustand) with fields: step, url, metadata, script, images.

[ ] Task 2 (AC: 3, 4) Input Step UI

[ ] Create app/(dashboard)/wizard/page.tsx (Step 1).

[ ] Implement Tabs (Shadcn/UI) for "Amazon" vs "Manual".

[ ] Amazon Tab: Large, centered Input + "Fetch" button.

[ ] Manual Tab: Inputs for Title, Desc, and File Upload (React Dropzone).

[ ] Task 3 (AC: 6) Scraper API Stub

[ ] Create api/generate/scrape.

[ ] Mock response: { title: "Mock Product", description: "...", images: ["url1", "url2"] }.

[ ] Connect "Fetch" button to this API. On success, update Store and push to Step 2.

Dev Technical Guidance

Styling: Use bg-layer-2 for the main form container to make it pop against the deep charcoal background.

UX: Focus on the "Low Friction" goal. The input should be the most prominent element.