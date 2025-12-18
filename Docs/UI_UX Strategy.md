AFP UGC UI/UX Specification

Introduction

This document defines the user experience, information architecture, and visual design specifications for "AFP UGC". It translates the functional requirements into a concrete design guide for the frontend development team.

Link to PRD: docs/prd.md

Design Philosophy: "Professional Precision"—Figma meets Stripe. Powerful tools trusted by professionals who value clarity over decoration.

1. Strategic Foundation & UX Goals

1.1 User Psychology Profile

Primary User: The Efficiency-Driven Entrepreneur (Dropshipper).

Cognitive State: Task-focused, time-scarce, skeptical of "black box" automation.

Primary Fear: Wasting money on low-quality output that damages brand reputation.

Primary Desire: Predictable, controllable results that justify subscription cost.

Decision Framework: "Show me the value quickly, then let me verify before I commit."

Key Psychological Principles:

Loss Aversion: Users fear wasting credits more than they desire gaining videos. (Implication: Explicitly label cost before action).

Control Paradox: Users want automation but need the feeling of control to trust the system. (Implication: The Script Review step).

Peak-End Rule: The Script Review moment and final video download are critical emotional peaks.

Progress Satisfaction: Small wins (script generated, images loaded) build momentum.

1.2 Core Design Pillars

Transparency: Every action's cost and consequence is visible before commitment.

Reversibility: Users can always go back and edit before spending credits.

Feedback Density: Rich, immediate feedback (toasts, badges) for every async action.

Respectful Automation: AI does the heavy lifting, but humans make the final call.

2. Visual Identity System

2.1 Color Psychology & Palette (Dark Mode Default)

Why Dark? Reduces eye strain, signals premium/professional tool (like VS Code, Figma).

Backgrounds:

bg-layer-1: #0A0E14 (Deep charcoal - Main background)

bg-layer-2: #161B22 (Elevated surfaces - Cards, Modals, Sidebars)

bg-layer-3: #1F2937 (Interactive hover states)

Accents (Semantic):

primary: #6366F1 (Electric Indigo) - Trust + Innovation. Usage: "Generate Video" buttons, Wizard progress, Primary CTAs.

success: #10B981 (Emerald Green) - Value/Money Well Spent. Usage: "Video Ready" badges, Credit Purchase confirmation.

warning: #F59E0B (Amber) - Caution without Alarm. Usage: Low credits, validations, script length alerts.

destructive: #EF4444 (Crimson) - Critical. Usage: Failed generation, delete actions.

neutral: #64748B (Slate Gray) - Metadata, disabled states.

2.2 Typography

Primary Font: Inter. Designed for screen legibility.

H1 (Page Titles): 32px, W600. Commands attention without shouting.

Body: 16px, W400, Line-height 1.6. Optimal readability.

Captions: 14px, W500, Slate color.

Monospace Font: JetBrains Mono. Signals precision.

Usage: Credit balances, API IDs, technical data.

3. Information Architecture (IA)

3.1 Mental Model

"Studio (Create) + Library (Manage) + Control Room (Admin)"

3.2 Navigation Structure

Create: Primary CTA - always accessible.

Library: Default landing after login. Immediate value visibility.

Credits: Transparent pricing + purchase.

Account: Settings, billing history.

Admin: Conditional visibility (Admin role only).

3.3 Site Map

graph TD
    Auth[Login / Sign Up] --> Library[Library (Home)]
    Library --> Wizard[Studio Wizard]
    Wizard --> Step1[Input: Amazon/Manual]
    Step1 --> Step2[Review: Script & Images]
    Step2 --> Step3[Processing State]
    Step3 --> Library
    Library --> VideoDetail[Video Player / Download]
    Library --> Credits[Credits / Billing]
    Library --> Settings[Account Settings]
    Library --> Admin[Admin Dashboard]


4. User Flows & Interaction Design

4.1 The Wizard Flow (Core Creation)

Philosophy: Linear, step-by-step, zero distraction.

Step 1: Input (Low Friction)

Goal: Commit with minimal effort.

UI: Large, forgiving input field for Amazon URL with instant validation. Tab toggle for "Manual Input".

Interaction: Paste URL -> Auto-fetch metadata with skeleton loader -> "Continue" button enables upon success.

Step 2: Script Review (High Control - The Trust Moment)

Goal: Build trust through transparency.

Layout: Split Screen (Desktop).

Left (Reference - Locked): Product Title, Description, Image Grid (Selectable).

Right (Editor - Interactive): Editable Textarea for AI Script with live character count.

Psychology: "Locked Source" vs "Editable Output" visually reinforces control.

