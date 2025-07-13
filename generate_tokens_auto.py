#!/usr/bin/env python3
"""Automated service token generation"""

import os
import sys
import requests
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

def generate_and_save_service_tokens():
    """Generate and save service tokens automatically"""
    
    core_url = "http://localhost:8000"
    admin_email = "ambikesh@example.com"
    admin_password = "Ambikesh@123"
    
    logger.info("🔐 Starting automated service token generation...")
    
    # 1. Login to get admin token
    try:
        login_response = requests.post(
            f"{core_url}/auth/login",
            json={"email": admin_email, "password": admin_password},
            timeout=10
        )
        
        if login_response.status_code != 200:
            logger.error(f"❌ Admin login failed: {login_response.status_code}")
            logger.error(f"Response: {login_response.text}")
            return False
            
        admin_token = login_response.json()["access_token"]
        logger.info("✅ Admin login successful")
        
    except Exception as e:
        logger.error(f"❌ Error during login: {e}")
        return False
    
    # 2. Generate service tokens
    service_names = ["stt", "emo_buddy", "video", "chat", "survey"]
    service_tokens = {}
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    for service_name in service_names:
        try:
            token_response = requests.post(
                f"{core_url}/auth/service-token",
                params={"service_name": service_name},
                headers=headers,
                timeout=10
            )
            
            if token_response.status_code == 200:
                service_token = token_response.json()["access_token"]
                service_tokens[service_name] = service_token
                logger.info(f"✅ Generated token for {service_name}")
            else:
                logger.error(f"❌ Failed to generate token for {service_name}: {token_response.text}")
                
        except Exception as e:
            logger.error(f"❌ Error generating token for {service_name}: {e}")
    
    if not service_tokens:
        logger.error("❌ No tokens were generated successfully")
        return False
    
    # 3. Save tokens to .env files
    service_paths = {
        "stt": "services/stt/api/.env",
        "emo_buddy": "services/emo_buddy/.env",
        "video": "services/video/emp_face/.env",
        "chat": "services/chat/chat/mental_state_analyzer/.env",
        "survey": "services/survey/survey/.env"
    }
    
    for service_name, token in service_tokens.items():
        if service_name in service_paths:
            env_path = service_paths[service_name]
            
            try:
                # Read existing .env file
                if os.path.exists(env_path):
                    with open(env_path, 'r') as f:
                        lines = f.readlines()
                else:
                    lines = []
                
                # Update or add SERVICE_AUTH_TOKEN
                token_line = f"SERVICE_AUTH_TOKEN={token}\n"
                token_found = False
                
                for i, line in enumerate(lines):
                    if line.startswith('SERVICE_AUTH_TOKEN='):
                        lines[i] = token_line
                        token_found = True
                        break
                
                if not token_found:
                    lines.append(token_line)
                
                # Write back to file
                os.makedirs(os.path.dirname(env_path), exist_ok=True)
                with open(env_path, 'w') as f:
                    f.writelines(lines)
                
                logger.info(f"✅ Saved token for {service_name} to {env_path}")
                
            except Exception as e:
                logger.error(f"❌ Error saving token for {service_name}: {e}")
    
    logger.info("🎉 Service token generation completed!")
    return True

if __name__ == "__main__":
    success = generate_and_save_service_tokens()
    sys.exit(0 if success else 1) 