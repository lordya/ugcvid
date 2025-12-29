-- Migration: Create Analytics Views for Admin Dashboard
-- Story: Admin Analytics Dashboard with Charts
-- Date: 2025-12-29

-- ============================================
-- 1. USER GROWTH ANALYTICS
-- ============================================

-- Daily user signups aggregated by date
CREATE OR REPLACE VIEW v_user_growth_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as new_admins
FROM users
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);

-- ============================================
-- 2. VIDEO GENERATION ANALYTICS
-- ============================================

-- Daily video generation counts by status
CREATE OR REPLACE VIEW v_video_generation_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_videos,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_videos,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_videos,
  SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing_videos,
  ROUND(
    (SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::decimal /
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as success_rate_percent
FROM videos
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);

-- ============================================
-- 3. CREDIT CONSUMPTION ANALYTICS
-- ============================================

-- Daily credit consumption and purchases
CREATE OR REPLACE VIEW v_credit_consumption_daily AS
SELECT
  DATE(created_at) as date,
  -- Credit consumption (GENERATION transactions - negative amounts)
  ABS(SUM(CASE WHEN type = 'GENERATION' THEN amount ELSE 0 END)) as credits_consumed,
  -- Credit purchases (PURCHASE transactions - positive amounts)
  SUM(CASE WHEN type = 'PURCHASE' THEN amount ELSE 0 END) as credits_purchased,
  -- Refunds (REFUND transactions - positive amounts)
  SUM(CASE WHEN type = 'REFUND' THEN amount ELSE 0 END) as credits_refunded,
  -- Bonuses (BONUS transactions - positive amounts)
  SUM(CASE WHEN type = 'BONUS' THEN amount ELSE 0 END) as credits_bonused
FROM transactions
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);

-- ============================================
-- 4. REVENUE ANALYTICS
-- ============================================

-- Daily revenue from transactions (PURCHASE type with USD cost)
-- Note: This requires the generation_analytics table to be populated with cost_usd
CREATE OR REPLACE VIEW v_revenue_daily AS
SELECT
  DATE(t.created_at) as date,
  SUM(ABS(t.amount)) as credits_revenue,
  COALESCE(SUM(ga.cost_usd), 0) as usd_revenue,
  COUNT(CASE WHEN t.type = 'PURCHASE' THEN 1 END) as purchase_transactions,
  AVG(CASE WHEN t.type = 'PURCHASE' THEN ABS(t.amount) END) as avg_purchase_amount
FROM transactions t
LEFT JOIN generation_analytics ga ON ga.user_id = t.user_id
  AND DATE(ga.created_at) = DATE(t.created_at)
  AND ga.status = 'COMPLETED'
WHERE t.type IN ('PURCHASE', 'GENERATION')
GROUP BY DATE(t.created_at)
ORDER BY DATE(t.created_at);

-- ============================================
-- 5. MODEL PERFORMANCE ANALYTICS
-- ============================================

-- Daily model performance metrics (success rate, avg time)
CREATE OR REPLACE VIEW v_model_performance_daily AS
SELECT
  DATE(created_at) as date,
  model,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful_attempts,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_attempts,
  ROUND(
    (SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::decimal /
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as success_rate_percent,
  ROUND(AVG(generation_time_seconds), 2) as avg_generation_time_seconds,
  ROUND(AVG(cost_credits), 2) as avg_cost_credits,
  ROUND(AVG(cost_usd), 2) as avg_cost_usd,
  ROUND(AVG(retry_count), 2) as avg_retry_count
FROM generation_analytics
GROUP BY DATE(created_at), model
ORDER BY DATE(created_at), model;

-- ============================================
-- 6. FORMAT PERFORMANCE ANALYTICS
-- ============================================

-- Daily format performance metrics
CREATE OR REPLACE VIEW v_format_performance_daily AS
SELECT
  DATE(created_at) as date,
  format,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful_attempts,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_attempts,
  ROUND(
    (SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::decimal /
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as success_rate_percent,
  ROUND(AVG(generation_time_seconds), 2) as avg_generation_time_seconds,
  ROUND(AVG(cost_credits), 2) as avg_cost_credits
FROM generation_analytics
GROUP BY DATE(created_at), format
ORDER BY DATE(created_at), format;

-- ============================================
-- 7. USER ACTIVITY ANALYTICS
-- ============================================

-- Daily active users and video generation activity
CREATE OR REPLACE VIEW v_user_activity_daily AS
SELECT
  DATE(v.created_at) as date,
  COUNT(DISTINCT v.user_id) as active_users,
  COUNT(*) as videos_created,
  SUM(CASE WHEN v.status = 'COMPLETED' THEN 1 ELSE 0 END) as videos_completed,
  ROUND(AVG(ga.generation_time_seconds), 2) as avg_generation_time_seconds,
  ROUND(AVG(ga.cost_credits), 2) as avg_cost_per_video,
  COUNT(DISTINCT CASE WHEN v.status = 'COMPLETED' THEN v.user_id END) as users_with_completed_videos
FROM videos v
LEFT JOIN generation_analytics ga ON ga.video_id = v.id
GROUP BY DATE(v.created_at)
ORDER BY DATE(v.created_at);

-- ============================================
-- 8. PERFORMANCE NOTES
-- ============================================

-- Note: Indexes cannot be created directly on views.
-- For performance optimization, consider:
-- 1. Creating materialized views instead of regular views for frequently queried data
-- 2. Adding indexes to the underlying tables (users, videos, transactions, generation_analytics)
-- 3. Using query hints or optimizing the underlying table structures

-- ============================================
-- 9. COMMENTS (Documentation)
-- ============================================

COMMENT ON VIEW v_user_growth_daily IS 'Daily user signups and admin registrations for growth analytics';
COMMENT ON VIEW v_video_generation_daily IS 'Daily video generation statistics by status and success rate';
COMMENT ON VIEW v_credit_consumption_daily IS 'Daily credit consumption, purchases, refunds, and bonuses';
COMMENT ON VIEW v_revenue_daily IS 'Daily revenue metrics including credits and USD amounts';
COMMENT ON VIEW v_model_performance_daily IS 'Daily performance metrics for each AI model (success rate, time, cost)';
COMMENT ON VIEW v_format_performance_daily IS 'Daily performance metrics for each video format';
COMMENT ON VIEW v_user_activity_daily IS 'Daily user activity including active users and video creation metrics';
