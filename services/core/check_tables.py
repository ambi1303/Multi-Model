#!/usr/bin/env python3
"""Check database tables and create missing ones if needed"""

import asyncio
from database import db_manager, Base
from sqlalchemy import text
from models import *

async def check_tables():
    print("🔍 Checking Database Tables...")
    
    try:
        # Get existing tables
        async with db_manager.get_async_session() as session:
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            existing_tables = [row[0] for row in result.fetchall()]
            
        print(f"\n📊 Found {len(existing_tables)} tables in database:")
        for table in existing_tables:
            print(f"  ✓ {table}")
            
        # Expected model tables
        model_tables = [
            'departments', 'users', 'roles', 'user_roles',
            'chat_analyses', 'speech_analyses', 'video_analyses',
            'emo_buddy_sessions', 'emo_buddy_messages', 'emo_buddy_phrases',
            'survey_responses', 'audit_logs', 'system_health',
            'report_snapshots', 'aggregated_metrics'
        ]
        
        print('\n📋 Table Status:')
        missing_tables = []
        for expected in model_tables:
            if expected in existing_tables:
                print(f'  ✅ {expected} - EXISTS')
            else:
                print(f'  ❌ {expected} - MISSING')
                missing_tables.append(expected)
        
        if missing_tables:
            print(f'\n⚠️  Missing {len(missing_tables)} tables:')
            for table in missing_tables:
                print(f'    - {table}')
            
            print("\n🔧 Would you like to create missing tables? (This will run Base.metadata.create_all)")
            
        else:
            print('\n🎉 All required tables exist!')
            
        # Check table counts
        print('\n📈 Table row counts:')
        async with db_manager.get_async_session() as session:
            for table in existing_tables:
                try:
                    result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    print(f"  {table}: {count} rows")
                except Exception as e:
                    print(f"  {table}: Error reading ({str(e)[:50]}...)")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_tables()) 