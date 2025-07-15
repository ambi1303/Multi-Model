#!/usr/bin/env python3
"""
Check existing database schema
"""
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

# Database connection string
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_HSY7PwQV1arg@ep-wild-fog-a8k8okly-pooler.eastus2.azure.neon.tech/neondb"

async def check_schema():
    """Check existing database schema"""
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Check existing tables
        result = await conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        
        tables = result.fetchall()
        print("🔍 Existing tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check columns for each table
        for table in tables:
            table_name = table[0]
            print(f"\n📊 Columns in {table_name}:")
            
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = :table_name
                ORDER BY ordinal_position;
            """), {'table_name': table_name})
            
            columns = result.fetchall()
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                default = f" DEFAULT {col[3]}" if col[3] else ""
                print(f"    {col[0]}: {col[1]} {nullable}{default}")
        
        # Check if there's any data in the tables
        print("\n📈 Data count per table:")
        for table in tables:
            table_name = table[0]
            try:
                result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.fetchone()[0]
                print(f"  {table_name}: {count} rows")
            except Exception as e:
                print(f"  {table_name}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(check_schema()) 