#!/usr/bin/env python3
"""
Setup script for the STT API with Emo Buddy integration
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv, set_key

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} is compatible")
    return True

def setup_environment():
    """Setup environment variables"""
    print("\n🔧 Setting up environment variables...")
    
    env_path = Path(".env")
    
    # Check if .env exists
    if env_path.exists():
        load_dotenv(env_path)
        print("✅ Found existing .env file")
    else:
        print("📄 Creating new .env file")
        env_path.touch()
    
    # Check for required API keys
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not groq_key:
        print("\n🔑 GROQ_API_KEY not found")
        print("   Get your API key from: https://console.groq.com")
        groq_key = input("   Enter your Groq API key: ").strip()
        if groq_key:
            set_key(env_path, "GROQ_API_KEY", groq_key)
            print("✅ GROQ_API_KEY saved")
        else:
            print("⚠️  GROQ_API_KEY skipped (required for wellness advice)")
    else:
        print("✅ GROQ_API_KEY found")
    
    if not gemini_key:
        print("\n🔑 GEMINI_API_KEY not found")
        print("   Get your API key from: https://aistudio.google.com/app/apikey")
        gemini_key = input("   Enter your Gemini API key: ").strip()
        if gemini_key:
            set_key(env_path, "GEMINI_API_KEY", gemini_key)
            print("✅ GEMINI_API_KEY saved")
        else:
            print("⚠️  GEMINI_API_KEY skipped (required for Emo Buddy)")
    else:
        print("✅ GEMINI_API_KEY found")
    
    return groq_key is not None, gemini_key is not None

def check_dependencies():
    """Check if required dependencies are installed"""
    print("\n📦 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "transformers",
        "torch",
        "vosk",
        "groq",
        "google-generativeai",
        "faiss-cpu",
        "sentence-transformers",
        "python-dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("   Install with: pip install -r requirements.txt")
        return False
    
    return True

def check_model_files():
    """Check if Vosk model files exist"""
    print("\n🤖 Checking model files...")
    
    model_path = Path("../vosk-model-small-en-us-0.15")
    if model_path.exists():
        print("✅ Vosk model found")
        return True
    else:
        print("❌ Vosk model not found")
        print("   Download from: https://alphacephei.com/vosk/models")
        print("   Extract to: stt/vosk-model-small-en-us-0.15/")
        return False

def test_imports():
    """Test if key modules can be imported"""
    print("\n🧪 Testing imports...")
    
    try:
        sys.path.insert(0, os.path.abspath(".."))
        from emotion_analyzer import load_models
        print("✅ emotion_analyzer imported successfully")
        
        # Test Emo Buddy import
        sys.path.insert(0, os.path.abspath("../.."))
        from emo_buddy.emo_buddy_agent import EmoBuddyAgent
        print("✅ EmoBuddyAgent imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 STT API with Emo Buddy Setup")
    print("=" * 50)
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Setup environment
    groq_ok, gemini_ok = setup_environment()
    if not groq_ok or not gemini_ok:
        success = False
    
    # Check dependencies
    if not check_dependencies():
        success = False
    
    # Check model files
    if not check_model_files():
        success = False
    
    # Test imports
    if not test_imports():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Setup completed successfully!")
        print("\n🚀 Start the API with:")
        print("   python main.py")
        print("\n🧪 Test the API with:")
        print("   python test_emo_buddy_api.py")
    else:
        print("❌ Setup incomplete. Please fix the issues above.")
        print("\n📋 Common solutions:")
        print("   • Install dependencies: pip install -r requirements.txt")
        print("   • Download Vosk model from https://alphacephei.com/vosk/models")
        print("   • Get API keys from console.groq.com and aistudio.google.com")

if __name__ == "__main__":
    main() 