Story 1.3: Database Schema & Credit Logic

Status: Draft

Story

As a System

I want to track user credit balances in the database

so that I can authorize video generation only when funds are available

Acceptance Criteria (ACs)

users table created with credits_balance column.

transactions table created to log all credit changes, supporting multiple payment providers.

Database Trigger or Service function created to update credits_balance when a transaction row is added.

RLS policies configured to allow users to read only their own balance.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Migration / Schema Definition

[ ] Create Supabase migration file.

[ ] Define public.users table (id references auth.users, email, credits_balance default 0).

[ ] Define public.transactions table:

id (uuid)

user_id (uuid)

amount (int)

type (enum: 'PURCHASE', 'GENERATION', 'REFUND', 'BONUS')

provider (text or enum: 'LEMON', 'CRYPTO', 'SYSTEM')

payment_id (text, nullable - stores external ID)

[ ] Task 2 (AC: 3) Credit Logic (Trigger)

[ ] Write PL/pgSQL function update_user_credits to increment/decrement balance based on amount.

[ ] Create trigger on transactions insert.

[ ] Task 3 (AC: 4) RLS Policies

[ ] Enable RLS on users and transactions.

[ ] Add policy: SELECT using auth.uid() = user_id.

Dev Technical Guidance

Schema: The payment_id column should store the Order ID from Lemon Squeezy or the UUID from Cryptomus to prevent duplicate webhook processing.