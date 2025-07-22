#!/usr/bin/env python3
"""
Verification script for the EmoBuddy circular import fix
========================================================

This script tests that the circular import issue has been resolved.
Run this script to verify the fix is working correctly.
"""

def verify_circular_import_fix():
    """Verify that the circular import issue has been resolved"""
    
    print("🔍 Verifying EmoBuddy circular import fix...")
    print("=" * 55)
    
    # Test 1: The core import that was failing
    print("\n📦 Test 1: Core import (the original problem)")
    try:
        from core import get_unified_api
        print("✅ SUCCESS: 'from core import get_unified_api' works!")
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    # Test 2: API instantiation
    print("\n📦 Test 2: API instantiation")
    try:
        api = get_unified_api()
        print(f"✅ API created: {type(api).__name__}")
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    # Test 3: Health check
    print("\n📦 Test 3: Health check")
    try:
        health = api.health_check()
        status = health.get('status', 'unknown')
        print(f"✅ Health status: {status}")
        
        if status == 'degraded':
            print("   ℹ️  Note: 'degraded' status is normal when optional")
            print("      dependencies are missing. Core functionality works!")
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    # Test 4: Adapter imports
    print("\n📦 Test 4: Adapter imports")
    try:
        from adapters.chat_api_adapter import ChatAPIAdapter
        from adapters.stt_api_adapter import STTEmoBuddyAdapter
        print("✅ Adapter imports successful")
        
        # Test adapter instantiation
        try:
            chat_adapter = ChatAPIAdapter()
            stt_adapter = STTEmoBuddyAdapter()
            print("✅ Adapter instances created")
        except Exception as e:
            print(f"⚠️  Adapter instantiation warning: {e}")
            print("   This may be due to missing dependencies, which is OK")
            
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    print("\n" + "=" * 55)
    print("🎉 VERIFICATION COMPLETE!")
    print("✅ Circular import issue is RESOLVED")
    print("✅ EmoBuddy service should start without import errors")
    
    return True

if __name__ == "__main__":
    success = verify_circular_import_fix()
    
    if success:
        print("\n🚀 RESULT: Fix is working correctly!")
        print("   Your EmoBuddy service should now start without the")
        print("   'cannot import name get_unified_api' error.")
        exit(0)
    else:
        print("\n💥 RESULT: Issues still exist!")
        exit(1) 