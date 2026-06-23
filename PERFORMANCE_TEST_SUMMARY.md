# PromptPilot Performance & Load Test Summary

**Server Status:** STABLE
**Concurrency Target:** 500 total requests processed by concurrent workers

## Load Test Metrics

| Metric | Measured Value | Target Threshold | Status |
|--------|----------------|------------------|--------|
| **Total Requests Sent** | 500 | 500 | ✅ PASS |
| **Successful Requests** | 500 | N/A | info |
| **Failed Requests** | 0 | 0 | ✅ PASS |
| **Success Rate** | 100.0% | 100.0% | ✅ PASS |
| **Average RPS** | 333.1 req/sec | >= 80 req/sec | ✅ PASS |
| **Min Response Time** | 0.2 ms | N/A | info |
| **Max Response Time** | 1.1 ms | < 2000 ms | ✅ PASS |
| **Average Response Time** | 0.6 ms | < 300 ms | ✅ PASS |

## Test Parameters
- **Concurrent Users:** 20 threads
- **Request Target:** exactly 500 requests total
- **Endpoints Targeted:** `GET /health` and `POST /search`
- **Execution Timestamp:** 2026-06-24 05:25:52

## Artifact Outputs
- Excel spreadsheet: `selenium_tests/reports/performance_load_report.xlsx`
