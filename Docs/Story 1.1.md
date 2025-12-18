# **Story 1.1: Project Initialization & Repo Setup**

## **Status: Draft**

## **Story**

* As a Developer  
* I want to initialize the Next.js monorepo with Supabase and Tailwind CSS  
* so that the team has a stable foundation to build upon

## **Acceptance Criteria (ACs)**

1. Next.js 14+ (App Router) project initialized.  
2. Tailwind CSS configured with a dark mode base theme (using Shadcn/UI primitives).  
3. Supabase client configured with environment variables for local and production.  
4. Project deployed to Vercel (staging/prod environments).  
5. Basic README created with setup instructions.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Initialize Next.js Project  
  * \[ \] Run npx create-next-app@latest with TypeScript, Tailwind, ESLint.  
  * \[ \] Install shadcn-ui and initialize with the slate/zinc dark theme.  
  * \[ \] Clean up default Next.js boilerplate pages.  
* \[ \] Task 2 (AC: 3\) Configure Supabase  
  * \[ \] Install @supabase/ssr and @supabase/supabase-js.  
  * \[ \] Create lib/supabase/server.ts and lib/supabase/client.ts utilities.  
  * \[ \] Add .env.local with NEXT\_PUBLIC\_SUPABASE\_URL and NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY.  
* \[ \] Task 3 (AC: 4\) Deployment Setup  
  * \[ \] Push code to GitHub repository.  
  * \[ \] Connect repo to Vercel.  
  * \[ \] Configure Vercel Environment Variables.  
  * \[ \] Verify successful build and deploy.  
* \[ \] Task 4 (AC: 5\) Documentation  
  * \[ \] Update README.md with "Getting Started" steps (install deps, env setup).

## **Dev Technical Guidance**

* **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase.  
* **Styling:** Use Shadcn/UI for the base component library. Ensure globals.css sets the dark background color \#0A0E14 defined in the UI/UX spec.  
* **Supabase:** Use the Server/Client client pattern recommended in Next.js docs to handle cookies correctly for SSR.