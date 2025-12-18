Story 4.3: E2E Testing & Launch Polish

Status: Draft

Story

As a Product Owner

I want the critical paths tested automatically

so that we don't break core features during updates

Acceptance Criteria (ACs)

Playwright E2E test written for the full "Happy Path" (Login -> Buy Credit -> Wizard -> Video Success).

Payment flows (Lemon Squeezy & Cryptomus) and Kie.ai API calls are fully mocked in E2E tests to prevent external dependencies.

UI Audit completed: Consistent Dark Mode (#0A0E14), Electric Indigo buttons, correct font usage (Inter/JetBrains Mono), and responsive layouts verified.

Landing page implemented at root / with a "Hero" section explaining the value prop and a "Get Started" CTA that redirects to /dashboard (or Login if unauth).

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Playwright Setup & Happy Path

[ ] Install Playwright.

[ ] Create tests/e2e/happy-path.spec.ts.

[ ] Implement page.route mocks for /api/payment/* and /api/generate/*.

[ ] Write test: User logs in (mocked auth), adds credits (mocked), runs wizard, gets video (mocked).

[ ] Task 2 (AC: 3) UI Polish Audit

[ ] Check all buttons for hover states.

[ ] Verify toast notifications appear for "Credit Added" and "Generation Started".

[ ] Ensure mobile view for Wizard stacks correctly.

[ ] Task 3 (AC: 4) Landing Page

[ ] Create app/page.tsx (Root).

[ ] Design Hero Section: Headline "Turn Amazon Products into Viral Videos", Subhead, "Start Creating" button.

[ ] If user is authenticated (check session), "Start Creating" redirects to /library.

[ ] If unauthenticated, it links to /signup.

Dev Technical Guidance

Mocking Strategy: For Payment, intercept the POST request to the checkout endpoint and manually trigger the "success" UI state or redirect to the success URL in the test. Do NOT rely on actual third-party sandboxes in CI.

Landing Page: Keep it simple. High-impact headline, one primary CTA. Use the "Electric Indigo" gradient for visual flair on the dark background.