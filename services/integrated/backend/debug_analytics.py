import asyncio
import sys
sys.path.insert(0, '../../core')

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

DATABASE_URL = 'postgresql+asyncpg://neondb_owner:npg_HSY7PwQV1arg@ep-wild-fog-a8k8okly-pooler.eastus2.azure.neon.tech/neondb'

async def check_enum_values():
    try:
        async_engine = create_async_engine(DATABASE_URL, echo=False)
        async_session_local = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session_local() as session:
            # Check enum values for mental_state
            result = await session.execute(text("SELECT unnest(enum_range(NULL::mentalstate))"))
            mental_states = [row[0] for row in result.fetchall()]
            print(f"Mental state enum values: {mental_states}")
            
            # Check actual mental_state values in chat_analyses
            result = await session.execute(text("SELECT DISTINCT mental_state FROM chat_analyses WHERE mental_state IS NOT NULL LIMIT 10"))
            actual_values = [row[0] for row in result.fetchall()]
            print(f"Actual mental_state values in chat_analyses: {actual_values}")
            
            # Check speech_analyses
            result = await session.execute(text("SELECT DISTINCT mental_state FROM speech_analyses WHERE mental_state IS NOT NULL LIMIT 10"))
            speech_values = [row[0] for row in result.fetchall()]
            print(f"Actual mental_state values in speech_analyses: {speech_values}")
            
            # Check emotion enum values
            result = await session.execute(text("SELECT unnest(enum_range(NULL::emotiontype))"))
            emotion_types = [row[0] for row in result.fetchall()]
            print(f"Emotion enum values: {emotion_types}")
            
            # Check actual emotion values
            result = await session.execute(text("SELECT DISTINCT dominant_emotion FROM video_analyses WHERE dominant_emotion IS NOT NULL LIMIT 10"))
            video_emotions = [row[0] for row in result.fetchall()]
            print(f"Actual dominant_emotion values in video_analyses: {video_emotions}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(check_enum_values())
