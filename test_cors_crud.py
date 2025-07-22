#!/usr/bin/env python3
"""
Test CORS and CRUD operations functionality
"""
import requests
import json

def test_cors_and_crud():
    """Test CORS preflight and CRUD operations"""
    
    base_url = "http://localhost:9000"
    
    print("🧪 Testing CORS and CRUD Operations")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    print("\n1. 🏥 Testing Backend Health...")
    try:
        health_response = requests.get(f"{base_url}/health")
        print(f"   ✅ Backend Health: {health_response.status_code}")
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"   📊 Status: {health_data.get('status', 'unknown')}")
    except Exception as e:
        print(f"   ❌ Backend Health Failed: {e}")
        return
    
    # Test 2: CORS Preflight for OPTIONS /users/{id}
    print("\n2. 🌐 Testing CORS Preflight...")
    try:
        options_response = requests.options(
            f"{base_url}/users/test-id",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "PUT",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            }
        )
        print(f"   ✅ OPTIONS Request: {options_response.status_code}")
        print(f"   🔧 CORS Headers: {dict(options_response.headers)}")
        
        # Check important CORS headers
        cors_headers = options_response.headers
        if "access-control-allow-origin" in cors_headers:
            print(f"   🎯 Allow-Origin: {cors_headers['access-control-allow-origin']}")
        if "access-control-allow-methods" in cors_headers:
            print(f"   🔧 Allow-Methods: {cors_headers['access-control-allow-methods']}")
            
    except Exception as e:
        print(f"   ❌ CORS Preflight Failed: {e}")
    
    # Test 3: Try to login (to get a token for CRUD tests)
    print("\n3. 🔐 Testing Login...")
    try:
        login_data = {
            "email": "admin@company.com",
            "password": "admin123"
        }
        login_response = requests.post(f"{base_url}/auth/login", json=login_data)
        print(f"   ✅ Login Response: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("access_token")
            if token:
                print("   🎟️ Token obtained successfully")
                
                # Test 4: Test CRUD Operations with token
                print("\n4. 🛠️ Testing CRUD Operations...")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test GET /users
                try:
                    users_response = requests.get(f"{base_url}/users", headers=headers)
                    print(f"   📋 GET /users: {users_response.status_code}")
                    if users_response.status_code == 200:
                        users_data = users_response.json()
                        print(f"   👥 Found {len(users_data)} users")
                except Exception as e:
                    print(f"   ❌ GET /users failed: {e}")
                
            else:
                print("   ❌ No token in login response")
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"   ❌ Login Failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 CORS and CRUD Test Complete!")
    print("\n📌 Summary:")
    print("   • Backend should be responding on port 9000")
    print("   • CORS should allow all origins (*)")
    print("   • OPTIONS requests should return 200 OK")
    print("   • CRUD operations should work with proper authentication")
    print("\n🌐 Frontend URL: http://localhost:5173")
    print("🔧 Backend URL: http://localhost:9000")

if __name__ == "__main__":
    test_cors_and_crud() 