Primary CTA: "Generate Video • -1 Credit" (Electric Indigo, large). Explicit cost removes surprise.

Step 3: Processing (Anxiety Reduction)

Goal: Keep users engaged without making them wait.

UI: Animated progress indicator (pseudo-stages: "Analyzing script... Composing scenes... Rendering").

Psychology: Breaking the black box into stages builds patience (Zeigarnik effect).

Action: "Notify me via Email" or "Go to Library".

4.2 The Library (Default Landing)

Goal: Reinforce value immediately.

Empty State: Illustration + "Your video library is empty—let's create something" + Large Electric Indigo CTA.

Layout: 4-column grid (Desktop), Single column (Mobile).

Card States:

Processing: Blurred thumbnail + Amber pulsing dot + "Generating...".

Ready: Clear thumbnail (First Frame) + Green checkmark + "Ready". Hover shows "Play".

Failed: Grayscale + Red badge + "Failed • Credit Refunded".

4.3 Admin Console (Operations)

Design Philosophy: "Operations Console". Dense, data-rich, efficient.

User Management: Table-centric. Columns: Email, Sign-Up, Credits (Color-coded), Videos. Quick-action row for "Refund/Add Credits".

Moderation Feed: Grid of recent videos with "Ban User" destructive actions (Red).

5. Component Specifications

5.1 The Credit Balance Widget (Omnipresent Trust Anchor)

Placement: Top-right corner of header (always visible).

Visual: Pill-shaped container, JetBrains Mono font.

States:

Sufficient: Neutral color ("12 Credits").

Low (<5): Amber border glow + warning dot.

Zero: Amber background + "Add Credits" CTA.

Hover: Expands to show "Purchase More" link.

5.2 The Script Editor

Right Column Workspace: Large textarea (min 8 lines).

Live Counters: Character count (turns Amber if <50 or >500).

Toolbar: "Regenerate Script" (Secondary - allows retry without losing progress), "Select Images".

5.3 Image Selection Interface

Display: Thumbnail grid (4 cols desktop, 2 mobile).

Selection: Click to toggle. Selected images get Electric Indigo border glow.

Constraints: Max 5 images. Feedback: "Select at least 1 image to continue" (Amber).

5.4 Video Player Modal

Layout: Portrait video centered (on desktop black backdrop).

Controls: Play/Pause, Scrubber.

Sidebar/Bottom: Metadata (Script used), Primary Action "Download MP4" (Electric Indigo).

6. Conversion Optimization Patterns

6.1 "Generate Video" Button

Visual Weight: Largest button in wizard (48px height).

Label: "Generate Video" (Primary) + "-1 Credit" (Secondary line, monospace).

Loading: Button text "Preparing..." + Spinner.

6.2 Credit Purchase Flow

Layout: 3 Pricing Cards (Starter, Pro [Highlighted], Agency).

Psychology: Highlight savings %. "Most Popular" badge on middle tier.

Trust Signals: "Powered by Stripe/LemonSqueezy", "Credits never expire".

7. Responsiveness Strategy

Desktop (1280px+): Full split-screen wizard. 4-column library grid. Admin tables fully visible.

Tablet (1024px): Script Review becomes single-column (Source collapses into accordion).

Mobile (<768px):

Wizard: Stacked layout. Script editor reduces to 4 visible lines. Image grid 2-col.

Library: Single-column list view.

Philosophy: Status checking and previewing dominant.

8. Animation & Motion Principles

Allowed:

State Transitions: Fade + slight scale on card hover (120ms).

Progress: Shimmer on loading states.

Success: Checkmark bounce.

Forbidden: Auto-playing carousels, Parallax, Slow page transitions.

Processing Animation: Isometric blocks assembling. Timing: 8-15s per stage (~40s total).

9. Accessibility (AX) Requirements

Contrast: All text meets WCAG AA (4.5:1) on dark backgrounds.

Keyboard: Full wizard navigation via Tab/Enter. Focus indicators: 2px Electric Indigo.

Motion: prefers-reduced-motion disables isometric animations.

Semantics: Use semantic HTML (<nav>, <button>, <article>).

10. Brand Voice & Microcopy

Tone: Professional, Confident, Transparent. Efficient, not robotic.

Microcopy Examples:

Good: "Generate Video • 1 Credit", "Video ready! Download now.", "We couldn't fetch this URL."

Bad: "Make Magic Happen! ✨", "Woohoo! Your vid is lit! 🔥", "Oops!"

11. Success Metrics

Wizard Completion Rate: Target >65%.

Script Edit Rate: Target 70-85% (Validates "Review Step" value).

Retry After Failure: Target >60% (Trust retention).

Time-to-First-Value: <5 seconds (for returning users).