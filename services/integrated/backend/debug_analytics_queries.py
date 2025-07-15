#!/usr/bin/env python3
"""Debug script to test analytics queries directly"""

import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from datetime import datetime, timedelta
import os

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://neondb_owner:npg_HSY7PwQV1arg@ep-wild-fog-a8k8okly-pooler.eastus2.azure.neon.tech/neondb')

async def debug_analytics_queries():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("=== DEBUG ANALYTICS QUERIES ===")
        
        # Test date range (last 30 days)
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        print(f"Date range: {start_date} to {end_date}")
        print()
        
        # Test 1: Check raw data in each table
        print("1. RAW DATA COUNTS:")
        tables = ['users', 'chat_analyses', 'speech_analyses', 'video_analyses', 'survey_responses']
        for table in tables:
            try:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"   {table}: {count} rows")
            except Exception as e:
                print(f"   {table}: ERROR - {e}")
        print()
        
        # Test 2: Check data within date range
        print("2. DATA WITHIN DATE RANGE:")
        date_queries = {
            'chat_analyses': 'SELECT COUNT(*) FROM chat_analyses WHERE created_at BETWEEN :start_date AND :end_date',
            'speech_analyses': 'SELECT COUNT(*) FROM speech_analyses WHERE created_at BETWEEN :start_date AND :end_date',
            'video_analyses': 'SELECT COUNT(*) FROM video_analyses WHERE created_at BETWEEN :start_date AND :end_date',
            'survey_responses': 'SELECT COUNT(*) FROM survey_responses WHERE created_at BETWEEN :start_date AND :end_date'
        }
        
        params = {'start_date': start_date, 'end_date': end_date}
        for table, query in date_queries.items():
            try:
                result = await session.execute(text(query), params)
                count = result.scalar()
                print(f"   {table}: {count} rows in date range")
            except Exception as e:
                print(f"   {table}: ERROR - {e}")
        print()
        
        # Test 3: Check JOIN queries (the actual analytics queries)
        print("3. JOIN QUERIES (ACTUAL ANALYTICS):")
        join_queries = {
            'chat': '''
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk,
                       AVG(confidence_score) as avg_confidence
                FROM chat_analyses ca JOIN users u ON ca.user_id = u.id
                WHERE ca.created_at BETWEEN :start_date AND :end_date
            ''',
            'speech': '''
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN mental_state IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk,
                       AVG(transcription_confidence) as avg_confidence
                FROM speech_analyses sa JOIN users u ON sa.user_id = u.id
                WHERE sa.created_at BETWEEN :start_date AND :end_date
            ''',
            'video': '''
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN dominant_emotion IN ('ANGRY', 'SAD', 'FEAR') THEN 1 END) as high_risk,
                       AVG(average_confidence) as avg_confidence
                FROM video_analyses va JOIN users u ON va.user_id = u.id
                WHERE va.created_at BETWEEN :start_date AND :end_date
            ''',
            'survey': '''
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk,
                       AVG(prediction_confidence) as avg_confidence
                FROM survey_responses sr JOIN users u ON sr.user_id = u.id
                WHERE sr.created_at BETWEEN :start_date AND :end_date
            '''
        }
        
        for key, query in join_queries.items():
            try:
                result = await session.execute(text(query), params)
                row = result.fetchone()
                print(f"   {key}: total={row.total}, high_risk={row.high_risk}, avg_confidence={row.avg_confidence}")
            except Exception as e:
                print(f"   {key}: ERROR - {e}")
        print()
        
        # Test 4: Check if user_id columns are properly formatted
        print("4. USER_ID FORMAT CHECK:")
        user_id_queries = {
            'users': 'SELECT id, email FROM users LIMIT 3',
            'chat_analyses': 'SELECT user_id FROM chat_analyses LIMIT 3',
            'speech_analyses': 'SELECT user_id FROM speech_analyses LIMIT 3',
            'video_analyses': 'SELECT user_id FROM video_analyses LIMIT 3',
            'survey_responses': 'SELECT user_id FROM survey_responses LIMIT 3'
        }
        
        for table, query in user_id_queries.items():
            try:
                result = await session.execute(text(query))
                rows = result.fetchall()
                print(f"   {table}: {[str(row) for row in rows]}")
            except Exception as e:
                print(f"   {table}: ERROR - {e}")
        print()
        
        # Test 5: Check for orphaned records
        print("5. ORPHANED RECORDS CHECK:")
        orphan_queries = {
            'chat_analyses': 'SELECT COUNT(*) FROM chat_analyses WHERE user_id NOT IN (SELECT id FROM users)',
            'speech_analyses': 'SELECT COUNT(*) FROM speech_analyses WHERE user_id NOT IN (SELECT id FROM users)',
            'video_analyses': 'SELECT COUNT(*) FROM video_analyses WHERE user_id NOT IN (SELECT id FROM users)',
            'survey_responses': 'SELECT COUNT(*) FROM survey_responses WHERE user_id NOT IN (SELECT id FROM users)'
        }
        
        for table, query in orphan_queries.items():
            try:
                result = await session.execute(text(query))
                count = result.scalar()
                print(f"   {table}: {count} orphaned records")
            except Exception as e:
                print(f"   {table}: ERROR - {e}")
        print()
        
        # Test 6: Sample data from each table
        print("6. SAMPLE DATA:")
        sample_queries = {
            'chat_analyses': 'SELECT user_id, created_at, mental_state, confidence_score FROM chat_analyses ORDER BY created_at DESC LIMIT 2',
            'speech_analyses': 'SELECT user_id, created_at, mental_state, transcription_confidence FROM speech_analyses ORDER BY created_at DESC LIMIT 2',
            'video_analyses': 'SELECT user_id, created_at, dominant_emotion, average_confidence FROM video_analyses ORDER BY created_at DESC LIMIT 2',
            'survey_responses': 'SELECT user_id, created_at, burnout_score, prediction_confidence FROM survey_responses ORDER BY created_at DESC LIMIT 2'
        }
        
        for table, query in sample_queries.items():
            try:
                result = await session.execute(text(query))
                rows = result.fetchall()
                print(f"   {table}:")
                for row in rows:
                    print(f"     {row}")
            except Exception as e:
                print(f"   {table}: ERROR - {e}")
        print()

if __name__ == "__main__":
    asyncio.run(debug_analytics_queries()) 