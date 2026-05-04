"""
GUI Routes - Web-based dashboard with tabbed interface
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import json

router = APIRouter()

# Setup templates
templates_path = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_path))


@router.get("/")
async def dashboard(request: Request):
    """Main dashboard page"""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "title": "Enterprise Agentic AI Platform"}
    )


@router.get("/status", response_class=JSONResponse)
async def api_status():
    """Get platform status for GUI"""
    return {
        "status": "running",
        "services": {
            "api": "healthy",
            "redis": "connected",
            "database": "connected",
            "otel": "active",
            "prometheus": "active",
            "grafana": "active"
        },
        "agents": {
            "total": 0,
            "active": 0,
            "experiments": 0
        },
        "metrics": {
            "requests_total": 0,
            "avg_response_time_ms": 0,
            "cache_hit_rate": 0
        }
    }
