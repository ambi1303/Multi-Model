#!/usr/bin/env python3
"""
Test script for Integrated Analysis API
"""

import requests
import argparse
import json
import time
import os
from datetime import datetime

def test_health_endpoint(base_url):
    """Test the health check endpoint"""
    print("\n--- Testing Health Check Endpoint ---")
    response = requests.get(f"{base_url}/health")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {data.get('status')}")
        print(f"Version: {data.get('version')}")
        print(f"Uptime: {data.get('uptime', 0):.2f} seconds")
        print(f"Backend status: {data.get('backends', {})}")
        print(f"System: {data.get('system', {})}")
        print("✅ Health check endpoint working")
        return True
    else:
        print(f"❌ Health check failed: {response.text}")
        return False

def test_metrics_endpoint(base_url):
    """Test the Prometheus metrics endpoint"""
    print("\n--- Testing Metrics Endpoint ---")
    response = requests.get(f"{base_url}/metrics")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        metrics = response.text
        print(f"Response contains {len(metrics)} characters")
        metrics_sample = metrics.split("\n")[:5]
        print("Sample metrics:")
        for line in metrics_sample:
            if line.strip():
                print(f"  {line}")
        print("✅ Metrics endpoint working")
        return True
    else:
        print(f"❌ Metrics endpoint failed: {response.text}")
        return False

def test_chat_analysis(base_url, text):
    """Test the chat analysis endpoint"""
    print("\n--- Testing Chat Analysis Endpoint ---")
    payload = {
        "text": text,
        "person_id": "test_user"
    }
    print(f"Sending payload: {payload}")
    
    start_time = time.time()
    response = requests.post(f"{base_url}/analyze-chat", json=payload)
    elapsed = time.time() - start_time
    
    print(f"Status code: {response.status_code}")
    print(f"Response time: {elapsed:.2f} seconds")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        print("✅ Chat analysis working")
        return True
    else:
        print(f"❌ Chat analysis failed: {response.text}")
        return False

def test_survey_analysis(base_url):
    """Test the survey analysis endpoint"""
    print("\n--- Testing Survey Analysis Endpoint ---")
    payload = {
        "designation": 3,
        "resource_allocation": 7,
        "mental_fatigue_score": 6,
        "company_type": "Service",
        "wfh_setup_available": "Yes",
        "gender": "Male"
    }
    print(f"Sending payload: {payload}")
    
    start_time = time.time()
    response = requests.post(f"{base_url}/analyze-survey", json=payload)
    elapsed = time.time() - start_time
    
    print(f"Status code: {response.status_code}")
    print(f"Response time: {elapsed:.2f} seconds")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        print("✅ Survey analysis working")
        return True
    else:
        print(f"❌ Survey analysis failed: {response.text}")
        return False

def test_dashboard_stats(base_url):
    """Test the dashboard stats endpoint"""
    print("\n--- Testing Dashboard Stats Endpoint ---")
    response = requests.get(f"{base_url}/dashboard-stats")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Stats: {json.dumps(data.get('stats', {}), indent=2)}")
        print(f"Recent emotions: {len(data.get('recent_emotions', []))}")
        print("✅ Dashboard stats endpoint working")
        return True
    else:
        print(f"❌ Dashboard stats failed: {response.text}")
        return False

def test_video_analytics(base_url):
    """Test the video analytics endpoint"""
    print("\n--- Testing Video Analytics Endpoint ---")
    response = requests.get(f"{base_url}/api/video/analytics")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total analyses: {data.get('total_analyses', 0)}")
        print(f"Emotion distribution: {json.dumps(data.get('emotion_distribution', {}), indent=2)}")
        print(f"Recent results: {len(data.get('recent_results', []))}")
        print("✅ Video analytics endpoint working")
        return True
    else:
        print(f"❌ Video analytics failed: {response.text}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Test the Integrated Analysis API")
    parser.add_argument("--url", default="http://localhost:9000", help="Base URL of the API")
    parser.add_argument("--text", default="I'm feeling happy today!", help="Text for chat analysis")
    args = parser.parse_args()
    
    print(f"Testing API at {args.url}")
    print(f"Current time: {datetime.now().isoformat()}")
    
    # Test endpoints
    tests = [
        test_health_endpoint(args.url),
        test_metrics_endpoint(args.url),
        test_chat_analysis(args.url, args.text),
        test_survey_analysis(args.url),
        test_dashboard_stats(args.url),
        test_video_analytics(args.url)
    ]
    
    # Summary
    success = sum(1 for test in tests if test)
    print(f"\n--- Test Summary ---")
    print(f"Passed: {success}/{len(tests)} tests")
    
    if success == len(tests):
        print("✅ All tests passed!")
        return 0
    else:
        print(f"❌ {len(tests) - success} tests failed")
        return 1

if __name__ == "__main__":
    exit(main()) 