#!/usr/bin/env python3
"""
Script to generate service tokens for inter-service authentication.
This script creates JWT tokens that allow services to communicate with the core service.
"""

import os
import sys
import requests
import json
from getpass import getpass

def generate_service_token():
    """Generate a service token using the core service API"""
    
    # Get core service URL
    core_url = input("Enter core service URL (default: http://localhost:8000): ").strip()
    if not core_url:
        core_url = "http://localhost:8000"
    
    # Get admin credentials
    print("\nEnter admin credentials to generate service token:")
    email = input("Admin email: ").strip()
    password = getpass("Admin password: ")
    
    # Login to get admin token
    try:
        login_response = requests.post(
            f"{core_url}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return None
            
        admin_token = login_response.json()["access_token"]
        print("✅ Admin login successful")
        
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None
    
    # Generate service tokens
    services = ["stt", "emo_buddy", "video", "chat", "survey"]
    tokens = {}
    
    for service in services:
        try:
            service_response = requests.post(
                f"{core_url}/auth/service-token",
                headers={"Authorization": f"Bearer {admin_token}"},
                params={"service_name": service},
                timeout=10
            )
            
            if service_response.status_code == 200:
                service_token = service_response.json()["access_token"]
                tokens[service] = service_token
                print(f"✅ Generated token for {service} service")
            else:
                print(f"❌ Failed to generate token for {service}: {service_response.text}")
                
        except Exception as e:
            print(f"❌ Error generating token for {service}: {e}")
    
    if tokens:
        print("\n🔑 Service Tokens Generated:")
        print("=" * 50)
        
        for service, token in tokens.items():
            print(f"\n{service.upper()}_SERVICE_TOKEN:")
            print(f"{token}")
        
        print("\n📝 Environment Variable Setup:")
        print("Add these to your service .env files:")
        print("=" * 50)
        
        for service, token in tokens.items():
            print(f"\nFor services/{service}/.env:")
            print(f"SERVICE_AUTH_TOKEN={token}")
        
        # Save to files
        save_choice = input("\nSave tokens to files? (y/N): ").strip().lower()
        if save_choice == 'y':
            for service, token in tokens.items():
                service_dir = f"services/{service}"
                if os.path.exists(service_dir):
                    env_file = f"{service_dir}/.env"
                    
                    # Read existing .env file if it exists
                    env_content = ""
                    if os.path.exists(env_file):
                        with open(env_file, 'r') as f:
                            env_content = f.read()
                    
                    # Update or add SERVICE_AUTH_TOKEN
                    lines = env_content.split('\n')
                    updated = False
                    
                    for i, line in enumerate(lines):
                        if line.startswith('SERVICE_AUTH_TOKEN='):
                            lines[i] = f"SERVICE_AUTH_TOKEN={token}"
                            updated = True
                            break
                    
                    if not updated:
                        lines.append(f"SERVICE_AUTH_TOKEN={token}")
                    
                    # Write back to file
                    with open(env_file, 'w') as f:
                        f.write('\n'.join(lines))
                    
                    print(f"✅ Updated {env_file}")
                else:
                    print(f"⚠️  Service directory {service_dir} not found")
        
        return tokens
    else:
        print("❌ No tokens were generated successfully")
        return None

if __name__ == "__main__":
    print("🔐 Service Token Generator")
    print("=" * 30)
    
    tokens = generate_service_token()
    
    if tokens:
        print("\n🎉 Service token generation completed!")
        print("\n📋 Next steps:")
        print("1. Update service .env files with the generated tokens")
        print("2. Restart all services")
        print("3. Test inter-service communication")
    else:
        print("\n❌ Service token generation failed")
        sys.exit(1) 