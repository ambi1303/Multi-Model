#!/usr/bin/env python3
"""
Test script for Video Emotion Analysis API
"""

import requests
import argparse
import os
import time
from pathlib import Path

def test_health_endpoint(base_url):
    """Test the health check endpoint"""
    print("\n--- Testing Health Check Endpoint ---")
    response = requests.get(f"{base_url}/health")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ Health check endpoint working")

def test_metrics_endpoint(base_url):
    """Test the Prometheus metrics endpoint"""
    print("\n--- Testing Metrics Endpoint ---")
    response = requests.get(f"{base_url}/metrics")
    print(f"Status code: {response.status_code}")
    print(f"Response contains {len(response.text)} characters")
    assert response.status_code == 200
    assert "video_requests_total" in response.text
    print("✅ Metrics endpoint working")

def test_emotion_analysis(base_url, image_path):
    """Test the emotion analysis endpoint with an image"""
    print("\n--- Testing Emotion Analysis Endpoint ---")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    with open(image_path, "rb") as img_file:
        files = {"file": (os.path.basename(image_path), img_file, "image/jpeg")}
        start_time = time.time()
        response = requests.post(f"{base_url}/analyze-emotion", files=files)
        elapsed = time.time() - start_time
        
    print(f"Status code: {response.status_code}")
    print(f"Response time: {elapsed:.2f} seconds")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Dominant emotion: {result.get('dominant_emotion', 'N/A')}")
        print(f"Emotion scores: {result.get('emotion_scores', {})}")
        print("✅ Emotion analysis working")
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Test the Video Emotion Analysis API")
    parser.add_argument("--url", default="http://localhost:8001", help="Base URL of the API")
    parser.add_argument("--image", help="Path to an image file for testing emotion analysis")
    args = parser.parse_args()
    
    print(f"Testing API at {args.url}")
    
    # Test health endpoint
    test_health_endpoint(args.url)
    
    # Test metrics endpoint
    test_metrics_endpoint(args.url)
    
    # Test emotion analysis if image provided
    if args.image:
        test_emotion_analysis(args.url, args.image)
    else:
        print("\n⚠️ No image provided, skipping emotion analysis test")
        print("To test emotion analysis, use --image parameter")

if __name__ == "__main__":
    main() 