#!/usr/bin/env python3
"""
Simple test script for the Survey Analysis API
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8004"

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

def test_predict():
    """Test the predict endpoint"""
    print("Testing predict endpoint...")
    payload = {
        "designation": 3,
        "resource_allocation": 7,
        "mental_fatigue_score": 6,
        "company_type": "Service",
        "wfh_setup_available": "Yes",
        "gender": "Male"
    }
    response = requests.post(f"{BASE_URL}/predict", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("Prediction passed!\n")

def test_analyze_survey():
    """Test the analyze-survey endpoint"""
    print("Testing analyze-survey endpoint...")
    payload = {
        "employee": {
            "designation": 3,
            "resource_allocation": 7,
            "mental_fatigue_score": 6,
            "company_type": "Service",
            "wfh_setup_available": "Yes",
            "gender": "Male"
        },
        "survey": {
            "q1": 3,
            "q2": 4,
            "q3": 4,
            "q4": 2,
            "q5": 3,
            "q6": 4,
            "q7": 2,
            "q8": 3,
            "q9": 3,
            "q10": 2
        },
        "employee_id": "test_user_123"
    }
    response = requests.post(f"{BASE_URL}/analyze-survey", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("Survey analysis passed!\n")

def load_test(num_requests=10):
    """Simple load test for the API"""
    print(f"Running load test with {num_requests} requests...")
    start_time = time.time()
    
    for i in range(num_requests):
        payload = {
            "designation": 3,
            "resource_allocation": 7,
            "mental_fatigue_score": 6,
            "company_type": "Service",
            "wfh_setup_available": "Yes",
            "gender": "Male"
        }
        response = requests.post(f"{BASE_URL}/predict", json=payload)
        if response.status_code != 200:
            print(f"Request {i} failed with status {response.status_code}")
    
    total_time = time.time() - start_time
    print(f"Load test completed in {total_time:.2f} seconds")
    print(f"Average response time: {total_time / num_requests:.2f} seconds\n")

if __name__ == "__main__":
    try:
        test_health()
        test_metrics()
        test_predict()
        test_analyze_survey()
        
        # Run load test if specified
        if len(sys.argv) > 1 and sys.argv[1] == "--load-test":
            num_requests = 10
            if len(sys.argv) > 2:
                num_requests = int(sys.argv[2])
            load_test(num_requests)
            
        print("All tests passed!")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the API. Make sure it's running on http://localhost:8004")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Test failed - {str(e)}")
        sys.exit(1) 