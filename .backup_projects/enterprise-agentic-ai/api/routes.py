"""
API Routes - Enterprise Agentic AI Platform
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import logging
import time

from core.config import get_settings, Settings
try:
    from core.cache import get_cache_manager, CacheManager
    HAS_CACHE = True
except ImportError:
    HAS_CACHE = False
try:
    from rag.engine import get_rag_engine, RAGEngine
    HAS_RAG = True
except ImportError:
    HAS_RAG = False
from agents.autoresearch import create_agent, get_agent, list_agents, AutoresearchAgent
try:
    from mcp_server.server import get_mcp_server, MCPServer
    HAS_MCP = True
except ImportError:
    HAS_MCP = False
try:
    from observability.metrics import get_metrics
    HAS_METRICS = True
except ImportError:
    HAS_METRICS = False

logger = logging.getLogger(__name__)

router = APIRouter()

# Sub-routers
agents_router = APIRouter(prefix="/agents", tags=["Agents"])
experiments_router = APIRouter(prefix="/experiments", tags=["Experiments"])
rag_router = APIRouter(prefix="/rag", tags=["RAG Engine"])
mcp_router = APIRouter(prefix="/mcp", tags=["MCP Tools"])
cache_router = APIRouter(prefix="/cache", tags=["Redis Cache"])
metrics_router = APIRouter(prefix="/metrics", tags=["Metrics"])


# ==================== Agents API ====================

class CreateAgentRequest(BaseModel):
    name: str = Field(..., description="Agent name")
    agent_type: str = Field(..., description="Agent type: autoresearch, rag, mcp, custom")
    description: Optional[str] = Field(None, description="Agent description")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Agent configuration")


class AgentResponse(BaseModel):
    id: str
    name: str
    agent_type: str
    description: Optional[str]
    status: str
    config: Dict[str, Any]


@agents_router.post("/", response_model=AgentResponse)
async def create_agent_endpoint(
    request: CreateAgentRequest,
    settings: Settings = Depends(get_settings)
):
    """Create a new agent"""
    agent = create_agent(settings, request.name)
    
    return AgentResponse(
        id=request.name,
        name=request.name,
        agent_type=request.agent_type,
        description=request.description,
        status="inactive",
        config=request.config
    )


@agents_router.get("/", response_model=List[AgentResponse])
async def list_agents_endpoint():
    """List all agents"""
    agent_ids = list_agents()
    agents = []
    
    for agent_id in agent_ids:
        agent = get_agent(agent_id)
        if agent:
            status = agent.get_status()
            agents.append(AgentResponse(
                id=agent_id,
                name=agent_id,
                agent_type="autoresearch",
                description="Autoresearch agent",
                status="running" if status["is_running"] else "stopped",
                config={}
            ))
    
    return agents


@agents_router.get("/{agent_id}")
async def get_agent_endpoint(agent_id: str):
    """Get agent status and details"""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    return agent.get_status()


@agents_router.post("/{agent_id}/start")
async def start_agent_endpoint(agent_id: str):
    """Start an agent"""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Start agent in background
    import asyncio
    asyncio.create_task(agent.run_autonomous_loop())
    
    return {"status": "started", "agent_id": agent_id}


@agents_router.post("/{agent_id}/stop")
async def stop_agent_endpoint(agent_id: str):
    """Stop an agent"""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    agent.stop()
    return {"status": "stopped", "agent_id": agent_id}


# ==================== Experiments API ====================

class ExperimentResponse(BaseModel):
    id: str
    agent_id: str
    status: str
    iteration: int
    metric_value: Optional[float]
    results: Dict[str, Any]


@experiments_router.get("/")
async def list_experiments():
    """List all experiments"""
    # This would query the database for experiments
    return []


@experiments_router.get("/{experiment_id}")
async def get_experiment(experiment_id: str):
    """Get experiment details"""
    return {"id": experiment_id, "status": "not_found"}


@experiments_router.post("/{experiment_id}/export")
async def export_experiment(experiment_id: str):
    """Export experiment results as TSV"""
    agent = get_agent(experiment_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return Response(content=agent.export_results(), media_type="text/tab-separated-values")


# ==================== RAG API ====================

class AddDocumentRequest(BaseModel):
    doc_id: str = Field(..., description="Document ID")
    content: str = Field(..., description="Document content")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Document metadata")


class QueryRAGRequest(BaseModel):
    query: str = Field(..., description="Query text")
    top_k: Optional[int] = Field(5, description="Number of results to return")


@rag_router.post("/documents")
async def add_document(request: AddDocumentRequest):
    """Add a document to the RAG engine"""
    if not HAS_RAG:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    try:
        rag_engine = get_rag_engine(get_settings())
        doc_id = rag_engine.add_document(request.doc_id, request.content, request.metadata)
        return {"status": "success", "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@rag_router.post("/query")
async def query_rag(request: QueryRAGRequest):
    """Query the RAG engine"""
    if not HAS_RAG:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    try:
        rag_engine = get_rag_engine(get_settings())
        results = rag_engine.query(request.query, top_k=request.top_k)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@rag_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from RAG engine"""
    if not HAS_RAG:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    rag_engine = get_rag_engine(get_settings())
    success = rag_engine.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "doc_id": doc_id}


