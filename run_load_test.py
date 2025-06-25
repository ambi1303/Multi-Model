#!/usr/bin/env python3
"""
Load testing script for all backend services
This script runs a load test on all backend services and reports the results.
"""

import requests
import json
import sys
import time
import argparse
from tabulate import tabulate
from colorama import Fore, Style, init

# Initialize colorama
init()

def run_load_test(test_type="all", iterations=5, timeout=120):
    """Run a load test on the integrated backend"""
    print(f"{Fore.CYAN}Running load test with type={test_type}, iterations={iterations}...{Style.RESET_ALL}")
    
    url = "http://localhost:9000/load-test"
    payload = {
        "test_type": test_type,
        "iterations": iterations
    }
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=timeout)
        total_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"{Fore.GREEN}Load test completed successfully in {total_time:.2f} seconds{Style.RESET_ALL}")
            
            # Extract results by service
            results_by_service = {}
            for result in data.get("results", []):
                service = result.get("service")
                if service not in results_by_service:
                    results_by_service[service] = {
                        "success": 0,
                        "error": 0,
                        "total_time": 0,
                        "count": 0
                    }
                
                if result.get("status") == "success":
                    results_by_service[service]["success"] += 1
                    results_by_service[service]["total_time"] += result.get("time", 0)
                else:
                    results_by_service[service]["error"] += 1
                
                results_by_service[service]["count"] += 1
            
            # Calculate averages and success rates
            table_data = []
            for service, stats in results_by_service.items():
                success_rate = (stats["success"] / stats["count"]) * 100 if stats["count"] > 0 else 0
                avg_time = stats["total_time"] / stats["success"] if stats["success"] > 0 else 0
                
                status_color = Fore.GREEN if success_rate >= 90 else (Fore.YELLOW if success_rate >= 70 else Fore.RED)
                
                table_data.append([
                    service,
                    f"{stats['success']}/{stats['count']}",
                    f"{status_color}{success_rate:.1f}%{Style.RESET_ALL}",
                    f"{avg_time:.2f} sec"
                ])
            
            print("\n" + tabulate(
                table_data,
                headers=["Service", "Success/Total", "Success Rate", "Avg Response Time"],
                tablefmt="grid"
            ))
            
            # Print summary
            summary = data.get("summary", {})
            print(f"\n{Fore.CYAN}Summary:{Style.RESET_ALL}")
            print(f"Total Requests: {summary.get('total_requests', 0)}")
            print(f"Success Count: {summary.get('success_count', 0)}")
            print(f"Error Count: {summary.get('error_count', 0)}")
            print(f"Success Rate: {summary.get('success_rate', 0):.1f}%")
            print(f"Average Time: {summary.get('average_time', 0):.2f} seconds")
            
            return 0
        else:
            print(f"{Fore.RED}Load test failed with status code: {response.status_code}{Style.RESET_ALL}")
            print(response.text)
            return 1
    except requests.RequestException as e:
        print(f"{Fore.RED}Error running load test: {e}{Style.RESET_ALL}")
        return 1

def main():
    """Main function to run a load test"""
    parser = argparse.ArgumentParser(description="Run a load test on the backend services")
    parser.add_argument("--type", choices=["all", "video", "speech", "chat", "survey"], 
                        default="all", help="Type of test to run")
    parser.add_argument("--iterations", type=int, default=5, 
                        help="Number of iterations per service (max 20)")
    parser.add_argument("--timeout", type=int, default=120,
                        help="Timeout in seconds for the load test")
    
    args = parser.parse_args()
    
    return run_load_test(args.type, min(args.iterations, 20), args.timeout)

if __name__ == "__main__":
    sys.exit(main()) 