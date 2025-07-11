#!/usr/bin/env python3
"""
Setup script for Mental Health Analytics Backend
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(command, description=""):
    """Run a shell command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None


def check_requirements():
    """Check system requirements"""
    print("🔍 Checking system requirements...")
    
    # Check Python version
    if sys.version_info < (3.9):
        print("❌ Python 3.9+ is required")
        return False
    
    # Check if PostgreSQL is available
    if not run_command("which psql", "Checking PostgreSQL"):
        print("⚠️  PostgreSQL not found. Please install PostgreSQL")
        return False
    
    # Check if Redis is available
    if not run_command("which redis-cli", "Checking Redis"):
        print("⚠️  Redis not found. Please install Redis")
        return False
    
    print("✅ All requirements met")
    return True


def setup_environment():
    """Set up Python virtual environment"""
    venv_path = Path("venv")
    
    if not venv_path.exists():
        if not run_command("python -m venv venv", "Creating virtual environment"):
            return False
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        pip_path = "venv\\Scripts\\pip"
        python_path = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        pip_path = "venv/bin/pip"
        python_path = "venv/bin/python"
    
    if not run_command(f"{pip_path} install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{pip_path} install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True


def setup_database():
    """Set up database and run migrations"""
    # Check if .env file exists
    if not Path(".env").exists():
        if Path("env_example.txt").exists():
            run_command("cp env_example.txt .env", "Creating .env file")
            print("📝 Please edit .env file with your database credentials")
            return False
        else:
            print("❌ No environment configuration found")
            return False
    
    # Try to create database (will fail if it exists, which is OK)
    run_command("createdb mental_health_db", "Creating database (if not exists)")
    
    # Run migrations
    if os.name == 'nt':  # Windows
        alembic_path = "venv\\Scripts\\alembic"
    else:  # Unix/Linux/macOS
        alembic_path = "venv/bin/alembic"
    
    if not run_command(f"{alembic_path} upgrade head", "Running database migrations"):
        print("⚠️  Database migrations failed. Make sure your DATABASE_URL in .env is correct")
        return False
    
    return True


def setup_redis():
    """Check Redis connection"""
    if not run_command("redis-cli ping", "Testing Redis connection"):
        print("⚠️  Redis is not running. Please start Redis server")
        return False
    
    return True


def create_initial_migration():
    """Create initial database migration"""
    if os.name == 'nt':  # Windows
        alembic_path = "venv\\Scripts\\alembic"
    else:  # Unix/Linux/macOS
        alembic_path = "venv/bin/alembic"
    
    # Check if alembic directory exists
    if not Path("alembic").exists():
        if not run_command(f"{alembic_path} init alembic", "Initializing Alembic"):
            return False
    
    # Generate initial migration
    if not run_command(f"{alembic_path} revision --autogenerate -m 'Initial migration'", 
                      "Generating initial migration"):
        return False
    
    return True


def start_development_server():
    """Start the development server"""
    if os.name == 'nt':  # Windows
        python_path = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        python_path = "venv/bin/python"
    
    print("🚀 Starting development server...")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("📊 Metrics: http://localhost:8000/metrics")
    print("\nPress Ctrl+C to stop the server")
    
    os.system(f"{python_path} -m core.main")


def run_tests():
    """Run the test suite"""
    if os.name == 'nt':  # Windows
        pytest_path = "venv\\Scripts\\pytest"
    else:  # Unix/Linux/macOS
        pytest_path = "venv/bin/pytest"
    
    if not run_command(f"{pytest_path} -v", "Running tests"):
        return False
    
    return True


def main():
    parser = argparse.ArgumentParser(description="Setup Mental Health Analytics Backend")
    parser.add_argument("--full-setup", action="store_true", 
                       help="Run complete setup (environment, database, migrations)")
    parser.add_argument("--env-only", action="store_true", 
                       help="Set up environment only")
    parser.add_argument("--db-only", action="store_true", 
                       help="Set up database only")
    parser.add_argument("--create-migration", action="store_true", 
                       help="Create initial database migration")
    parser.add_argument("--test", action="store_true", 
                       help="Run test suite")
    parser.add_argument("--start", action="store_true", 
                       help="Start development server")
    
    args = parser.parse_args()
    
    print("🧠 Mental Health Analytics Backend Setup")
    print("=" * 50)
    
    # Check requirements first
    if not check_requirements():
        sys.exit(1)
    
    if args.full_setup or not any([args.env_only, args.db_only, args.create_migration, args.test, args.start]):
        # Full setup
        print("\n🔧 Running full setup...")
        
        if not setup_environment():
            print("❌ Environment setup failed")
            sys.exit(1)
        
        if not setup_database():
            print("❌ Database setup failed")
            sys.exit(1)
        
        if not setup_redis():
            print("❌ Redis setup failed")
            sys.exit(1)
        
        print("\n✅ Setup completed successfully!")
        print("\n🚀 To start the server, run: python setup.py --start")
        
    elif args.env_only:
        if not setup_environment():
            sys.exit(1)
        print("✅ Environment setup completed!")
        
    elif args.db_only:
        if not setup_database():
            sys.exit(1)
        print("✅ Database setup completed!")
        
    elif args.create_migration:
        if not create_initial_migration():
            sys.exit(1)
        print("✅ Initial migration created!")
        
    elif args.test:
        if not run_tests():
            sys.exit(1)
        print("✅ All tests passed!")
        
    elif args.start:
        start_development_server()


if __name__ == "__main__":
    main() 