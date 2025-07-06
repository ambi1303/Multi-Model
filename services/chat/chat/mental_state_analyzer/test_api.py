#!/usr/bin/env python3
"""
Simple test script for the Chat Analysis API
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8003"

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("Health check passed!\n")

def test_metrics():
    """Test the metrics endpoint"""
    print("Testing metrics endpoint...")
    response = requests.get(f"{BASE_URL}/metrics")
    print(f"Status: {response.status_code}")
    print(f"Got {len(response.text)} bytes of metrics data")
    assert response.status_code == 200
    print("Metrics check passed!\n")

def test_single_message():
    """Test the single message analysis endpoint"""
    print("Testing single message analysis...")
    payload = {
        "text": "I'm feeling very happy today!",
        "person_id": "test_user"
    }
    response = requests.post(f"{BASE_URL}/analyze/single", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("Single message analysis passed!\n")

def load_test(num_requests=10):
    """Simple load test for the API"""
    print(f"Running load test with {num_requests} requests...")
    start_time = time.time()
    
    for i in range(num_requests):
        payload = {
            "text": f"Test message {i} with different emotions: happy, sad, angry, surprised!",
            "person_id": f"load_test_user_{i}"
        }
        response = requests.post(f"{BASE_URL}/analyze/single", json=payload)
        if response.status_code != 200:
            print(f"Request {i} failed with status {response.status_code}")
    
    total_time = time.time() - start_time
    print(f"Load test completed in {total_time:.2f} seconds")
    print(f"Average response time: {total_time / num_requests:.2f} seconds\n")

if __name__ == "__main__":
    try:
        test_health()
        test_metrics()
        test_single_message()
        
        # Run load test if specified
        if len(sys.argv) > 1 and sys.argv[1] == "--load-test":
            num_requests = 10
            if len(sys.argv) > 2:
                num_requests = int(sys.argv[2])
            load_test(num_requests)
            
        print("All tests passed!")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the API. Make sure it's running on http://localhost:8003")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Test failed - {str(e)}")
        sys.exit(1) 