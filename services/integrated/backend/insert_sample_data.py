#!/usr/bin/env python3
"""
Sample data insertion script for analytics testing
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import random

# Database connection string
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_HSY7PwQV1arg@ep-wild-fog-a8k8okly-pooler.eastus2.azure.neon.tech/neondb"

async def create_tables():
    """Create basic tables if they don't exist"""
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Create users table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                department_id INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        # Create departments table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        # Create chat_analyses table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_analyses (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                message_content TEXT,
                dominant_emotion VARCHAR(50),
                mental_state VARCHAR(50),
                confidence_score FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        # Create speech_analyses table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS speech_analyses (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                transcribed_text TEXT,
                dominant_emotion VARCHAR(50),
                mental_state VARCHAR(50),
                transcription_confidence FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        # Create video_analyses table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS video_analyses (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                dominant_emotion VARCHAR(50),
                average_confidence FLOAT,
                face_detection_confidence FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        # Create survey_responses table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS survey_responses (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                burnout_score FLOAT,
                stress_level INTEGER,
                prediction_confidence FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """))
        
        print("✅ Tables created successfully!")

async def insert_sample_data():
    """Insert sample data for analytics"""
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Insert departments
        await conn.execute(text("""
            INSERT INTO departments (name, description) VALUES
            ('Engineering', 'Software Development Team'),
            ('Marketing', 'Marketing and Sales Team'),
            ('HR', 'Human Resources'),
            ('Finance', 'Finance and Accounting'),
            ('Sales', 'Sales Team')
            ON CONFLICT (name) DO NOTHING
        """))
        
        # Insert sample users
        user_ids = []
        for i in range(20):
            result = await conn.execute(text("""
                INSERT INTO users (email, full_name, department_id) VALUES
                (:email, :name, :dept_id)
                ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING id
            """), {
                'email': f'user{i+1}@company.com',
                'name': f'User {i+1}',
                'dept_id': random.randint(1, 5)
            })
            user_id = result.fetchone()[0]
            user_ids.append(user_id)
        
        # Insert sample chat analyses
        emotions = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fear']
        mental_states = ['calm', 'stressed', 'anxious', 'depressed', 'excited', 'focused']
        
        for i in range(100):
            await conn.execute(text("""
                INSERT INTO chat_analyses (user_id, message_content, dominant_emotion, mental_state, confidence_score, created_at) VALUES
                (:user_id, :content, :emotion, :state, :confidence, :created_at)
            """), {
                'user_id': random.choice(user_ids),
                'content': f'Sample chat message {i+1}',
                'emotion': random.choice(emotions),
                'state': random.choice(mental_states),
                'confidence': random.uniform(0.5, 1.0),
                'created_at': datetime.now() - timedelta(days=random.randint(0, 30))
            })
        
        # Insert sample speech analyses
        for i in range(80):
            await conn.execute(text("""
                INSERT INTO speech_analyses (user_id, transcribed_text, dominant_emotion, mental_state, transcription_confidence, created_at) VALUES
                (:user_id, :text, :emotion, :state, :confidence, :created_at)
            """), {
                'user_id': random.choice(user_ids),
                'text': f'Sample speech transcription {i+1}',
                'emotion': random.choice(emotions),
                'state': random.choice(mental_states),
                'confidence': random.uniform(0.6, 1.0),
                'created_at': datetime.now() - timedelta(days=random.randint(0, 30))
            })
        
        # Insert sample video analyses
        for i in range(90):
            await conn.execute(text("""
                INSERT INTO video_analyses (user_id, dominant_emotion, average_confidence, face_detection_confidence, created_at) VALUES
                (:user_id, :emotion, :avg_conf, :face_conf, :created_at)
            """), {
                'user_id': random.choice(user_ids),
                'emotion': random.choice(emotions),
                'avg_conf': random.uniform(0.7, 1.0),
                'face_conf': random.uniform(0.8, 1.0),
                'created_at': datetime.now() - timedelta(days=random.randint(0, 30))
            })
        
        # Insert sample survey responses
        for i in range(60):
            await conn.execute(text("""
                INSERT INTO survey_responses (user_id, burnout_score, stress_level, prediction_confidence, created_at) VALUES
                (:user_id, :burnout, :stress, :confidence, :created_at)
            """), {
                'user_id': random.choice(user_ids),
                'burnout': random.uniform(1.0, 10.0),
                'stress': random.randint(1, 10),
                'confidence': random.uniform(0.6, 1.0),
                'created_at': datetime.now() - timedelta(days=random.randint(0, 30))
            })
        
        print("✅ Sample data inserted successfully!")

async def main():
    """Main function"""
    print("🚀 Starting sample data insertion...")
    
    try:
        await create_tables()
        await insert_sample_data()
        print("✅ All done! Sample data ready for analytics.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main()) 