# **Story 4.3: E2E Testing & Launch Polish**

## **Status: Draft**

## **Story**

* As a Product Owner  
* I want the critical paths tested automatically  
* so that we don't break core features during updates

## **Acceptance Criteria (ACs)**

1. Playwright E2E test written for the full "Happy Path" (Login \-\> Buy Credit \-\> Wizard \-\> Video Success).  
2. UI polish pass (consistent spacing, loading states, error toasts) according to the Visual Identity System.  
3. Landing page (or redirect to Login) configured for root URL.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1\) Playwright Setup  
  * \[ \] Install Playwright (npm init playwright@latest).  
  * \[ \] Configure playwright.config.ts for local and CI execution.  
  * \[ \] Set up global auth setup script to reuse login state in tests.  
* \[ \] Task 2 (AC: 1\) Happy Path Test  
  * \[ \] Write tests/happy-path.spec.ts.  
  * \[ \] Step 1: Login mock user.  
  * \[ \] Step 2: Navigate to /billing, click "Buy Credits" (Mock Stripe success redirect).  
  * \[ \] Step 3: Navigate to /wizard, complete Input and Review steps.  
  * \[ \] Step 4: Click "Generate", wait for "Video Ready" status (Mock API response).  
  * \[ \] Step 5: Verify Video Card appears in Library.  
* \[ \] Task 3 (AC: 2\) UI Polish  
  * \[ \] Verify dark mode palette consistency (bg-layer-1, primary colors).  
  * \[ \] Ensure all buttons have hover/active states.  
  * \[ \] Add toast notifications for key actions (Purchase success, Generation started).  
* \[ \] Task 4 (AC: 3\) Root Route  
  * \[ \] Update app/page.tsx to redirect to /library (or render a simple Hero landing page).

## **Dev Technical Guidance**

* **Mocks:** Use Playwright's page.route() capability to mock network requests to /api/generate/video and /api/stripe/checkout. Do NOT hit real APIs in E2E tests.  
* **Selectors:** Add data-testid attributes to critical UI elements (e.g., data-testid="generate-btn") to make tests resilient to styling changes.