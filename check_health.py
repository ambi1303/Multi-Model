#!/usr/bin/env python3
"""
Health check script for all backend services
This script checks the health of all backend services and reports their status.
"""

import requests
import json
import sys
import time
from tabulate import tabulate
from colorama import Fore, Style, init

# Initialize colorama
init()

# Service endpoints
SERVICES = [
    {"name": "Video Analysis", "url": "http://localhost:8001/health", "metrics_url": "http://localhost:8001/metrics"},
    {"name": "Speech Analysis", "url": "http://localhost:8002/health", "metrics_url": "http://localhost:8002/metrics"},
    {"name": "Chat Analysis", "url": "http://localhost:8003/health", "metrics_url": "http://localhost:8003/metrics"},
    {"name": "Survey Analysis", "url": "http://localhost:8004/health", "metrics_url": "http://localhost:8004/metrics"},
    {"name": "Integrated Backend", "url": "http://localhost:9000/health", "metrics_url": "http://localhost:9000/metrics"},
]

def check_service(service):
    """Check a single service's health"""
    try:
        start_time = time.time()
        response = requests.get(service["url"], timeout=2)
        latency = (time.time() - start_time) * 1000  # Convert to ms
        
        if response.status_code == 200:
            status = f"{Fore.GREEN}Healthy{Style.RESET_ALL}"
            try:
                data = response.json()
                details = data.get("message", "No details")
            except json.JSONDecodeError:
                details = "Invalid JSON response"
        else:
            status = f"{Fore.RED}Unhealthy{Style.RESET_ALL}"
            details = f"Status code: {response.status_code}"
        
        # Get basic metrics if available
        metrics = "N/A"
        try:
            metrics_response = requests.get(service["metrics_url"], timeout=2)
            if metrics_response.status_code == 200:
                metrics_text = metrics_response.text
                
                # Extract some key metrics
                memory_usage = None
                cpu_usage = None
                
                for line in metrics_text.split('\n'):
                    if "_memory_usage_bytes" in line and not line.startswith('#'):
                        try:
                            memory_usage = float(line.split()[1]) / (1024 * 1024)  # Convert to MB
                        except (IndexError, ValueError):
                            pass
                    elif "_cpu_usage_percent" in line and not line.startswith('#'):
                        try:
                            cpu_usage = float(line.split()[1])
                        except (IndexError, ValueError):
                            pass
                
                if memory_usage is not None and cpu_usage is not None:
                    metrics = f"Memory: {memory_usage:.1f} MB, CPU: {cpu_usage:.1f}%"
        except requests.RequestException:
            pass
            
        return {
            "name": service["name"],
            "status": status,
            "latency": f"{latency:.1f} ms",
            "details": details,
            "metrics": metrics
        }
    except requests.RequestException as e:
        return {
            "name": service["name"],
            "status": f"{Fore.RED}Offline{Style.RESET_ALL}",
            "latency": "N/A",
            "details": str(e),
            "metrics": "N/A"
        }

def main():
    """Main function to check all services"""
    print(f"{Fore.CYAN}Checking health of all services...{Style.RESET_ALL}")
    results = []
    
    for service in SERVICES:
        result = check_service(service)
        results.append([
            result["name"],
            result["status"],
            result["latency"],
            result["details"],
            result["metrics"]
        ])
    
    print("\n" + tabulate(
        results,
        headers=["Service", "Status", "Latency", "Details", "Metrics"],
        tablefmt="grid"
    ))
    
    # Check if all services are healthy
    unhealthy = any("Healthy" not in r[1] for r in results)
    if unhealthy:
        print(f"\n{Fore.RED}Some services are not healthy!{Style.RESET_ALL}")
        return 1
    else:
        print(f"\n{Fore.GREEN}All services are healthy!{Style.RESET_ALL}")
        return 0

if __name__ == "__main__":
    sys.exit(main()) 