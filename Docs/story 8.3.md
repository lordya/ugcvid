Story 8.3: Visual Cue & Script Editor Integration

Status: Draft

Story

As a User

I want to see the visual cues for my script, whether it's a short 10s hook or a longer 30s ad

so that I can understand the video flow before generating

Acceptance Criteria (ACs)

Adaptive UI: The Script Editor renders the JSON output correctly. 10s scripts will have fewer "Scenes" than 30s scripts.

Visual Cues: Display visual_cues as read-only "Director Notes" above or beside the editable voiceover text.

Text Overlays: specific to the prompt format (e.g., "STOP SCROLLING" for 10s PAS) are displayed clearly.

Kie.ai Context: The backend passes the combined context (Visual + Audio) to Kie.ai to ensure the video generation matches the specific duration's pacing.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Script Block UI

[ ] Update wizard/script/page.tsx.

[ ] Render a list of Scene Blocks.

[ ] Each Block displays: [Time Range], [Visual Description (Gray)], [Voiceover Input].

[ ] Task 2 (AC: 3) Text Overlay Display

[ ] Add a "Text Overlays" section card showing the generated overlay text suggestions (e.g., "Link in Bio").

[ ] Task 3 (AC: 4) Backend Payload

[ ] In api/generate/video, concatenate the visual_cues and voiceover when constructing the prompt for Kie.ai.

[ ] Example: Scene 1 (0-3s): [Visual] - Audio: [VO].

Dev Technical Guidance

10s vs 30s: The UI doesn't need explicit logic for duration here, as it simply renders the array returned by the AI. However, 10s scripts might have voiceover as a single line or empty (for ASMR), so handle empty strings gracefully.