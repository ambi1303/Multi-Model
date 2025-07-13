#!/usr/bin/env python3
"""Check and fix user roles"""

import asyncio
import sys
import os
from pathlib import Path

# Add the services/core directory to the path
sys.path.insert(0, str(Path(__file__).parent / "services" / "core"))

from database import db_manager
from services import services
from models import User, UserRole
from sqlalchemy import select, update
import schemas

async def check_and_fix_user_roles():
    """Check and fix user roles"""
    print("🔍 Checking User Roles...")
    
    try:
        async with db_manager.get_async_session() as db:
            # Check admin user
            result = await db.execute(select(User).where(User.email == 'admin@company.com'))
            admin_user = result.scalar_one_or_none()
            
            print(f"Admin user exists: {admin_user is not None}")
            if admin_user:
                print(f"Admin role: {admin_user.role}")
                print(f"Admin active: {admin_user.is_active}")
                print(f"Admin locked: {admin_user.is_locked}")
            
            # Check ambikesh user
            result2 = await db.execute(select(User).where(User.email == 'ambikesh@example.com'))
            ambikesh_user = result2.scalar_one_or_none()
            
            print(f"Ambikesh user exists: {ambikesh_user is not None}")
            if ambikesh_user:
                print(f"Ambikesh role: {ambikesh_user.role}")
                print(f"Ambikesh active: {ambikesh_user.is_active}")
                print(f"Ambikesh locked: {ambikesh_user.is_locked}")
                
                # Fix: Make ambikesh user an admin
                if ambikesh_user.role != UserRole.ADMIN:
                    print("🔧 Upgrading ambikesh user to admin...")
                    await db.execute(
                        update(User)
                        .where(User.email == 'ambikesh@example.com')
                        .values(role=UserRole.ADMIN, is_active=True, is_locked=False)
                    )
                    await db.commit()
                    print("✅ Ambikesh user upgraded to admin")
                else:
                    print("✅ Ambikesh user already has admin privileges")
            
            # Create admin user if it doesn't exist
            if not admin_user:
                print("🔧 Creating default admin user...")
                admin_data = schemas.UserRegister(
                    email="admin@company.com",
                    password="AdminPass123!",
                    first_name="System",
                    last_name="Administrator",
                    employee_id="ADMIN001",
                    role=UserRole.ADMIN
                )
                await services.auth.register_user(db, admin_data)
                print("✅ Created default admin user")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_and_fix_user_roles()) 