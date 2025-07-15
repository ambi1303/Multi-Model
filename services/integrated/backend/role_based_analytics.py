#!/usr/bin/env python3
"""
Role-based analytics module for the integrated backend
Handles user authentication and data filtering based on roles
"""
import logging
from typing import Optional, Dict, Any, Tuple
from uuid import UUID
import aiohttp
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

class RoleBasedAnalytics:
    """Handle role-based analytics access control"""
    
    def __init__(self, core_service_url: str):
        self.core_service_url = core_service_url
    
    async def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from JWT token via core service"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.core_service_url}/auth/me", headers=headers) as resp:
                    if resp.status == 200:
                        user_data = await resp.json()
                        logger.info(f"User authenticated: {user_data.get('email')} (Role: {user_data.get('role')})")
                        return user_data
                    else:
                        logger.warning(f"Failed to authenticate user: {resp.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting user from token: {e}")
            return None
    
    def get_analytics_filters(self, user: Dict[str, Any]) -> Tuple[Optional[str], Optional[int]]:
        """
        Get analytics filters based on user role
        Returns: (user_id_filter, department_id_filter)
        """
        role = user.get('role', '').upper()
        user_id = user.get('id')
        department_id = user.get('department_id')
        
        if role == 'ADMIN':
            # Admin can see all data
            return None, None
        elif role == 'ANALYST':
            # Analyst can see all data for analysis
            return None, None
        elif role == 'MANAGER':
            # Manager can see their department's data
            return None, department_id
        elif role == 'EMPLOYEE':
            # Employee can only see their own data
            return user_id, department_id
        else:
            # Default to employee permissions
            return user_id, department_id
    
    async def apply_role_filters(self, 
                               db: AsyncSession, 
                               base_query: str, 
                               params: Dict[str, Any],
                               user: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """
        Apply role-based filters to a SQL query
        """
        user_id_filter, department_id_filter = self.get_analytics_filters(user)
        
        additional_filters = []
        
        if user_id_filter:
            additional_filters.append("AND u.id = :user_id")
            params['user_id'] = user_id_filter
            
        if department_id_filter:
            additional_filters.append("AND u.department_id = :dept_id")
            params['dept_id'] = department_id_filter
        
        # Add filters to the query
        if additional_filters:
            filter_string = " ".join(additional_filters)
            # Insert filters before GROUP BY or ORDER BY if they exist
            if "GROUP BY" in base_query:
                base_query = base_query.replace("GROUP BY", f"{filter_string} GROUP BY")
            elif "ORDER BY" in base_query:
                base_query = base_query.replace("ORDER BY", f"{filter_string} ORDER BY")
            else:
                base_query += filter_string
        
        return base_query, params
    
    def get_access_summary(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Get a summary of what data the user can access"""
        role = user.get('role', '').upper()
        
        access_info = {
            "user_id": user.get('id'),
            "role": role,
            "department_id": user.get('department_id'),
            "department_name": user.get('department', {}).get('name', 'Unknown'),
            "employee_id": user.get('employee_id'),
            "access_level": "unknown"
        }
        
        if role == 'ADMIN':
            access_info.update({
                "access_level": "full",
                "description": "Can access all data from all users and departments",
                "data_scope": "All users, all departments"
            })
        elif role == 'ANALYST':
            access_info.update({
                "access_level": "full",
                "description": "Can access all data for analysis purposes",
                "data_scope": "All users, all departments"
            })
        elif role == 'MANAGER':
            access_info.update({
                "access_level": "department",
                "description": f"Can access data from {access_info['department_name']} department",
                "data_scope": f"All users in {access_info['department_name']} department"
            })
        elif role == 'EMPLOYEE':
            access_info.update({
                "access_level": "personal",
                "description": "Can only access own data",
                "data_scope": "Personal data only"
            })
        
        return access_info

# Global instance
role_analytics = None

def get_role_analytics(core_service_url: str) -> RoleBasedAnalytics:
    """Get or create role-based analytics instance"""
    global role_analytics
    if role_analytics is None:
        role_analytics = RoleBasedAnalytics(core_service_url)
    return role_analytics

async def authenticate_and_authorize(token: str, core_service_url: str) -> Dict[str, Any]:
    """
    Authenticate user and return user info
    Raises HTTPException if authentication fails
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is required"
        )
    
    # Remove 'Bearer ' prefix if present
    if token.startswith('Bearer '):
        token = token[7:]
    
    role_analytics = get_role_analytics(core_service_url)
    user = await role_analytics.get_user_from_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user 