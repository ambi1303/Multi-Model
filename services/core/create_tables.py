#!/usr/bin/env python3
"""
Database table creation script
Creates all tables according to the ER diagram schema
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import db_manager, Base
from models import *  # Import all models
from config import get_config

async def create_all_tables():
    """Create all database tables"""
    config = get_config()
    print(f"🔍 Creating tables for database: {config.database.url[:30]}...")
    
    try:
        # Initialize database connection
        print("🔗 Initializing database connection...")
        db_manager.initialize_sync_db()
        print("✅ Database connection initialized")
        
        print("📋 Creating all tables...")
        
        # Debug: List all available models
        print(f"📊 Found {len(Base.metadata.tables)} table definitions:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
        
        # Create all tables defined in models
        print("🏗️  Creating tables in database...")
        db_manager.create_all_tables()
        
        print("✅ All tables created successfully!")
        
        # List all created tables
        table_names = [table.name for table in Base.metadata.tables.values()]
        print(f"\n📊 Created {len(table_names)} tables:")
        for table_name in sorted(table_names):
            print(f"  - {table_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print("📋 Full traceback:")
        traceback.print_exc()
        return False

async def test_table_creation():
    """Test that all tables were created properly"""
    try:
        async with db_manager.get_async_session() as session:
            from sqlalchemy import text
            
            # Query information_schema to check tables
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            
            tables = [row[0] for row in result.fetchall()]
            print(f"\n🔍 Found {len(tables)} tables in database:")
            for table in tables:
                print(f"  ✓ {table}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return False

def main():
    """Main function"""
    print("🏗️  Database Table Creation")
    print("=" * 40)
    
    # Create tables
    success = asyncio.run(create_all_tables())
    
    if success:
        print("\n🔍 Verifying table creation...")
        asyncio.run(test_table_creation())
        
        print("\n🎉 Database schema setup complete!")
        print("\n📝 Next steps:")
        print("1. Run the application: python -m uvicorn main:app --reload")
        print("2. Check API docs: http://localhost:8000/docs")
        print("3. Test database health: http://localhost:8000/health/database")
        
        sys.exit(0)
    else:
        print("\n💥 Table creation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 