"""
Tests for authentication service
"""
import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from core.services import services
from core.schemas import UserRegister, UserLogin, UserRole
from core.models import User


@pytest.fixture
def sample_user_data():
    return UserRegister(
        email="test@example.com",
        password="TestPass123!",
        first_name="John",
        last_name="Doe",
        employee_id="EMP001",
        role=UserRole.EMPLOYEE
    )


@pytest.fixture
def sample_user():
    user = User(
        id=uuid4(),
        email="test@example.com",
        first_name="John",
        last_name="Doe",
        password_hash="$2b$12$hashed_password",
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_locked=False,
        failed_login_attempts=0
    )
    return user


class TestAuthService:
    """Test authentication service functionality"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "TestPassword123!"
        
        # Hash password
        hashed = services.auth.get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are long
        
        # Verify correct password
        assert services.auth.verify_password(password, hashed)
        
        # Verify incorrect password
        assert not services.auth.verify_password("WrongPassword", hashed)
    
    def test_token_creation_and_validation(self, sample_user):
        """Test JWT token creation and validation"""
        # Create access token
        access_token = services.auth.create_access_token(
            sample_user.id, 
            sample_user.email, 
            sample_user.role
        )
        assert access_token
        assert isinstance(access_token, str)
        
        # Create refresh token
        refresh_token = services.auth.create_refresh_token(sample_user.id)
        assert refresh_token
        assert isinstance(refresh_token, str)
        
        # Decode and validate access token
        payload = services.auth.decode_token(access_token)
        assert payload is not None
        assert payload["sub"] == str(sample_user.id)
        assert payload["email"] == sample_user.email
        assert payload["role"] == sample_user.role.value
        assert payload["type"] == "access"
        
        # Decode and validate refresh token
        refresh_payload = services.auth.decode_token(refresh_token)
        assert refresh_payload is not None
        assert refresh_payload["sub"] == str(sample_user.id)
        assert refresh_payload["type"] == "refresh"
    
    def test_invalid_token_validation(self):
        """Test validation of invalid tokens"""
        # Invalid token
        assert services.auth.decode_token("invalid.token.here") is None
        
        # Empty token
        assert services.auth.decode_token("") is None
        
        # None token
        assert services.auth.decode_token(None) is None
    
    @pytest.mark.asyncio
    async def test_user_registration_success(self, sample_user_data):
        """Test successful user registration"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            # Mock that user doesn't exist
            user_repo_mock.get_by_email.return_value = None
            user_repo_mock.get_by_employee_id.return_value = None
            
            # Mock user creation
            created_user = User(
                id=uuid4(),
                email=sample_user_data.email,
                first_name=sample_user_data.first_name,
                last_name=sample_user_data.last_name,
                password_hash="hashed_password",
                role=sample_user_data.role,
                is_active=True
            )
            user_repo_mock.create.return_value = created_user
            
            # Register user
            user, access_token, refresh_token = await services.auth.register_user(
                db_mock, sample_user_data
            )
            
            assert user == created_user
            assert access_token
            assert refresh_token
            
            # Verify repository calls
            user_repo_mock.get_by_email.assert_called_once_with(db_mock, sample_user_data.email)
            user_repo_mock.get_by_employee_id.assert_called_once_with(db_mock, sample_user_data.employee_id)
            user_repo_mock.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_user_registration_duplicate_email(self, sample_user_data, sample_user):
        """Test user registration with duplicate email"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            # Mock that user already exists
            user_repo_mock.get_by_email.return_value = sample_user
            
            # Should raise ValueError
            with pytest.raises(ValueError, match="User with this email already exists"):
                await services.auth.register_user(db_mock, sample_user_data)
    
    @pytest.mark.asyncio
    async def test_user_authentication_success(self, sample_user):
        """Test successful user authentication"""
        db_mock = AsyncMock(spec=AsyncSession)
        password = "TestPassword123!"
        
        # Hash the password to match what would be in database
        sample_user.password_hash = services.auth.get_password_hash(password)
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get_by_email.return_value = sample_user
            user_repo_mock.reset_failed_login.return_value = True
            user_repo_mock.update_last_login.return_value = True
            
            # Authenticate user
            authenticated_user = await services.auth.authenticate_user(
                db_mock, sample_user.email, password
            )
            
            assert authenticated_user == sample_user
            user_repo_mock.reset_failed_login.assert_called_once_with(db_mock, sample_user.id)
            user_repo_mock.update_last_login.assert_called_once_with(db_mock, sample_user.id)
    
    @pytest.mark.asyncio
    async def test_user_authentication_wrong_password(self, sample_user):
        """Test user authentication with wrong password"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Set a different password hash
        sample_user.password_hash = services.auth.get_password_hash("DifferentPassword")
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get_by_email.return_value = sample_user
            user_repo_mock.increment_failed_login.return_value = True
            
            # Authenticate with wrong password
            authenticated_user = await services.auth.authenticate_user(
                db_mock, sample_user.email, "WrongPassword"
            )
            
            assert authenticated_user is None
            user_repo_mock.increment_failed_login.assert_called_once_with(db_mock, sample_user.id)
    
    @pytest.mark.asyncio
    async def test_user_authentication_locked_account(self, sample_user):
        """Test authentication with locked account"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Lock the user account
        sample_user.is_locked = True
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get_by_email.return_value = sample_user
            
            # Should return None for locked account
            authenticated_user = await services.auth.authenticate_user(
                db_mock, sample_user.email, "AnyPassword"
            )
            
            assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_user_authentication_nonexistent_user(self):
        """Test authentication with nonexistent user"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get_by_email.return_value = None
            
            # Should return None for nonexistent user
            authenticated_user = await services.auth.authenticate_user(
                db_mock, "nonexistent@example.com", "AnyPassword"
            )
            
            assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self, sample_user):
        """Test getting current user with valid token"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Create a valid token
        token = services.auth.create_access_token(
            sample_user.id, sample_user.email, sample_user.role
        )
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get.return_value = sample_user
            
            # Get current user
            current_user = await services.auth.get_current_user(db_mock, token)
            
            assert current_user == sample_user
            user_repo_mock.get.assert_called_once_with(db_mock, sample_user.id)
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Use invalid token
        current_user = await services.auth.get_current_user(db_mock, "invalid.token")
        
        assert current_user is None
    
    @pytest.mark.asyncio
    async def test_get_current_user_inactive_user(self, sample_user):
        """Test getting current user for inactive user"""
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Create a valid token
        token = services.auth.create_access_token(
            sample_user.id, sample_user.email, sample_user.role
        )
        
        # Make user inactive
        sample_user.is_active = False
        
        with patch('core.repositories.repositories.user') as user_repo_mock:
            user_repo_mock.get.return_value = sample_user
            
            # Should return None for inactive user
            current_user = await services.auth.get_current_user(db_mock, token)
            
            assert current_user is None 