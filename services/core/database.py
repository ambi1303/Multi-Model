"""
Database connection and session management.
This is the corrected version with nested configuration access, simplified async setup,
and improved security.
"""
import logging
import ssl
from typing import AsyncGenerator, TypeVar, Generic, Type, Optional, List, Dict, Any, Union
from contextlib import contextmanager, asynccontextmanager

from sqlalchemy import create_engine, event, text, select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from alembic.config import Config
from alembic import command

from config import get_config

# Create declarative base for models
Base = declarative_base()

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database connection manager."""
    
    def __init__(self):
        self.config = get_config()
        self._async_engine = None
        self._sync_engine = None
        self._async_session_local = None
        self._sync_session_local = None
    
    def initialize_sync_db(self):
        """Initialize synchronous database connection."""
        if self._sync_engine is None:
            self._sync_engine = create_engine(
                self.config.database.url,
                poolclass=QueuePool,
                pool_size=self.config.database.pool_size,
                max_overflow=self.config.database.max_overflow,
                pool_pre_ping=self.config.database.pool_pre_ping,
                echo=self.config.database.echo,
                pool_recycle=3600,  # Recycle connections every hour
                connect_args={
                    "options": "-c timezone=utc",
                    "connect_timeout": 10,
                    "application_name": f"{self.config.service.name}_sync"
                }
            )
            
            # Renamed function for clarity
            @event.listens_for(self._sync_engine, "connect")
            def set_postgres_timezone(dbapi_connection, connection_record):
                if 'postgresql' in self.config.database.url:
                    cursor = dbapi_connection.cursor()
                    cursor.execute("SET TIME ZONE 'UTC'")
                    cursor.close()
            
            self._sync_session_local = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._sync_engine
            )
            
        return self._sync_engine
    
    def initialize_async_db(self):
        """Initialize asynchronous database connection."""
        if self._async_engine is None:
            async_url = self.config.database.url.replace(
                "postgresql://", "postgresql+asyncpg://"
            )
            
            # Strip sslmode from URL (asyncpg uses ssl context instead)
            if "sslmode=" in async_url:
                import re
                async_url = re.sub(r'[?&]sslmode=[^&]*', '', async_url)
                if async_url.endswith('?'):
                    async_url = async_url[:-1]

            connect_args = {
                "command_timeout": 10,
                "server_settings": {
                    "application_name": f"{self.config.service.name}_async",
                    "timezone": "UTC"
                }
            }
            
            if "neon.tech" in self.config.database.url:
                ssl_ctx = ssl.create_default_context()
                connect_args["ssl"] = ssl_ctx
            
            self._async_engine = create_async_engine(
                async_url,
                pool_size=self.config.database.pool_size,
                max_overflow=self.config.database.max_overflow,
                pool_pre_ping=self.config.database.pool_pre_ping,
                echo=self.config.database.echo,
                pool_recycle=3600,
                connect_args=connect_args
            )
            
            self._async_session_local = async_sessionmaker(
                self._async_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
        return self._async_engine
    
    @contextmanager
    def get_sync_session(self):
        """Get synchronous database session with proper cleanup."""
        if self._sync_session_local is None:
            self.initialize_sync_db()
            
        session = self._sync_session_local()
        try:
            yield session
        except Exception as e:
            session.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            session.close()
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get asynchronous database session with proper cleanup."""
        if self._async_session_local is None:
            self.initialize_async_db()
            
        async with self._async_session_local() as session:
            try:
                yield session
            except Exception as e:
                await session.rollback()
                logger.error(f"Async database error: {e}")
                raise
    
    async def check_health(self) -> bool:
        """Check database health."""
        try:
            async with self.get_async_session() as session:
                result = await session.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            logger.debug(f"Database URL being used: {self.config.database.url[:20]}...")
            return False
    
    def run_migrations(self, revision: str = "head"):
        """Run database migrations."""
        try:
            alembic_cfg = Config("alembic.ini")
            # Point alembic to the correct database URL
            alembic_cfg.set_main_option("sqlalchemy.url", self.config.database.url)
            command.upgrade(alembic_cfg, revision)
            logger.info(f"Migrations completed to revision: {revision}")
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise
    
    def create_all_tables(self):
        """Create all tables (for development only)."""
        if self._sync_engine is None:
            self.initialize_sync_db()
        Base.metadata.create_all(bind=self._sync_engine)
        logger.info("All tables created")

# --- Base Repository Class ---
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base repository with common CRUD operations."""
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Get a single record by ID."""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """Get multiple records with pagination and optional filters."""
        query = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create(self, db: AsyncSession, *, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        """Create a new record."""
        try:
            obj_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump()
            
            db_obj = self.model(**obj_data)
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            return db_obj
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating {self.model.__name__}: {e}")
            raise
    
    async def update(
        self, 
        db: AsyncSession, 
        *, 
        db_obj: ModelType, 
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update an existing record."""
        try:
            update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            return db_obj
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating {self.model.__name__}: {e}")
            raise
    
    async def delete(self, db: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """Delete a record by ID."""
        try:
            obj = await self.get(db, id=id)
            if obj:
                await db.delete(obj)
                await db.commit()
            return obj
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting {self.model.__name__} with id {id}: {e}")
            raise
    
    async def soft_delete(self, db: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """Soft delete a record by setting is_active to False."""
        try:
            obj = await self.get(db, id=id)
            if obj and hasattr(obj, 'is_active'):
                obj.is_active = False
                db.add(obj)
                await db.commit()
                await db.refresh(obj)
            return obj
        except Exception as e:
            await db.rollback()
            logger.error(f"Error soft deleting {self.model.__name__} with id {id}: {e}")
            raise
    
    async def count(self, db: AsyncSession, *, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters."""
        query = select(func.count(self.model.id))
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
        
        result = await db.execute(query)
        return result.scalar() or 0

# --- Global managers & Dependencies ---
db_manager = DatabaseManager()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for asynchronous database session."""
    async with db_manager.get_async_session() as session:
        yield session