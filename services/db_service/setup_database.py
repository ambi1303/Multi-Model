#!/usr/bin/env python3
"""
Database setup script for Mental Health Analytics
"""

import os
import sys
from sqlalchemy.orm import Session
from database import engine, SessionLocal, create_tables, drop_tables
import models
from auth import get_password_hash

def create_default_departments(db: Session):
    """Create default departments."""
    departments = [
        {"name": "IT Department"},
        {"name": "HR Department"},
        {"name": "Finance Department"},
        {"name": "Marketing Department"},
        {"name": "Operations Department"}
    ]
    
    for dept_data in departments:
        existing = db.query(models.Department).filter(
            models.Department.name == dept_data["name"]
        ).first()
        
        if not existing:
            dept = models.Department(**dept_data)
            db.add(dept)
            print(f"✅ Created department: {dept_data['name']}")
        else:
            print(f"⚠️  Department already exists: {dept_data['name']}")
    
    db.commit()

def create_default_roles(db: Session):
    """Create default roles."""
    roles = [
        {"name": "admin"},
        {"name": "analyst"},
        {"name": "user"},
        {"name": "viewer"}
    ]
    
    for role_data in roles:
        existing = db.query(models.Role).filter(
            models.Role.name == role_data["name"]
        ).first()
        
        if not existing:
            role = models.Role(**role_data)
            db.add(role)
            print(f"✅ Created role: {role_data['name']}")
        else:
            print(f"⚠️  Role already exists: {role_data['name']}")
    
    db.commit()

def create_admin_user(db: Session):
    """Create a default admin user."""
    admin_email = "admin@mentalhealth.com"
    admin_password = "admin123"
    
    # Check if admin user exists
    existing_admin = db.query(models.User).filter(
        models.User.email == admin_email
    ).first()
    
    if existing_admin:
        print(f"⚠️  Admin user already exists: {admin_email}")
        return existing_admin
    
    # Get IT department
    it_dept = db.query(models.Department).filter(
        models.Department.name == "IT Department"
    ).first()
    
    # Create admin user
    admin_user = models.User(
        email=admin_email,
        password_hash=get_password_hash(admin_password),
        dept_id=it_dept.id if it_dept else None
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # Assign admin role
    admin_role = db.query(models.Role).filter(
        models.Role.name == "admin"
    ).first()
    
    if admin_role:
        user_role = models.UserRole(
            user_id=admin_user.id,
            role_id=admin_role.id
        )
        db.add(user_role)
        db.commit()
    
    print(f"✅ Created admin user: {admin_email} (password: {admin_password})")
    return admin_user

def verify_database_connection():
    """Verify database connection."""
    try:
        # Try to connect and execute a simple query
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def setup_database(drop_existing=False):
    """Set up the database with tables and default data."""
    print("🚀 Setting up Mental Health Analytics Database...")
    print("=" * 50)
    
    # Verify connection first
    if not verify_database_connection():
        print("❌ Cannot connect to database. Please check your DATABASE_URL in .env file.")
        return False
    
    # Drop tables if requested
    if drop_existing:
        print("⚠️  Dropping existing tables...")
        drop_tables()
        print("✅ Existing tables dropped")
    
    # Create tables
    print("📝 Creating database tables...")
    create_tables()
    print("✅ Database tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Create default data
        print("📝 Creating default departments...")
        create_default_departments(db)
        
        print("📝 Creating default roles...")
        create_default_roles(db)
        
        print("📝 Creating admin user...")
        create_admin_user(db)
        
        print("=" * 50)
        print("🎉 Database setup completed successfully!")
        print("\nDefault Admin Credentials:")
        print("Email: admin@mentalhealth.com")
        print("Password: admin123")
        print("\nAPI Documentation: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during setup: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def reset_database():
    """Reset the entire database."""
    print("⚠️  WARNING: This will delete ALL data in the database!")
    confirm = input("Are you sure you want to continue? (yes/no): ").lower()
    
    if confirm == 'yes':
        return setup_database(drop_existing=True)
    else:
        print("❌ Database reset cancelled")
        return False

if __name__ == "__main__":
    # Check for environment variables
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Please create a .env file with your database connection string.")
        print("Example: DATABASE_URL=postgresql://username:password@host:port/database")
        sys.exit(1)
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--reset":
            reset_database()
        elif sys.argv[1] == "--help":
            print("Usage:")
            print("  python setup_database.py         # Set up database with default data")
            print("  python setup_database.py --reset # Reset database (WARNING: deletes all data)")
            print("  python setup_database.py --help  # Show this help message")
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print("Use --help for usage information")
    else:
        setup_database() 