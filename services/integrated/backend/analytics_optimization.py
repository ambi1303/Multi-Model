#!/usr/bin/env python3
"""
Analytics Performance Optimization Module
Implements caching, query optimization, and aggregated data fetching
"""
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from functools import wraps
import json
import hashlib
import time

logger = logging.getLogger(__name__)

class AnalyticsCache:
    """In-memory cache for analytics data with TTL support"""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self.cache = {}
        self.timestamps = {}
        self.default_ttl = default_ttl
    
    def _generate_key(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Generate cache key from endpoint and parameters"""
        params_str = json.dumps(params, sort_keys=True, default=str)
        return hashlib.md5(f"{endpoint}:{params_str}".encode()).hexdigest()
    
    def get(self, endpoint: str, params: Dict[str, Any]) -> Optional[Any]:
        """Get cached data if available and not expired"""
        key = self._generate_key(endpoint, params)
        
        if key not in self.cache:
            return None
        
        # Check TTL
        if time.time() - self.timestamps[key] > self.default_ttl:
            del self.cache[key]
            del self.timestamps[key]
            return None
        
        logger.debug(f"Cache hit for {endpoint}")
        return self.cache[key]
    
    def set(self, endpoint: str, params: Dict[str, Any], data: Any) -> None:
        """Cache data with timestamp"""
        key = self._generate_key(endpoint, params)
        self.cache[key] = data
        self.timestamps[key] = time.time()
        logger.debug(f"Cached data for {endpoint}")
    
    def clear(self) -> None:
        """Clear all cached data"""
        self.cache.clear()
        self.timestamps.clear()

# Global cache instance
analytics_cache = AnalyticsCache()

def cached_analytics(ttl: int = 300):
    """Decorator to cache analytics function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            func_name = func.__name__
            params = {
                'args': str(args[1:]),  # Skip DB session
                'kwargs': kwargs
            }
            
            # Check cache first
            cached_result = analytics_cache.get(func_name, params)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            analytics_cache.set(func_name, params, result)
            logger.info(f"Executed {func_name} in {execution_time:.3f}s")
            
            return result
        return wrapper
    return decorator

class OptimizedAnalyticsQueries:
    """Optimized database queries for analytics"""
    
    @staticmethod
    async def get_date_range_filter(date_range: Dict[str, str] = None) -> Tuple[datetime, datetime]:
        """Parse and validate date range"""
        if not date_range:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(date_range.get('start', '').replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(date_range.get('end', '').replace('Z', '+00:00'))
        
        return start_date, end_date
    
    @staticmethod
    @cached_analytics(ttl=300)
    async def get_aggregated_overview(
        db: AsyncSession, 
        start_date: datetime, 
        end_date: datetime,
        department_id: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimized single query to get overview analytics"""
        
        # Build base parameters
        params = {'start_date': start_date, 'end_date': end_date}
        
        # Build filter conditions for each table type
        additional_filters = []
        if department_id:
            additional_filters.append("u.department_id = :dept_id")
            params['dept_id'] = department_id
        
        if user_id:
            additional_filters.append("u.id = :user_id")
            params['user_id'] = user_id
        
        additional_clause = " AND " + " AND ".join(additional_filters) if additional_filters else ""
        
        # Create table-specific filter clauses
        chat_filter = f"ca.created_at BETWEEN :start_date AND :end_date{additional_clause}"
        speech_filter = f"sa.created_at BETWEEN :start_date AND :end_date{additional_clause}"
        video_filter = f"va.created_at BETWEEN :start_date AND :end_date{additional_clause}"
        survey_filter = f"sr.created_at BETWEEN :start_date AND :end_date{additional_clause}"
        
        # Single optimized query using CTEs for better performance
        query = f"""
        WITH date_series AS (
            SELECT generate_series(
                DATE(:start_date),
                DATE(:end_date),
                '1 day'::interval
            )::date as date
        ),
        
        -- Aggregated session counts per modality
        session_counts AS (
            SELECT 
                'chat' as modality,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk_sessions,
                AVG(confidence_score) as avg_confidence
            FROM chat_analyses ca 
            JOIN users u ON ca.user_id = u.id
            WHERE {chat_filter}
            
            UNION ALL
            
            SELECT 
                'speech' as modality,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk_sessions,
                AVG(transcription_confidence) as avg_confidence
            FROM speech_analyses sa 
            JOIN users u ON sa.user_id = u.id
            WHERE {speech_filter}
            
            UNION ALL
            
            SELECT 
                'video' as modality,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN dominant_emotion IN ('ANGRY', 'SAD', 'FEAR') THEN 1 END) as high_risk_sessions,
                AVG(average_confidence) as avg_confidence
            FROM video_analyses va 
            JOIN users u ON va.user_id = u.id
            WHERE {video_filter}
            
            UNION ALL
            
            SELECT 
                'survey' as modality,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk_sessions,
                AVG(prediction_confidence) as avg_confidence
            FROM survey_responses sr 
            JOIN users u ON sr.user_id = u.id
            WHERE {survey_filter}
        ),
        
        -- Daily trends
        daily_trends AS (
            SELECT 
                ds.date,
                COALESCE(chat_daily.sessions, 0) + 
                COALESCE(speech_daily.sessions, 0) + 
                COALESCE(video_daily.sessions, 0) + 
                COALESCE(survey_daily.sessions, 0) as total_sessions,
                COALESCE(chat_daily.high_risk, 0) + 
                COALESCE(speech_daily.high_risk, 0) + 
                COALESCE(video_daily.high_risk, 0) + 
                COALESCE(survey_daily.high_risk, 0) as high_risk_sessions
            FROM date_series ds
            LEFT JOIN (
                SELECT DATE(ca.created_at) as date, COUNT(*) as sessions,
                       COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk
                FROM chat_analyses ca JOIN users u ON ca.user_id = u.id
                WHERE {chat_filter}
                GROUP BY DATE(ca.created_at)
            ) chat_daily ON ds.date = chat_daily.date
            LEFT JOIN (
                SELECT DATE(sa.created_at) as date, COUNT(*) as sessions,
                       COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk
                FROM speech_analyses sa JOIN users u ON sa.user_id = u.id
                WHERE {speech_filter}
                GROUP BY DATE(sa.created_at)
            ) speech_daily ON ds.date = speech_daily.date
            LEFT JOIN (
                SELECT DATE(va.created_at) as date, COUNT(*) as sessions,
                       COUNT(CASE WHEN dominant_emotion IN ('ANGRY', 'SAD', 'FEAR') THEN 1 END) as high_risk
                FROM video_analyses va JOIN users u ON va.user_id = u.id
                WHERE {video_filter}
                GROUP BY DATE(va.created_at)
            ) video_daily ON ds.date = video_daily.date
            LEFT JOIN (
                SELECT DATE(sr.created_at) as date, COUNT(*) as sessions,
                       COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk
                FROM survey_responses sr JOIN users u ON sr.user_id = u.id
                WHERE {survey_filter}
                GROUP BY DATE(sr.created_at)
            ) survey_daily ON ds.date = survey_daily.date
            ORDER BY ds.date
        )
        
        SELECT 
            -- Summary statistics
            (SELECT SUM(total_sessions) FROM session_counts) as total_sessions,
            (SELECT SUM(high_risk_sessions) FROM session_counts) as high_risk_sessions,
            (SELECT 
                SUM(total_sessions * avg_confidence) / NULLIF(SUM(total_sessions), 0) 
                FROM session_counts
            ) as average_confidence,
            
            -- Modality performance as JSON
            (SELECT json_agg(
                json_build_object(
                    'modality', modality,
                    'usage', total_sessions,
                    'avgConfidence', COALESCE(avg_confidence, 0)
                )
            ) FROM session_counts WHERE total_sessions > 0) as modality_performance,
            
            -- Session trends as JSON
            (SELECT json_agg(
                json_build_object(
                    'date', date,
                    'sessions', total_sessions,
                    'highRisk', high_risk_sessions
                )
                ORDER BY date
            ) FROM daily_trends) as session_trends
        """
        
        start_time = time.time()
        result = await db.execute(text(query), params)
        row = result.first()
        execution_time = time.time() - start_time
        
        logger.info(f"Aggregated overview query executed in {execution_time:.3f}s")
        
        if not row:
            return {
                "total_sessions": 0,
                "high_risk_sessions": 0,
                "average_confidence": 0.0,
                "modality_performance": [],
                "session_trends": []
            }
        
        return {
            "total_sessions": row.total_sessions or 0,
            "high_risk_sessions": row.high_risk_sessions or 0,
            "average_confidence": float(row.average_confidence or 0),
            "modality_performance": row.modality_performance or [],
            "session_trends": row.session_trends or []
        }
    
    @staticmethod
    @cached_analytics(ttl=600)  # Cache for 10 minutes - changes less frequently
    async def get_comprehensive_analytics(
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime,
        department_id: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all analytics data in a single optimized query set"""
        
        # Get overview data
        overview_data = await OptimizedAnalyticsQueries.get_aggregated_overview(
            db, start_date, end_date, department_id, user_id
        )
        
        # Execute remaining queries in parallel
        tasks = [
            OptimizedAnalyticsQueries._get_video_summary(db, start_date, end_date, department_id, user_id),
            OptimizedAnalyticsQueries._get_speech_summary(db, start_date, end_date, department_id, user_id),
            OptimizedAnalyticsQueries._get_chat_summary(db, start_date, end_date, department_id, user_id),
            OptimizedAnalyticsQueries._get_survey_summary(db, start_date, end_date, department_id, user_id)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        video_data, speech_data, chat_data, survey_data = results
        
        # Handle any exceptions
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error in analytics task {i}: {result}")
                results[i] = {}
        
        return {
            "overview": overview_data,
            "video": video_data if not isinstance(video_data, Exception) else {},
            "speech": speech_data if not isinstance(speech_data, Exception) else {},
            "chat": chat_data if not isinstance(chat_data, Exception) else {},
            "survey": survey_data if not isinstance(survey_data, Exception) else {}
        }
    
    @staticmethod
    async def _get_video_summary(
        db: AsyncSession, start_date: datetime, end_date: datetime,
        department_id: Optional[int] = None, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimized video analytics summary"""
        filters = ["va.created_at BETWEEN :start_date AND :end_date"]
        params = {'start_date': start_date, 'end_date': end_date}
        
        if department_id:
            filters.append("u.department_id = :dept_id")
            params['dept_id'] = department_id
        
        if user_id:
            filters.append("va.user_id = :user_id")
            params['user_id'] = user_id
        
        filter_clause = " AND ".join(filters)
        
        query = f"""
        SELECT 
            COUNT(*) as total_analyses,
            AVG(average_confidence) as avg_confidence,
            SUM(faces_detected) as total_faces,
            -- Emotion distribution as JSON
            json_agg(
                json_build_object(
                    'emotion', dominant_emotion,
                    'count', emotion_count
                )
            ) FILTER (WHERE dominant_emotion IS NOT NULL) as emotion_distribution
        FROM (
            SELECT 
                va.average_confidence,
                va.faces_detected,
                va.dominant_emotion,
                COUNT(*) OVER (PARTITION BY va.dominant_emotion) as emotion_count
            FROM video_analyses va
            JOIN users u ON va.user_id = u.id
            WHERE {filter_clause}
        ) va_summary
        """
        
        result = await db.execute(text(query), params)
        row = result.first()
        
        if not row or row.total_analyses == 0:
            return {
                "total_analyses": 0,
                "avg_confidence": 0.0,
                "faces_detected": 0,
                "emotion_distribution": []
            }
        
        return {
            "total_analyses": row.total_analyses,
            "avg_confidence": float(row.avg_confidence or 0),
            "faces_detected": row.total_faces or 0,
            "emotion_distribution": row.emotion_distribution or []
        }
    
    @staticmethod
    async def _get_speech_summary(
        db: AsyncSession, start_date: datetime, end_date: datetime,
        department_id: Optional[int] = None, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimized speech analytics summary"""
        filters = ["sa.created_at BETWEEN :start_date AND :end_date"]
        params = {'start_date': start_date, 'end_date': end_date}
        
        if department_id:
            filters.append("u.department_id = :dept_id")
            params['dept_id'] = department_id
        
        if user_id:
            filters.append("sa.user_id = :user_id")
            params['user_id'] = user_id
        
        filter_clause = " AND ".join(filters)
        
        query = f"""
        SELECT 
            COUNT(*) as total_analyses,
            AVG(audio_duration_seconds) as avg_duration,
            AVG(transcription_confidence) as avg_confidence,
            AVG(speaking_rate) as avg_speaking_rate
        FROM speech_analyses sa
        JOIN users u ON sa.user_id = u.id
        WHERE {filter_clause}
        """
        
        result = await db.execute(text(query), params)
        row = result.first()
        
        if not row or row.total_analyses == 0:
            return {
                "total_analyses": 0,
                "avg_duration": 0.0,
                "avg_confidence": 0.0,
                "avg_speaking_rate": 0.0
            }
        
        return {
            "total_analyses": row.total_analyses,
            "avg_duration": float(row.avg_duration or 0),
            "avg_confidence": float(row.avg_confidence or 0),
            "avg_speaking_rate": float(row.avg_speaking_rate or 0)
        }
    
    @staticmethod
    async def _get_chat_summary(
        db: AsyncSession, start_date: datetime, end_date: datetime,
        department_id: Optional[int] = None, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimized chat analytics summary"""
        filters = ["ca.created_at BETWEEN :start_date AND :end_date"]
        params = {'start_date': start_date, 'end_date': end_date}
        
        if department_id:
            filters.append("u.department_id = :dept_id")
            params['dept_id'] = department_id
        
        if user_id:
            filters.append("ca.user_id = :user_id")
            params['user_id'] = user_id
        
        filter_clause = " AND ".join(filters)
        
        query = f"""
        SELECT 
            COUNT(*) as total_messages,
            AVG(sentiment_score) as avg_sentiment,
            COUNT(DISTINCT session_id) as unique_sessions,
            AVG(confidence_score) as avg_confidence
        FROM chat_analyses ca
        JOIN users u ON ca.user_id = u.id
        WHERE {filter_clause}
        """
        
        result = await db.execute(text(query), params)
        row = result.first()
        
        if not row or row.total_messages == 0:
            return {
                "total_messages": 0,
                "avg_sentiment": 0.0,
                "unique_sessions": 0,
                "avg_confidence": 0.0
            }
        
        return {
            "total_messages": row.total_messages,
            "avg_sentiment": float(row.avg_sentiment or 0),
            "unique_sessions": row.unique_sessions,
            "avg_confidence": float(row.avg_confidence or 0)
        }
    
    @staticmethod
    async def _get_survey_summary(
        db: AsyncSession, start_date: datetime, end_date: datetime,
        department_id: Optional[int] = None, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimized survey analytics summary"""
        filters = ["sr.created_at BETWEEN :start_date AND :end_date"]
        params = {'start_date': start_date, 'end_date': end_date}
        
        if department_id:
            filters.append("u.department_id = :dept_id")
            params['dept_id'] = department_id
        
        if user_id:
            filters.append("sr.user_id = :user_id")
            params['user_id'] = user_id
        
        filter_clause = " AND ".join(filters)
        
        query = f"""
        SELECT 
            COUNT(*) as total_responses,
            AVG(burnout_score) as avg_burnout_score,
            COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk_count,
            AVG(prediction_confidence) as avg_confidence
                    FROM survey_responses sr 
            JOIN users u ON sr.user_id = u.id
            WHERE {filter_clause}
        """
        
        result = await db.execute(text(query), params)
        row = result.first()
        
        if not row or row.total_responses == 0:
            return {
                "total_responses": 0,
                "avg_burnout_score": 0.0,
                "high_risk_count": 0,
                "avg_confidence": 0.0
            }
        
        return {
            "total_responses": row.total_responses,
            "avg_burnout_score": float(row.avg_burnout_score or 0),
            "high_risk_count": row.high_risk_count,
            "avg_confidence": float(row.avg_confidence or 0)
        }

def clear_analytics_cache():
    """Clear all cached analytics data"""
    analytics_cache.clear()
    logger.info("Analytics cache cleared") 