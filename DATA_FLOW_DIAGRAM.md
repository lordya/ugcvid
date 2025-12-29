# **AFP UGC Platform - Data Flow Diagram**

## **High-Level System Context**

```mermaid
graph TB
    %% External Systems
    subgraph "External Systems"
        USER[👤 Content Creator/Admin]
        AMAZON[(Amazon/E-commerce Sites)]
        OPENAI[🤖 OpenAI API]
        KIEAI[🎬 Kie.ai API]
        LEMON[💳 Lemon Squeezy]
        CRYPTO[₿ Cryptomus]
        TIKTOK[📱 TikTok API]
        YOUTUBE[📺 YouTube API]
        INSTAGRAM[📸 Instagram API]
    end

    %% Core Platform
    subgraph "AFP UGC Platform (Next.js + Vercel)"
        subgraph "Frontend (React/Next.js)"
            UI[🎨 User Interface<br/>Wizard, Dashboard, Library]
            AUTH[🔐 Authentication<br/>Login/Signup]
        end

        subgraph "API Layer (Next.js Routes)"
            API_AUTH[🔐 Auth API<br/>OAuth, Sessions]
            API_GENERATE[🎬 Generate API<br/>Script/Video]
            API_BATCH[📦 Batch API<br/>Bulk Processing]
            API_SOCIAL[📱 Social API<br/>Publish/Share]
            API_PAYMENT[💰 Payment API<br/>Checkout/Webhooks]
            API_ADMIN[⚙️ Admin API<br/>Management/Monitoring]
        end

        subgraph "Business Logic"
            CREDIT_MGR[💳 Credit Manager<br/>Balance Tracking]
            SCRAPER[🕷️ Content Scraper<br/>Amazon Data]
            SCRIPT_GEN[✍️ Script Generator<br/>OpenAI Integration]
            VIDEO_ORCH[🎭 Video Orchestrator<br/>Kie.ai Integration]
            QUALITY_ANAL[🔍 Quality Analysis<br/>Risk Assessment]
            SOCIAL_INTEG[🌐 Social Integration<br/>OAuth/Posting]
        end

        subgraph "Database (Supabase)"
            DB[(📊 PostgreSQL)]
        end

        subgraph "Storage (Supabase)"
            STORAGE[(💾 File Storage<br/>Videos/Images)]
        end
    end

    %% Data Flow Connections
    USER --> UI
    UI --> AUTH
    AUTH --> DB
    UI --> API_AUTH
    API_AUTH --> DB

    UI --> API_GENERATE
    API_GENERATE --> SCRAPER
    SCRAPER --> AMAZON
    API_GENERATE --> SCRIPT_GEN
    SCRIPT_GEN --> OPENAI
    API_GENERATE --> VIDEO_ORCH
    VIDEO_ORCH --> KIEAI
    API_GENERATE --> DB
    API_GENERATE --> STORAGE

    UI --> API_BATCH
    API_BATCH --> API_GENERATE

    UI --> API_SOCIAL
    API_SOCIAL --> SOCIAL_INTEG
    SOCIAL_INTEG --> TIKTOK
    SOCIAL_INTEG --> YOUTUBE
    SOCIAL_INTEG --> INSTAGRAM
    API_SOCIAL --> DB

    UI --> API_PAYMENT
    API_PAYMENT --> LEMON
    API_PAYMENT --> CRYPTO
    API_PAYMENT --> DB

    UI --> API_ADMIN
    API_ADMIN --> DB
    API_ADMIN --> STORAGE

    CREDIT_MGR --> DB
    QUALITY_ANAL --> DB

    DB --> STORAGE
```

## **Detailed Data Flows**

### **1. User Authentication & Onboarding Flow**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthAPI
    participant SupabaseAuth
    participant Database

    User->>Frontend: Click Login/Signup
    Frontend->>AuthAPI: POST /auth/[provider]
    AuthAPI->>SupabaseAuth: Authenticate user
    SupabaseAuth->>Database: Create/update user record
    Database-->>SupabaseAuth: User profile created
    SupabaseAuth-->>AuthAPI: Auth tokens
    AuthAPI-->>Frontend: Redirect with session
    Frontend-->>User: Dashboard access