@rag_router.get("/stats")
async def get_rag_stats():
    """Get RAG engine statistics"""
    if not HAS_RAG:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    rag_engine = get_rag_engine(get_settings())
    return rag_engine.get_stats()


# ==================== MCP API ====================

class MCPToolCallRequest(BaseModel):
    tool_name: str = Field(..., description="Tool name to call")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")


@mcp_router.post("/call")
async def call_mcp_tool(request: MCPToolCallRequest):
    """Call an MCP tool"""
    if not HAS_MCP:
        raise HTTPException(status_code=503, detail="MCP server not available")
    try:
        mcp_server = get_mcp_server()
        result = await mcp_server.handle_tool_call(request.tool_name, request.arguments)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/tools")
async def list_mcp_tools():
    """List all available MCP tools"""
    if not HAS_MCP:
        raise HTTPException(status_code=503, detail="MCP server not available")
    mcp_server = get_mcp_server()
    tools = mcp_server.get_tool_definitions()
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "schema": tool.inputSchema
        }
        for tool in tools
    ]


# ==================== Cache API ====================

class CacheOperationRequest(BaseModel):
    action: str = Field(..., description="Cache action: get, set, delete, exists")
    key: Optional[str] = Field(None, description="Cache key")
    value: Optional[Any] = Field(None, description="Value to cache (for set action)")
    ttl: Optional[int] = Field(3600, description="TTL in seconds")


@cache_router.post("/operate")
async def cache_operation(request: CacheOperationRequest):
    """Perform a cache operation"""
    if not HAS_CACHE:
        raise HTTPException(status_code=503, detail="Cache not available")
    cache = get_cache_manager(get_settings())
    if request.action == "get":
        value = await cache.get(request.key or "")
        return {"key": request.key, "value": value}
    elif request.action == "set":
        success = await cache.set(request.key or "", request.value, request.ttl)
        return {"status": "success" if success else "error"}
    elif request.action == "delete":
        success = await cache.delete(request.key or "")
        return {"status": "deleted" if success else "not_found"}
    elif request.action == "exists":
        exists = await cache.exists(request.key or "")
        return {"key": request.key, "exists": exists}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")


@cache_router.get("/stats")
async def get_cache_stats():
    """Get cache statistics"""
    if not HAS_CACHE:
        raise HTTPException(status_code=503, detail="Cache not available")
    cache = get_cache_manager(get_settings())
    info = cache.redis_client.info()
    return {
        "connected_clients": info.get("connected_clients"),
        "used_memory_human": info.get("used_memory_human"),
        "total_commands_processed": info.get("total_commands_processed"),
        "keyspace_hits": info.get("keyspace_hits", 0),
        "keyspace_misses": info.get("keyspace_misses", 0)
    }


@cache_router.post("/flush")
async def flush_cache():
    """Flush the entire cache"""
    if not HAS_CACHE:
        raise HTTPException(status_code=503, detail="Cache not available")
    cache = get_cache_manager(get_settings())
    success = await cache.flush_db()
    return {"status": "flushed" if success else "error"}


# ==================== Metrics API ====================

@metrics_router.get("/prometheus")
async def get_prometheus_metrics():
    """Get metrics in Prometheus format"""
    metrics_data = get_metrics()
    return Response(content=metrics_data, media_type="text/plain")


@metrics_router.get("/summary")
async def get_metrics_summary():
    """Get a summary of key metrics"""
    return {
        "http_requests": 0,
        "active_agents": len(list_agents()),
        "cache_hit_rate": 0,
        "rag_documents": 0,
        "mcp_tools_available": len(get_mcp_server().tools)
    }


# ==================== Include all sub-routers ====================
router.include_router(agents_router)
router.include_router(experiments_router)
router.include_router(rag_router)
router.include_router(mcp_router)
router.include_router(cache_router)
router.include_router(metrics_router)
