"""
Database connection and session management
"""
import logging
from typing import AsyncGenerator, Optional
from contextlib import contextmanager, asynccontextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool, QueuePool
from alembic.config import Config
from alembic import command

from config import get_config, get_database_url

# Create declarative base for models
Base = declarative_base()

logger = logging.getLogger(__name__)

# Database manager handles all connections - no global variables needed

class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.config = get_config()
        self._async_engine = None
        self._sync_engine = None
        self._async_session_local = None
        self._sync_session_local = None
    
    def initialize_sync_db(self):
        """Initialize synchronous database connection"""
        if self._sync_engine is None:
            # Use QueuePool for PostgreSQL connections
            self._sync_engine = create_engine(
                self.config.database_url,
                poolclass=QueuePool,
                pool_size=self.config.database_pool_size,
                max_overflow=self.config.database_max_overflow,
                pool_pre_ping=self.config.database_pool_pre_ping,
                echo=self.config.database_echo,
                pool_recycle=3600,  # Recycle connections every hour
                connect_args={
                    "options": "-c timezone=utc",
                    "connect_timeout": 10,
                    "application_name": f"{self.config.service_name}_sync"
                }
            )
            
            # Add event listeners for connection health
            @event.listens_for(self._sync_engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                if 'postgresql' in self.config.database_url:
                    # Set PostgreSQL session parameters
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
        """Initialize asynchronous database connection"""
        if self._async_engine is None:
            # Convert sync URL to async URL and clean SSL parameters
            async_url = self.config.database_url.replace(
                "postgresql://", "postgresql+asyncpg://"
            )
            
            # Remove SSL parameters that might not be compatible with asyncpg
            import urllib.parse as urlparse
            parsed = urlparse.urlparse(async_url)
            query_params = urlparse.parse_qs(parsed.query)
            
            # Remove potentially problematic SSL parameters
            problematic_params = [
                'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslcrl',
                'channel_binding', 'gssencmode', 'target_session_attrs',
                'passfile', 'service', 'options'
            ]
            for param in problematic_params:
                query_params.pop(param, None)
            
            # Rebuild the URL without problematic parameters
            new_query = urlparse.urlencode(query_params, doseq=True)
            cleaned_url = urlparse.urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
            
            # Prepare connection arguments
            connect_args = {
                "command_timeout": 10,
                "server_settings": {
                    "application_name": f"{self.config.service_name}_async",
                    "timezone": "UTC"
                }
            }
            
            # Handle SSL configuration properly for asyncpg
            if 'ssl' in self.config.database_url.lower() or 'sslmode' in self.config.database_url:
                # For development, disable SSL verification
                # For production, you should configure proper SSL
                import ssl
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                connect_args["ssl"] = ssl_context
            
            self._async_engine = create_async_engine(
                cleaned_url,
                pool_size=self.config.database_pool_size,
                max_overflow=self.config.database_max_overflow,
                pool_pre_ping=self.config.database_pool_pre_ping,
                echo=self.config.database_echo,
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
        """Get synchronous database session with proper cleanup"""
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
        """Get asynchronous database session with proper cleanup"""
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
        """Check database health"""
        try:
            async with self.get_async_session() as session:
                result = await session.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            logger.debug(f"Database URL being used: {self.config.database_url[:20]}...")
            return False
    
    def run_migrations(self, revision: str = "head"):
        """Run database migrations"""
        try:
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, revision)
            logger.info(f"Migrations completed to revision: {revision}")
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise
    
    def create_all_tables(self):
        """Create all tables (for development only)"""
        if self._sync_engine is None:
            self.initialize_sync_db()
        Base.metadata.create_all(bind=self._sync_engine)
        logger.info("All tables created")


# Base Repository Class
from typing import TypeVar, Generic, Type, Optional, List, Dict, Any, Union
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base repository with common CRUD operations"""
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Get a single record by ID"""
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
        """Get multiple records with pagination and optional filters"""
        query = select(self.model)
        
        # Apply filters if provided
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    if value is not None:
                        query = query.where(getattr(self.model, key) == value)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create(self, db: AsyncSession, *, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        """Create a new record"""
        try:
            if isinstance(obj_in, dict):
                obj_data = obj_in
            else:
                obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
            
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
        """Update an existing record"""
        try:
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)
            
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
    
    async def delete(self, db: AsyncSession, *, id: Any) -> ModelType:
        """Delete a record by ID"""
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
    
    async def soft_delete(self, db: AsyncSession, *, id: Any) -> ModelType:
        """Soft delete a record by setting is_active to False"""
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
        """Count records with optional filters"""
        query = select(func.count(self.model.id))
        
        # Apply filters if provided
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
        
        result = await db.execute(query)
        return result.scalar() or 0


# Global managers
db_manager = DatabaseManager()


# Dependency functions for FastAPI
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for asynchronous database session"""
    async with db_manager.get_async_session() as session:
        yield session


# Database is initialized through the DatabaseManager instance when needed 