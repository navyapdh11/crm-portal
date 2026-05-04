"""
Prometheus Metrics Collection
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client import CollectorRegistry
from fastapi import Request, Response
from functools import wraps
import time
import logging

logger = logging.getLogger(__name__)

# Create custom registry
registry = CollectorRegistry()

# HTTP Metrics
HTTP_REQUESTS_TOTAL = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

HTTP_REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=registry
)

HTTP_REQUESTS_IN_PROGRESS = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently in progress',
    ['method', 'endpoint'],
    registry=registry
)

# Agent Metrics
AGENT_ITERATIONS_TOTAL = Counter(
    'agent_iterations_total',
    'Total agent iterations',
    ['agent_name', 'agent_type', 'status'],
    registry=registry
)

AGENT_EXPERIMENT_ACCURACY = Gauge(
    'agent_experiment_accuracy',
    'Current experiment accuracy',
    ['agent_name', 'experiment_id'],
    registry=registry
)

AGENT_ACTIVE_EXPERIMENTS = Gauge(
    'agent_active_experiments',
    'Number of active experiments',
    ['agent_type'],
    registry=registry
)

# RAG Metrics
RAG_QUERIES_TOTAL = Counter(
    'rag_queries_total',
    'Total RAG queries',
    ['status'],
    registry=registry
)

RAG_RETRIEVAL_TIME = Histogram(
    'rag_retrieval_time_seconds',
    'RAG document retrieval time',
    registry=registry
)

RAG_DOCUMENTS_COUNT = Gauge(
    'rag_documents_count',
    'Number of documents in RAG store',
    registry=registry
)

# Cache Metrics
CACHE_HITS = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type'],
    registry=registry
)

CACHE_MISSES = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type'],
    registry=registry
)

CACHE_SIZE = Gauge(
    'cache_size',
    'Current cache size',
    ['cache_type'],
    registry=registry
)

# MCP Metrics
MCP_TOOL_CALLS_TOTAL = Counter(
    'mcp_tool_calls_total',
    'Total MCP tool calls',
    ['tool_name', 'status'],
    registry=registry
)

MCP_TOOL_EXECUTION_TIME = Histogram(
    'mcp_tool_execution_time_seconds',
    'MCP tool execution time',
    ['tool_name'],
    registry=registry
)

# Database Metrics
DB_QUERY_TIME = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['operation'],
    registry=registry
)

DB_CONNECTIONS_ACTIVE = Gauge(
    'db_connections_active',
    'Active database connections',
    registry=registry
)

# System Metrics
SYSTEM_UPTIME = Gauge(
    'system_uptime_seconds',
    'System uptime in seconds',
    registry=registry
)


def setup_metrics(settings):
    """Setup metrics collection"""
    import atexit
    start_time = time.time()
    
    def update_uptime():
        SYSTEM_UPTIME.set(time.time() - start_time)
    
    # Update uptime periodically
    import threading
    def uptime_timer():
        update_uptime()
        threading.Timer(60.0, uptime_timer).start()
    
    uptime_timer()
    logger.info("Prometheus metrics setup complete")


async def metrics_middleware(request: Request, call_next):
    """Middleware to collect HTTP metrics"""
    start_time = time.time()
    
    HTTP_REQUESTS_IN_PROGRESS.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    try:
        response = await call_next(request)
        
        duration = time.time() - start_time
        HTTP_REQUESTS_TOTAL.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        HTTP_REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        return response
    finally:
        HTTP_REQUESTS_IN_PROGRESS.labels(
            method=request.method,
            endpoint=request.url.path
        ).dec()


def get_metrics():
    """Get current metrics in Prometheus format"""
    return generate_latest(registry)
