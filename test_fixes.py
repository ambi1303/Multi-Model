import os
import sys
import subprocess
import time

def test_import_fix(service_name, service_path, import_statement):
    """Test if import fix worked for specific service"""
    print(f"\n🧪 Testing {service_name}...")
    
    project_root = os.path.abspath(os.path.dirname(__file__))
    full_path = os.path.join(project_root, service_path)
    
    # Setup environment like the startup script
    env = os.environ.copy()
    python_paths = [
        project_root,
        os.path.join(project_root, "services"),
        full_path
    ]
    env["PYTHONPATH"] = os.pathsep.join(python_paths)
    
    # Find Python executable
    python_exec = sys.executable
    for venv_dir in ["venv", ".venv", "env"]:
        venv_path = os.path.join(full_path, venv_dir)
        if os.path.exists(venv_path):
            python_exec = os.path.join(venv_path, "Scripts", "python.exe")
            break
    
    try:
        # Test the import
        result = subprocess.run(
            [python_exec, "-c", import_statement],
            cwd=full_path,
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"✅ {service_name} → Import test passed")
            return True
        else:
            print(f"❌ {service_name} → Import failed:")
            print(f"   Error: {result.stderr.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {service_name} → Import test timed out")
        return False
    except Exception as e:
        print(f"❌ {service_name} → Test error: {e}")
        return False

def main():
    """Test all import fixes"""
    print("🧪 TESTING ALL IMPORT FIXES")
    print("=" * 50)
    
    tests = [
        ("Mental State Analyzer", "services/chat/chat/mental_state_analyzer", 
         "import httpx; from src.emotion_detector import EmotionDetector"),
        
        ("Emo Buddy Agent", "services", 
         "from emo_buddy.api import app"),
        
        ("Speech Analysis API", "services/stt/api", 
         "from services.stt.emotion_analyzer import analyze_text"),
    ]
    
    results = []
    for service_name, service_path, import_statement in tests:
        success = test_import_fix(service_name, service_path, import_statement)
        results.append((service_name, success))
    
    print(f"\n📊 IMPORT TEST RESULTS")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for service_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} → {service_name}")
    
    print(f"\n📈 Summary: {passed}/{total} import tests passed")
    
    if passed == total:
        print(f"\n🎉 All import fixes successful! Ready to start services.")
        print(f"💡 Run: python start_all_services_fixed.py")
    else:
        print(f"\n⚠️  Some imports still failing. Check errors above.")
    
    return passed == total

if __name__ == "__main__":
    main() 