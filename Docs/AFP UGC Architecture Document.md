# **AFP UGC Architecture Document**

## **Introduction / Preamble**

This document outlines the overall project architecture for the **AFP UGC** platform, a SaaS tool for generating AI-driven UGC videos from product URLs. It details the backend systems, data models, API interactions, and infrastructure required to support the functional requirements defined in the PRD and the user experience outlined in the UI/UX Specification.  
Relationship to Frontend Architecture:  
A separate Frontend Architecture Document (docs/front-end-architecture.md) will detail the specific implementation of the UI/UX, including component hierarchy, state management slices, and frontend-specific routing. This document focuses on the server-side logic, database schema, third-party integrations, and overall system design. The core technology stack choices documented herein are definitive for the entire project.

## **Table of Contents**

* [Technical Summary](https://www.google.com/search?q=%23technical-summary)  
* [High-Level Overview](https://www.google.com/search?q=%23high-level-overview)  
* [Architectural / Design Patterns Adopted](https://www.google.com/search?q=%23architectural--design-patterns-adopted)  
* [Component View](https://www.google.com/search?q=%23component-view)  
* [Project Structure](https://www.google.com/search?q=%23project-structure)  
* [API Reference](https://www.google.com/search?q=%23api-reference)  
* [Data Models](https://www.google.com/search?q=%23data-models)  
* [Core Workflow / Sequence Diagrams](https://www.google.com/search?q=%23core-workflow--sequence-diagrams)  
* [Definitive Tech Stack Selections](https://www.google.com/search?q=%23definitive-tech-stack-selections)  
* [Infrastructure and Deployment Overview](https://www.google.com/search?q=%23infrastructure-and-deployment-overview)  
* [Error Handling Strategy](https://www.google.com/search?q=%23error-handling-strategy)  
* [Coding Standards](https://www.google.com/search?q=%23coding-standards)  
* [Overall Testing Strategy](https://www.google.com/search?q=%23overall-testing-strategy)  
* [Security Best Practices](https://www.google.com/search?q=%23security-best-practices)

## **Technical Summary**

AFP UGC is a serverless, event-driven SaaS platform built on **Next.js** (App Router) and deployed on **Vercel**. It utilizes **Supabase** for PostgreSQL database, authentication, and object storage. The core value proposition—AI video generation—is orchestrated via a "Human-in-the-Loop" workflow: scraping product data from Amazon using **ScraperAPI**, generating scripts with **OpenAI**, allowing user review, and generating videos via **Kie.ai**. The system is architected to handle asynchronous long-running video generation tasks through a polling mechanism suitable for Vercel's serverless environment, ensuring a responsive user experience ("Optimistic UI") and robust credit management.

## **High-Level Overview**

* **Architectural Style:** Serverless / Backend-as-a-Service (BaaS) hybrid.  
* **Repository Structure:** Monorepo (Next.js handling both Frontend and API Routes).  
* **Primary Data Flow:**  
  1. **Input:** User provides Amazon URL or manual data.  
  2. **Processing (Sync):** Backend fetches metadata and uses OpenAI to generate a script.  
  3. **Review (Human-in-the-Loop):** User edits script and selects images.  
  4. **Generation (Async):** Backend triggers Kie.ai job.  
  5. **Polling:** Client polls for status; Backend updates DB on completion.  
  6. **Delivery:** Video URL stored in Supabase; User downloads MP4.

C4Context  
    title System Context Diagram \- AFP UGC

    Person(user, "Content Creator", "Dropshipper or Brand Owner looking to create video ads.")  
    Person(admin, "Platform Admin", "Manages users, credits, and moderation.")

    System\_Boundary(afp\_ugc, "AFP UGC Platform") {  
        System(nextjs, "Next.js App", "Frontend UI \+ API Routes (Vercel)")  
        SystemDb(supabase, "Supabase", "Auth, Database, Storage")  
    }

    System\_Ext(openai, "OpenAI API", "Generates video scripts from product data.")  
    System\_Ext(kieai, "Kie.ai API", "Generates video from script and images.")  
    System\_Ext(stripe, "Stripe", "Handles credit purchases and billing.")  
    System\_Ext(amazon, "Amazon (Target)", "Source of product data (via scraping logic).")

    Rel(user, nextjs, "Uses", "HTTPS")  
    Rel(admin, nextjs, "Administers", "HTTPS")  
    Rel(nextjs, supabase, "Reads/Writes Data", "PostgREST / Supabase Client")  
    Rel(nextjs, openai, "Generates Script", "HTTPS")  
    Rel(nextjs, kieai, "Triggers Video Job / Checks Status", "HTTPS")  
    Rel(nextjs, stripe, "Creates Checkout Session", "HTTPS")  
    Rel(stripe, nextjs, "Sends Webhook Events", "HTTPS")  
    Rel(nextjs, amazon, "Scrapes Public Data", "HTTPS")

## **Architectural / Design Patterns Adopted**

* **Serverless API Routes:** All backend logic resides in Next.js API routes (app/api/...), leveraging Vercel's serverless functions.  
* **Backend-for-Frontend (BFF):** API routes are tightly coupled to the UI needs, aggregating data from Supabase and external APIs (OpenAI/Kie.ai) to serve the frontend efficiently.  
* **Asynchronous Command / Polling:** Due to Vercel's execution timeout limits (typically 10-60s), long-running video generation is handled by triggering a job on Kie.ai and having the client poll for status updates, rather than keeping a connection open.  
* **Optimistic UI Updates:** The frontend will reflect state changes (e.g., deducting a credit) immediately upon user action, reverting only if the server request fails, to ensure a snappy "pro tool" feel.  
* **Repository Pattern (Lightweight):** Database interaction logic will be encapsulated in "Service" functions (e.g., services/db/users.ts) rather than scattered raw SQL/Supabase calls in API routes, promoting testability and reuse.

## **Component View**

* **Authentication Module:** Wraps Supabase Auth. Handles sign-up, login, session management, and route protection (Middleware).  
* **Credit Manager:** Logic for calculating balances, deducting credits safely (using DB transactions or atomic updates), and handling Stripe webhook events to top up balances.  
* **Scraper Engine:** Service to extract Title, Description, and Images from a given Amazon URL. (Initially implemented as a lightweight fetcher or using a scraping API if needed).  
* **Script Generator:** Facade for OpenAI API. Constructs the prompt based on product data and handles the LLM response parsing.  
* **Video Orchestrator:** Facade for Kie.ai API. Handles job submission, status checking, and result normalization.  
* **Admin Module:** Specialized API routes and UI components for user management, credit adjustments, and content moderation.

## **Project Structure**

This project follows a standard Next.js App Router monorepo structure.  
afp-ugc/  
├── .github/                    \# CI/CD workflows  
├── docs/                       \# Architecture & PRD  
├── src/  
│   ├── app/                    \# Next.js App Router (Pages & API)  
│   │   ├── (auth)/             \# Auth-related pages (login, signup)  
│   │   ├── (dashboard)/        \# Protected app pages (layout with sidebar)  
│   │   │   ├── library/        \# "My Videos"  
│   │   │   ├── wizard/         \# Generation flow  
│   │   │   ├── billing/        \# Credit purchase  
│   │   │   └── admin/          \# Admin views  
│   │   ├── api/                \# Backend API Routes  
│   │   │   ├── auth/           \# Supabase Auth callback  
│   │   │   ├── webhooks/       \# Stripe webhooks  
│   │   │   ├── generate/       \# Script/Video generation endpoints  
│   │   │   └── admin/          \# Admin-specific endpoints  
│   │   └── globals.css         \# Tailwind base styles  
│   ├── components/             \# React components  
│   │   ├── ui/                 \# Reusable UI (Button, Card, Input) \- Shadcn/UI compatible  
│   │   ├── feature/            \# Feature-specific components (Wizard, VideoPlayer)  
│   │   └── layout/             \# Sidebar, Header  
│   ├── lib/                    \# Shared utilities  
│   │   ├── supabase/           \# Supabase client setup (server/client)  
│   │   ├── stripe/             \# Stripe client setup  
│   │   ├── openai.ts           \# OpenAI client wrapper  
│   │   ├── kie.ts              \# Kie.ai client wrapper  
│   │   └── utils.ts            \# Helper functions  
│   ├── services/               \# Business logic / DB interaction layer  
│   │   ├── user-service.ts     \# User & Credit logic  
│   │   └── video-service.ts    \# Video state & history logic  
│   ├── types/                  \# TypeScript definitions (DB schema, API responses)  
│   └── middleware.ts           \# Route protection middleware  
├── supabase/                   \# Supabase local config / migrations  
├── public/                     \# Static assets  
├── .env.local                  \# Local environment variables  
├── next.config.js              \# Next.js config  
├── tailwind.config.ts          \# Tailwind config  
└── package.json                \# Dependencies

## **API Reference**

### **Internal API Routes (BFF)**

#### **POST /api/generate/scrape**

* **Purpose:** Fetches product metadata from an Amazon URL using ScraperAPI.  
* **Body:** { url: string }  
* **Response:** { title: string, description: string, images: string\[\] }
* **External Service:** ScraperAPI (with autoparse enabled)

#### **POST /api/generate/script**

* **Purpose:** Generates a video script using OpenAI.  
* **Body:** { productTitle: string, productDescription: string }  
* **Response:** { script: string }

#### **POST /api/generate/video**

* **Purpose:** Triggers video generation on Kie.ai and deducts credit.  
* **Body:** { script: string, imageUrls: string\[\], aspectRatio: "9:16" }  
* **Response:** { videoId: string, status: "PROCESSING", task\_id: string }

#### **GET /api/videos/\[id\]/status**

* **Purpose:** Checks status of a specific video job.  
* **Response:** { status: "PROCESSING" | "COMPLETED" | "FAILED", videoUrl?: string }

#### **POST /api/webhooks/stripe**

* **Purpose:** Handles Stripe events (checkout.session.completed) to add credits.  
* **Security:** Verifies Stripe signature.

## **Data Models**

### **Database Schema (Supabase/PostgreSQL)**

#### **users**

| Column | Type | Description |
| :---- | :---- | :---- |
| id | uuid | PK, References auth.users.id |
| email | text | User email |
| credits\_balance | int | Current available credits (Default: 0\) |
| role | text | 'user' or 'admin' (Default: 'user') |
| created\_at | timestamptz | Account creation time |

#### **videos**

| Column | Type | Description |
| :---- | :---- | :---- |
| id | uuid | PK, Default gen\_random\_uuid() |
| user\_id | uuid | FK \-\> users.id |
| status | enum | 'DRAFT', 'SCRIPT\_GENERATED', 'PROCESSING', 'COMPLETED', 'FAILED' |
| input\_metadata | jsonb | Stores Title, Description, and source Images |
| final\_script | text | The user-edited script used for generation |
| kie\_task\_id | text | External Job ID from Kie.ai |
| video\_url | text | Final URL (Supabase Storage or S3) |
| error\_reason | text | Detailed error message if FAILED |
| created\_at | timestamptz |  |

#### **transactions**

| Column | Type | Description |
| :---- | :---- | :---- |
| id | uuid | PK, Default gen\_random\_uuid() |
| user\_id | uuid | FK \-\> users.id |
| amount | int | Positive for purchase/refund, Negative for spend |
| type | enum | 'PURCHASE', 'GENERATION', 'REFUND', 'BONUS' |
| stripe\_payment\_id | text | Reference to Stripe Charge ID (optional) |
| created\_at | timestamptz |  |

## **Core Workflow / Sequence Diagrams**

### **Video Generation Flow (The "Wizard")**

sequenceDiagram  
    actor User  
    participant UI as Frontend (Wizard)  
    participant API as Next.js API  
    participant DB as Supabase DB  
    participant AI as OpenAI/Kie.ai

    User-\>\>UI: Input URL & Click "Next"  
    UI-\>\>API: POST /scrape  
    API--\>\>UI: { title, desc, images }  
      
    User-\>\>UI: Review Data & Click "Generate Script"  
    UI-\>\>API: POST /script  
    API-\>\>AI: OpenAI Completion  
    AI--\>\>API: Generated Script  
    API--\>\>UI: { script }  
      
    User-\>\>UI: Edit Script & Select Images \-\> "Generate Video"  
    UI-\>\>API: POST /video  
    API-\>\>DB: Check Balance & Deduct Credit  
    API-\>\>AI: Kie.ai Create Task  
    AI--\>\>API: { task\_id }  
    API-\>\>DB: Create Video Record (PROCESSING)  
    API--\>\>UI: { videoId, status: PROCESSING }  
      
    loop Every 5s  
        UI-\>\>API: GET /videos/\[id\]/status  
        API-\>\>AI: Kie.ai Check Status  
        AI--\>\>API: { status: COMPLETED, url }  
        API-\>\>DB: Update Video Record  
        API--\>\>UI: { status: COMPLETED, url }  
    end  
      
    UI-\>\>User: Show "Video Ready" Notification

## **Definitive Tech Stack Selections**

| Category | Technology | Details | Rationale |
| :---- | :---- | :---- | :---- |
| **Framework** | **Next.js** | App Router | Best-in-class for React SaaS, easy Vercel deploy. |
| **Language** | **TypeScript** | Strict Mode | Type safety is non-negotiable for financial/credit logic. |
| **Auth & DB** | **Supabase** | PostgreSQL | Robust Auth, RLS security, scalable DB, and Storage in one. |
| **Deployment** | **Vercel** | Serverless | Zero-config deployment for Next.js. |
| **Styling** | **Tailwind CSS** | v3.x | Rapid UI development, matches "Pro Tool" aesthetic. |
| **UI Library** | **Shadcn/UI** | Radix Primitives | Accessible, customizable components that you own. |
| **Payments** | **Stripe** | Checkout | Industry standard for SaaS billing. |
| **Scraping** | **ScraperAPI** | API | Amazon product data extraction with autoparse. |
| **AI (Script)** | **OpenAI** | GPT-4o / 3.5 | Reliable, high-quality text generation. |
| **AI (Video)** | **Kie.ai** | API | Aggregator offering cost-effective video generation (\~$0.40/video). |
| **Testing** | **Playwright** | E2E | Reliable end-to-end testing for critical user flows. |

## **Infrastructure and Deployment Overview**

* **Host:** Vercel (Production & Preview environments).  
* **Database:** Supabase (Managed PostgreSQL).  
* **Environment Vars:** Managed in Vercel Project Settings (synced to local .env.local via Vercel CLI).  
* **CI/CD:** GitHub Actions (or Vercel internal CI) triggers on push to main.  
* **Storage:** Supabase Storage (S3 compatible) for storing user-uploaded images and finalized video assets (if Kie.ai URLs are temporary, we must upload to our own bucket).

## **Error Handling Strategy**

* **API Errors:** All API routes must wrap logic in try/catch blocks. Errors are logged to the console (Vercel Logs).  
* **Client Feedback:** API routes return standard HTTP codes (400, 401, 402 for Payment Required, 500). The frontend apiClient intercepts these and displays Toast notifications (e.g., "Insufficient Credits").  
* **Kie.ai Failures:** If polling detects a FAILED status from Kie.ai, the backend **MUST** trigger a REFUND transaction to return the credit to the user automatically.

## **Coding Standards**

* **Linter:** ESLint \+ Prettier (Standard Next.js config).  
* **Type Safety:** No any. All API responses and DB rows must have defined interfaces in src/types.  
* **Naming:** camelCase for functions/vars, PascalCase for Components, kebab-case for filenames.  
* **Component Design:** Use Shadcn/UI components for primitives. Build complex features (like the Wizard) as compositions of these primitives.

## **Overall Testing Strategy**

* **E2E (Critical):** A Playwright test suite will cover the "Happy Path": Login \-\> Buy Credit (Test Mode) \-\> Run Wizard \-\> Verify Video Record created. This runs on deployment.  
* **Unit/Integration:** Jest/Vitest for the CreditManager service logic to ensure math is correct (1 credit \= 1 video, no negative balances).

## **Security Best Practices**

* **Row Level Security (RLS):** Supabase RLS policies MUST be enabled. Users can SELECT and INSERT only rows where user\_id \== auth.uid().  
* **API Keys:** OpenAI, Kie.ai, and Stripe Secret keys are stored ONLY in Vercel Environment Variables. They are accessed only by server-side code.  
* **Input Validation:** Use Zod schemas to validate all incoming API request bodies (e.g., validate that imageUrls are valid URLs).  
* **Credit Check:** The generate/video endpoint must perform an atomic check-and-decrement operation (or verify balance \> 0 inside a transaction) before triggering the external API.

\--- Below, Prompt for Design Architect (If Project has UI) To Produce Front End Architecture \----  
**Design Architect (Jane),** please use this technical blueprint to finalize any frontend-specific component logic or state management patterns in your front-end-architecture.md. Specifically, ensure the Polling mechanism described here is reflected in your "API Interaction Layer".