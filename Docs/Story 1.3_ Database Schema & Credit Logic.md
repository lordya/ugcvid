# **Story 1.3: Database Schema & Credit Logic**

## **Status: Draft**

## **Story**

* As a System  
* I want to track user credit balances in the database  
* so that I can authorize video generation only when funds are available

## **Acceptance Criteria (ACs)**

1. users table created with credits\_balance column.  
2. transactions table created to log all credit changes.  
3. Database Trigger or Service function created to update credits\_balance when a transaction row is added.  
4. RLS policies configured to allow users to read only their own balance.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Migration / Schema Definition  
  * \[ \] Create Supabase migration file (or SQL script).  
  * \[ \] Define public.users table (id references auth.users, email, credits\_balance default 0).  
  * \[ \] Define public.transactions table (id, user\_id, amount, type enum\['PURCHASE', 'GENERATION', 'REFUND'\], stripe\_id).  
* \[ \] Task 2 (AC: 3\) Credit Logic (Trigger)  
  * \[ \] Write PL/pgSQL function update\_user\_credits that sums transactions or increments/decrements balance.  
  * \[ \] Create trigger on transactions insert to call this function (OR implement this logic in the application service layer if preferred for visibility, though triggers are safer for consistency). *Decision: Use Application Service CreditManager for MVP simplicity/debuggability, or DB Trigger for safety. Let's go with DB Trigger for robustness.*  
* \[ \] Task 3 (AC: 4\) RLS Policies  
  * \[ \] Enable RLS on users and transactions.  
  * \[ \] Add policy: SELECT using auth.uid() \= user\_id.  
  * \[ \] Add policy: INSERT only by Service Role (backend) for transactions? Or allow user purchases? *Transactions usually created by system/webhook.*

## **Dev Technical Guidance**

* **Schema:** Refer to docs/architecture.md for exact column types.  
* **Triggers:** Ensure the trigger handles both positive (purchase) and negative (spend) amounts correctly.  
* **Types:** Generate TypeScript types from Supabase schema using supabase gen types and save to src/types/supabase.ts.