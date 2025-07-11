#!/usr/bin/env python3
"""
Simple database connection test script
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import db_manager
from config import get_config
from sqlalchemy import text

async def test_database_connection():
    """Test database connection"""
    config = get_config()
    print(f"Testing database connection...")
    print(f"Database URL: {config.database_url[:30]}...")
    
    try:
        # Test async connection
        print("Testing async database connection...")
        is_healthy = await db_manager.check_health()
        if is_healthy:
            print("✅ Async database connection successful!")
        else:
            print("❌ Async database connection failed!")
            return False
        
        # Test creating a session
        print("Testing session creation...")
        async with db_manager.get_async_session() as session:
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            print(f"✅ Session test successful! Result: {test_value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sync_connection():
    """Test synchronous database connection"""
    try:
        print("Testing sync database connection...")
        with db_manager.get_sync_session() as session:
            result = session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            print(f"✅ Sync connection successful! Result: {test_value}")
        return True
    except Exception as e:
        print(f"❌ Sync database connection error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔍 Database Connection Test")
    print("=" * 40)
    
    # Test sync connection first
    sync_success = test_sync_connection()
    print()
    
    # Test async connection
    async_success = asyncio.run(test_database_connection())
    print()
    
    if sync_success and async_success:
        print("🎉 All database connections successful!")
        sys.exit(0)
    else:
        print("💥 Some database connections failed!")
        print("\n💡 Troubleshooting tips:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Remove SSL parameters: sslmode, channel_binding, sslcert, etc.")
        print("3. Use format: postgresql://user:pass@host:port/database")
        print("4. Ensure PostgreSQL is running and accessible")
        sys.exit(1) 