# **Story 13.1: Script Database Schema & Seeding**

## **Status: Completed** ✅

## **Story**

* As a Developer
* I want to implement the database tables for storing `Script Angles` and `Generated Scripts`,
* So that the system can dynamically load marketing strategies and persist the user's generated options.

## **Acceptance Criteria (ACs)**

1. **Table `script_angles` created:**
   * `id` (text, primary key, slug-like e.g., 'cost_saver')
   * `label` (text, e.g., 'Cost Comparison')
   * `description` (text, internal description)
   * `keywords` (text array, mandatory words like 'literally shook')
   * `prompt_template` (text, specific instructions for this angle)
   * `is_active` (boolean, default true)

2. **Table `video_scripts` created:**
   * `id` (uuid)
   * `video_id` (uuid, foreign key to videos)
   * `angle_id` (text, foreign key to script_angles)
   * `content` (text, the raw generated script)
   * `is_selected` (boolean)
   * `created_at` (timestamp)

3. **Seed Data:**
   * A migration file must insert the 8 proven angles (Cost Comparison, Hidden Feature, Product Test, Effortless Expert, Mind Reading, Emotional Connection, Machine Comparison, Social Proof) with their specific keywords and descriptions.

## **Tasks / Subtasks**

* [x] Create migration 'add_script_engine_tables.sql'.
* [x] Define `script_angles` table RLS (Read accessible to authenticated users).
* [x] Define `video_scripts` table RLS (CRUD for owner).
* [x] Write SQL Insert statements to seed the 8 default angles.
* [x] Update `src/types/supabase.ts` via type generation.

## **Dev Technical Guidance**

* **Database:** PostgreSQL via Supabase
* **Tables:**
  * `script_angles` - Stores dynamic marketing strategy templates with customizable keywords and prompts
  * `video_scripts` - Links videos to generated script angles and stores raw content
* **Security:** Row Level Security (RLS) policies ensure proper data access control
* **Keywords:** Stored as PostgreSQL `text[]` arrays for efficient querying
* **Migration:** Applied via Supabase MCP tools and TypeScript types regenerated

## **Implementation Details**

### Database Schema

**`script_angles` table:**
```sql
CREATE TABLE public.script_angles (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  keywords text[] NOT NULL,
  prompt_template text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**`video_scripts` table:**
```sql
CREATE TABLE public.video_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  angle_id text NOT NULL REFERENCES script_angles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Seeded Script Angles

1. **Cost Comparison** (`cost_saver`) - Emphasizes money savings
2. **Hidden Feature** (`hidden_gem`) - Reveals unexpected benefits
3. **Product Test** (`product_test`) - Scientific validation
4. **Effortless Expert** (`effortless_expert`) - Insider positioning
5. **Mind Reading** (`mind_reading`) - Empathy and understanding
6. **Emotional Connection** (`emotional_connection`) - Feelings & relationships
7. **Machine Comparison** (`machine_comparison`) - Professional alternatives
8. **Social Proof** (`social_proof`) - Reviews and validation

### Row Level Security (RLS)

**`script_angles` policies:**
- Read access for authenticated users (active angles only)
- Full CRUD restricted to admin users only

**`video_scripts` policies:**
- Full CRUD for video owners only (based on `videos.user_id` relationship)

### Migration & Deployment

* **Migration File:** `supabase/migrations/20251230010216_add_script_engine_tables.sql`
* **Applied:** ✅ Successfully applied via Supabase MCP tools
* **Types Updated:** ✅ TypeScript types regenerated in `src/types/supabase.ts`

## **Testing Notes**

* Database tables created and seeded successfully
* RLS policies properly configured
* TypeScript types compile without errors
* Foreign key constraints properly established
* Migration applied without conflicts

## **Future Considerations**

* `prompt_template` field allows for future admin panel customization
* Keywords array enables dynamic script generation and filtering
* `is_selected` field supports user script preference tracking
* Extensible design allows for additional script angles to be added
