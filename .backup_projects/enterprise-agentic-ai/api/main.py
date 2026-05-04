"""
Enterprise Agentic AI Platform - Main FastAPI Application
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging

from core.config import get_settings
try:
    from observability.tracing import setup_tracing
    from observability.metrics import setup_metrics, metrics_middleware
    HAS_OTEL = True
except ImportError:
    HAS_OTEL = False
from api.routes import router as api_router
from api.graphql_router import graphql_router
from gui.routes import router as gui_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"agentic-ai","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Enterprise Agentic AI Platform...")
    settings = get_settings()
    
    # Setup OpenTelemetry (if available)
    if HAS_OTEL:
        setup_tracing(settings)
        setup_metrics(settings)
    
    logger.info(f"Platform started: {settings.APP_NAME} v{settings.APP_VERSION}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down platform...")


# Create FastAPI application
app = FastAPI(
    title="Enterprise Agentic AI Platform",
    description="Enterprise-grade Agentic AI with OpenTelemetry, MCP, RAG, Redis caching, and Grafana dashboards",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware (if available)
if HAS_OTEL:
    app.middleware("http")(metrics_middleware)

# Include routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(graphql_router, prefix="/api/graphql")
app.include_router(gui_router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "agentic-ai-platform",
        "version": "1.0.0"
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    return {"status": "ready"}


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "api.main:app",
        host=settings.GUI_HOST,
        port=settings.GUI_PORT,
        reload=settings.DEBUG
    )
