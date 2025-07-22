-- ============================================
-- Analytics Performance Optimization - Database Indexes
-- ============================================

-- This script adds optimized indexes for analytics queries
-- Run this to improve analytics dashboard response times

BEGIN;

-- Add composite indexes for analytics queries
-- These indexes significantly improve JOIN and WHERE clause performance

-- Chat analyses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_user_created_at 
ON chat_analyses (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_created_at_sentiment 
ON chat_analyses (created_at DESC, sentiment);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_mental_state_created 
ON chat_analyses (mental_state, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_session_created 
ON chat_analyses (session_id, created_at DESC);

-- Speech analyses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speech_analyses_user_created_at 
ON speech_analyses (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speech_analyses_created_mental_state 
ON speech_analyses (created_at DESC, mental_state);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speech_analyses_session_created 
ON speech_analyses (session_id, created_at DESC);

-- Video analyses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_user_created_at 
ON video_analyses (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_created_emotion 
ON video_analyses (created_at DESC, dominant_emotion);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_session_created 
ON video_analyses (session_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_confidence_created 
ON video_analyses (average_confidence DESC, created_at DESC);

-- Survey responses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_user_created_at 
ON survey_responses (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_created_burnout 
ON survey_responses (created_at DESC, burnout_score DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_risk_level 
ON survey_responses (created_at DESC, (CASE 
    WHEN burnout_score > 0.7 THEN 'high'
    WHEN burnout_score > 0.3 THEN 'medium'
    ELSE 'low'
END));

-- Users table optimization for analytics JOINs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_dept_created 
ON users (department_id, created_at DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_id 
ON users (id) WHERE is_active = true;

-- Departments table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_active 
ON departments (id) WHERE is_active = true;

-- Composite indexes for common analytics filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_dept_date 
ON chat_analyses (created_at DESC) 
INCLUDE (user_id, sentiment, mental_state, confidence_score);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speech_analyses_dept_date 
ON speech_analyses (created_at DESC) 
INCLUDE (user_id, mental_state, transcription_confidence);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_dept_date 
ON video_analyses (created_at DESC) 
INCLUDE (user_id, dominant_emotion, average_confidence, faces_detected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_dept_date 
ON survey_responses (created_at DESC) 
INCLUDE (user_id, burnout_score, prediction_confidence);

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_duration 
ON chat_analyses (analysis_duration_ms) WHERE analysis_duration_ms IS NOT NULL;

-- Partial indexes for active records only (if is_active column exists)
-- These are commented out - uncomment if your tables have is_active columns

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_analyses_active_user_date 
-- ON chat_analyses (user_id, created_at DESC) WHERE is_active = true;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speech_analyses_active_user_date 
-- ON speech_analyses (user_id, created_at DESC) WHERE is_active = true;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_analyses_active_user_date 
-- ON video_analyses (user_id, created_at DESC) WHERE is_active = true;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_active_user_date 
-- ON survey_responses (user_id, created_at DESC) WHERE is_active = true;

-- ============================================
-- Query Performance Verification
-- ============================================

-- Run these queries to verify index effectiveness
-- (These are just examples - don't run in production without EXPLAIN ANALYZE)

/*
-- Test overview aggregation query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk_sessions,
    AVG(confidence_score) as avg_confidence
FROM chat_analyses ca 
JOIN users u ON ca.user_id = u.id
WHERE ca.created_at BETWEEN NOW() - INTERVAL '30 days' AND NOW();

-- Test date range filtering performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT DATE(ca.created_at) as date, COUNT(*) as sessions
FROM chat_analyses ca 
JOIN users u ON ca.user_id = u.id
WHERE ca.created_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
GROUP BY DATE(ca.created_at)
ORDER BY date;
*/

-- ============================================
-- Maintenance Commands
-- ============================================

-- Update table statistics for better query planning
ANALYZE chat_analyses;
ANALYZE speech_analyses;
ANALYZE video_analyses;
ANALYZE survey_responses;
ANALYZE users;
ANALYZE departments;

-- Monitor index usage (run this later to verify indexes are being used)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_tup_read DESC;

COMMIT;

-- ============================================
-- Performance Tips
-- ============================================

/*
1. These indexes are created with CONCURRENTLY to avoid locking tables
2. Monitor query performance with EXPLAIN ANALYZE
3. Consider partitioning tables by date if data grows very large
4. Set up regular VACUUM and ANALYZE on analytics tables
5. Monitor index usage with pg_stat_user_indexes
6. Consider materialized views for frequently accessed aggregations

Example cron job for maintenance:
0 2 * * * psql -d your_db -c "VACUUM ANALYZE chat_analyses, speech_analyses, video_analyses, survey_responses;"
*/ 