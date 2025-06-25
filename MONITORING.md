# Performance Monitoring Implementation

This document describes the performance monitoring and profiling capabilities implemented across all services in the Multi-Modal Emotion Analysis System.

## Overview

We've implemented comprehensive performance monitoring across all microservices:
- Video Analysis Service (port 8001)
- Speech Analysis Service (port 8002)
- Chat Analysis Service (port 8003)
- Survey Analysis Service (port 8004)
- Integrated Backend Service (port 9000)

## Monitoring Features

### 1. Prometheus Metrics

All services expose Prometheus metrics at the `/metrics` endpoint, including:
- Request counts by endpoint
- Processing time histograms
- Error counts by type and endpoint
- Memory and CPU usage

Example:
```bash
curl http://localhost:9000/metrics
```

### 2. Health Check Endpoints

All services provide health check endpoints at `/health` that return:
- Service status
- Backend availability (for integrated service)
- System resource usage

Example:
```bash
curl http://localhost:9000/health
```

### 3. Profiling Capabilities

The Speech Analysis Service (STT) includes advanced profiling capabilities:

#### On-demand Request Profiling
Profile a specific request by adding the `profile=true` query parameter:
```bash
curl -X POST "http://localhost:8002/analyze-speech?profile=true" -F "audio_file=@your_audio.wav"
```

#### System-wide Profiling Report
Get a comprehensive profiling report of the system:
```bash
curl http://localhost:8002/profile-report
```

### 4. Load Testing

The Integrated Backend includes a load testing endpoint for performance testing:

```bash
curl -X POST http://localhost:9000/load-test -H "Content-Type: application/json" -d '{"test_type": "all", "iterations": 5}'
```

Options for `test_type`:
- `all`: Test all services
- `video`: Test only video service
- `speech`: Test only speech service
- `chat`: Test only chat service
- `survey`: Test only survey service

## Monitoring Tools

We've created two utility scripts to help with monitoring:

### 1. Health Check Script

The `check_health.py` script checks the health of all services and displays their status:

```bash
python check_health.py
```

### 2. Load Testing Script

The `run_load_test.py` script runs a load test on all services and reports the results:

```bash
python run_load_test.py --type all --iterations 5
```

## Dependencies

The monitoring system requires the following dependencies:
- prometheus_client
- psutil
- requests
- tabulate
- colorama

Install them using:
```bash
pip install -r monitoring_requirements.txt
```

## Implementation Details

### Prometheus Metrics

Each service implements the following metrics:
- `*_requests_total`: Counter for total requests by endpoint
- `*_processing_seconds`: Histogram for processing time by endpoint
- `*_errors_total`: Counter for errors by endpoint and error type
- `*_memory_usage_bytes`: Gauge for memory usage
- `*_cpu_usage_percent`: Gauge for CPU usage

### System Resource Monitoring

All services use the `psutil` library to monitor:
- Memory usage
- CPU usage
- Process information

### Health Checks

Health check endpoints provide:
- Service status
- Uptime information
- Backend availability (for integrated service)
- System resource usage

### Profiling

The STT service uses Python's `cProfile` module to provide:
- Function-level profiling
- Time spent in each function
- Call counts
- Cumulative time

## Future Improvements

1. **Centralized Monitoring Dashboard**: Implement a Grafana or Prometheus dashboard to visualize metrics
2. **Alerting**: Add alerting capabilities for critical metrics
3. **Distributed Tracing**: Implement distributed tracing using OpenTelemetry
4. **Log Aggregation**: Centralize logs from all services
5. **Automated Performance Testing**: Implement CI/CD pipeline for performance testing 