```

### **2. Video Generation Flow (Wizard)**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ScrapeAPI
    participant ScriptAPI
    participant VideoAPI
    participant Database
    participant OpenAI
    participant KieAI
    participant Storage

    User->>Frontend: Input Amazon URL
    Frontend->>ScrapeAPI: POST /generate/scrape
    ScrapeAPI->>ScrapeAPI: Fetch product data
    ScrapeAPI-->>Frontend: {title, desc, images}

    User->>Frontend: Review & edit data
    Frontend->>ScriptAPI: POST /generate/script
    ScriptAPI->>OpenAI: Generate video script
    OpenAI-->>ScriptAPI: AI-generated script
    ScriptAPI-->>Frontend: {script}

    User->>Frontend: Select images & generate
    Frontend->>VideoAPI: POST /generate/video

    VideoAPI->>Database: Check credit balance
    Database-->>VideoAPI: Balance OK

    VideoAPI->>Database: Create video record (PROCESSING)
    VideoAPI->>Database: Deduct credits (transaction)

    VideoAPI->>KieAI: Create video task
    KieAI-->>VideoAPI: {task_id}

    VideoAPI->>Database: Update video with task_id
    VideoAPI-->>Frontend: {videoId, status: PROCESSING}

    loop Polling (every 5s)
        Frontend->>VideoAPI: GET /videos/{id}/status
        VideoAPI->>KieAI: Check task status
        KieAI-->>VideoAPI: Status update
        VideoAPI->>Database: Update video status
        VideoAPI-->>Frontend: Current status
    end

    KieAI->>VideoAPI: Video completed (webhook)
    VideoAPI->>Storage: Upload final video
    VideoAPI->>Database: Update video_url
    Database-->>Frontend: Status: COMPLETED
```

### **3. Payment & Credit System Flow**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant PaymentAPI
    participant LemonSqueezy
    participant Database
    participant WebhookHandler

    User->>Frontend: Click "Buy Credits"
    Frontend->>PaymentAPI: POST /payment/lemonsqueezy/checkout
    PaymentAPI->>LemonSqueezy: Create checkout session
    LemonSqueezy-->>PaymentAPI: Checkout URL
    PaymentAPI-->>Frontend: Redirect to payment

    User->>LemonSqueezy: Complete payment
    LemonSqueezy->>WebhookHandler: POST /webhooks/lemonsqueezy
    WebhookHandler->>WebhookHandler: Verify signature
    WebhookHandler->>Database: Insert PURCHASE transaction
    Database->>Database: Auto-update user credits (trigger)
    WebhookHandler-->>LemonSqueezy: 200 OK
```

### **4. Batch Processing Flow**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BatchAPI
    participant Database
    participant VideoGenAPI

    User->>Frontend: Upload CSV with URLs
    Frontend->>BatchAPI: POST /bulk/start-batch
    BatchAPI->>BatchAPI: Validate URLs & calculate costs
    BatchAPI->>Database: Check user credits
    Database-->>BatchAPI: Sufficient credits

    BatchAPI->>Database: Create video_batch record
    BatchAPI->>Database: Create batch_video_items
    BatchAPI->>Database: Reserve credits (transaction)

    loop For each batch item
        BatchAPI->>VideoGenAPI: Trigger individual video generation
        VideoGenAPI->>Database: Create video record
        VideoGenAPI->>Database: Deduct credits
    end

    BatchAPI-->>Frontend: {batchId, status: processing}

    loop Monitor progress
        Frontend->>BatchAPI: GET /bulk/batch/{id}/status
        BatchAPI->>Database: Check batch progress
        Database-->>BatchAPI: Current status
        BatchAPI-->>Frontend: Progress update
    end
```

