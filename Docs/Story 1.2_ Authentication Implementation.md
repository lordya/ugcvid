# **Story 1.2: Authentication Implementation**

## **Status: Draft**

## **Story**

* As a User  
* I want to sign up and log in using Email or Google  
* so that I can access the platform securely

## **Acceptance Criteria (ACs)**

1. Sign Up / Log In page created using Supabase Auth UI or custom forms.  
2. Google OAuth provider configured.  
3. Protected Routes middleware implemented (redirect unauth users to login).  
4. User session persists across page reloads.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Auth Pages  
  * \[ \] Create route app/(auth)/login/page.tsx and signup/page.tsx.  
  * \[ \] Implement Auth form using Supabase Auth Helpers or Shadcn forms.  
  * \[ \] Add "Sign in with Google" button.  
* \[ \] Task 2 (AC: 3\) Middleware Protection  
  * \[ \] Create middleware.ts in root.  
  * \[ \] Configure logic: If user accessing /dashboard or /library has no session, redirect to /login.  
  * \[ \] Configure logic: If user accessing /login HAS session, redirect to /dashboard.  
* \[ \] Task 3 (AC: 4\) Session Management  
  * \[ \] Verify supabase-ssr cookie handling works (sessions persist).  
  * \[ \] Add a simple "Sign Out" button in a temporary layout to test flow.

## **Dev Technical Guidance**

* **Supabase Auth:** Use the @supabase/ssr package for Next.js App Router compatibility.  
* **Google OAuth:** Requires enabling the provider in the Supabase Dashboard (Developer will need to set this up or ask Admin).  
* **Routes:** (auth) group should use a centered layout. (dashboard) group should be protected by the middleware.