### **5. Social Media Integration Flow**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthAPI
    participant SocialAPI
    participant Database
    participant OAuthProvider
    participant SocialPlatform

    User->>Frontend: Click "Connect TikTok"
    Frontend->>AuthAPI: GET /auth/oauth/tiktok
    AuthAPI->>OAuthProvider: OAuth authorization
    OAuthProvider-->>AuthAPI: Authorization code
    AuthAPI->>OAuthProvider: Exchange for tokens
    OAuthProvider-->>AuthAPI: Access & refresh tokens
    AuthAPI->>Database: Store encrypted tokens (user_integrations)

    User->>Frontend: Select video & publish
    Frontend->>SocialAPI: POST /social/publish
    SocialAPI->>Database: Verify video ownership
    SocialAPI->>Database: Get user tokens
    SocialAPI->>SocialPlatform: Upload video & post
    SocialPlatform-->>SocialAPI: Post created
    SocialAPI->>Database: Store post metadata
    SocialAPI-->>Frontend: Success confirmation
```

## **Database Schema Overview**

```mermaid
erDiagram
    users {
        uuid id PK
        text email
        integer credits_balance
        text role "user|admin"
        timestamptz created_at
        timestamptz updated_at
    }

    videos {
        uuid id PK
        uuid user_id FK
        video_status status
        jsonb input_metadata
        text final_script
        text kie_task_id
        text video_url
        text error_reason
        timestamptz created_at
        timestamptz updated_at
    }

    transactions {
        uuid id PK
        uuid user_id FK
        integer amount
        transaction_type type
        payment_provider provider
        text payment_id
        timestamptz created_at
    }

    user_integrations {
        uuid id PK
        uuid user_id FK
        social_provider provider
        text access_token
        text refresh_token
        timestamptz token_expires_at
        jsonb metadata
    }

    video_batches {
        uuid id PK
        uuid user_id FK
        text status
        integer total_items
        integer processed_items
        integer total_credits_reserved
        jsonb metadata
    }

    batch_video_items {
        uuid id PK
        uuid batch_id FK
        uuid video_id FK
        integer row_index
        text url
        text status
        integer credits_used
    }

    video_posts {
        uuid id PK
        uuid user_id FK
        uuid video_id FK
        social_provider platform
        text post_id
        text post_url
        jsonb metadata
    }

    users ||--o{ videos : "creates"
    users ||--o{ transactions : "has"
    users ||--o{ user_integrations : "connects"
    users ||--o{ video_batches : "creates"
    users ||--o{ video_posts : "publishes"

    videos ||--o{ video_posts : "shared_to"

    video_batches ||--o{ batch_video_items : "contains"
    batch_video_items }o--o{ videos : "generates"
```

## **Key Data Transformation Points**

### **Credit Management**
- **Input**: Payment webhooks, video generation requests
- **Processing**: Atomic transactions with database triggers
- **Output**: Updated user balances, transaction history

### **Quality Assessment**
- **Input**: User prompts, image URLs, content metadata
- **Processing**: Risk analysis algorithms, tier-based model selection
- **Output**: Model recommendations, enhanced prompts, quality scores

### **Video Generation Pipeline**
- **Input**: Product URLs, user scripts, image selections
- **Processing**: Scraping → AI script generation → Video rendering → Storage
- **Output**: MP4 videos, metadata, performance analytics

### **Batch Processing**
- **Input**: CSV files with product URLs
- **Processing**: Parallel video generation with credit reservation
- **Output**: Multiple videos, batch statistics, failure handling

### **Social Publishing**
- **Input**: Completed videos, user captions, platform selections
- **Processing**: OAuth token management, platform-specific APIs
- **Output**: Published posts, engagement tracking

## **Data Security & Privacy**

- **Row Level Security (RLS)**: Users can only access their own data
- **Encrypted Tokens**: OAuth tokens stored encrypted in database
- **Webhook Verification**: Payment webhooks verified with HMAC signatures
- **Input Validation**: All API inputs validated with Zod schemas
- **Credit Protection**: Atomic transactions prevent overdrafts

## **Performance & Scalability Considerations**

- **Serverless Architecture**: Vercel handles scaling automatically
- **Database Indexing**: Optimized queries for common access patterns
- **Polling Optimization**: Client-side polling for async operations
- **Circuit Breakers**: API failure protection for external services
- **Storage Optimization**: Supabase Storage with CDN delivery

---

*This diagram represents the complete data architecture of the AFP UGC platform as of December 2025. The system handles complex workflows involving AI-powered video generation, multi-provider payments, social media integration, and batch processing while maintaining data integrity and user privacy.*
