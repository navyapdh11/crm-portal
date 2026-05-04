"""
MCP (Model Context Protocol) Server Implementation
"""
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import logging
from opentelemetry import trace
import time

logger = logging.getLogger(__name__)
tracer = trace.get_tracer("mcp_server")


class MCPServer:
    """MCP Server with tool registration and execution"""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8002):
        self.host = host
        self.port = port
        self.server = Server("agentic-ai-mcp")
        self.tools: Dict[str, Dict] = {}
        self._register_default_tools()
        logger.info(f"MCP Server initialized on {host}:{port}")
    
    def _register_default_tools(self):
        """Register default MCP tools"""
        
        # RAG Query Tool
        self.register_tool(
            name="rag_query",
            description="Query the RAG engine for relevant documents",
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The query text to search for"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            },
            handler=self._handle_rag_query
        )
        
        # Cache Management Tool
        self.register_tool(
            name="cache_manage",
            description="Manage the Redis cache (get, set, delete, stats)",
            parameters={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["get", "set", "delete", "stats", "flush"],
                        "description": "Cache action to perform"
                    },
                    "key": {
                        "type": "string",
                        "description": "Cache key"
                    },
                    "value": {
                        "type": "string",
                        "description": "Value to cache (for set action)"
                    }
                },
                "required": ["action"]
            },
            handler=self._handle_cache_manage
        )
        
        # Agent Management Tool
        self.register_tool(
            name="agent_manage",
            description="Manage AI agents (create, start, stop, status)",
            parameters={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["create", "start", "stop", "status", "list"],
                        "description": "Agent action to perform"
                    },
                    "agent_id": {
                        "type": "string",
                        "description": "Agent ID"
                    },
                    "config": {
                        "type": "object",
                        "description": "Agent configuration (for create action)"
                    }
                },
                "required": ["action"]
            },
            handler=self._handle_agent_manage
        )
        
        # Experiment Management Tool
        self.register_tool(
            name="experiment_manage",
            description="Manage experiments (create, run, status, results)",
            parameters={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["create", "run", "status", "results", "list"],
                        "description": "Experiment action to perform"
                    },
                    "experiment_id": {
                        "type": "string",
                        "description": "Experiment ID"
                    },
                    "config": {
                        "type": "object",
                        "description": "Experiment configuration"
                    }
                },
                "required": ["action"]
            },
            handler=self._handle_experiment_manage
        )
        
        # Metrics Query Tool
        self.register_tool(
            name="metrics_query",
            description="Query Prometheus metrics for observability",
            parameters={
                "type": "object",
                "properties": {
                    "metric_name": {
                        "type": "string",
                        "description": "Name of the metric to query"
                    },
                    "time_range": {
                        "type": "string",
                        "description": "Time range (e.g., '1h', '24h', '7d')",
                        "default": "1h"
                    }
                },
                "required": ["metric_name"]
            },
            handler=self._handle_metrics_query
        )
    
    def register_tool(self, name: str, description: str, parameters: Dict, handler):
        """Register a new MCP tool"""
        self.tools[name] = {
            "description": description,
            "parameters": parameters,
            "handler": handler
        }
        logger.info(f"Registered MCP tool: {name}")
    
    async def _handle_rag_query(self, arguments: Dict) -> List[TextContent]:
        """Handle RAG query tool execution"""
        from core.config import get_settings
        from rag.engine import get_rag_engine
        
        settings = get_settings()
        rag_engine = get_rag_engine(settings)
        
        query = arguments.get("query", "")
        top_k = arguments.get("top_k", 5)
        
        results = rag_engine.query(query, top_k=top_k)
        
        return [
            TextContent(
                type="text",
                text=json.dumps(results, indent=2, default=str)
            )
        ]
    
    async def _handle_cache_manage(self, arguments: Dict) -> List[TextContent]:
        """Handle cache management tool execution"""
        from core.config import get_settings
        from core.cache import get_cache_manager
        
        settings = get_settings()
        cache = get_cache_manager(settings)
        
        action = arguments.get("action", "stats")
        key = arguments.get("key", "")
        value = arguments.get("value", "")
        
        result = {}
        
        if action == "get":
            result["value"] = await cache.get(key)
        elif action == "set":
            result["success"] = await cache.set(key, value)
        elif action == "delete":
            result["success"] = await cache.delete(key)
        elif action == "stats":
            # Get Redis INFO
            info = cache.redis_client.info()
            result["stats"] = {
                "connected_clients": info.get("connected_clients"),
                "used_memory_human": info.get("used_memory_human"),
                "total_commands_processed": info.get("total_commands_processed")
            }
        elif action == "flush":
            result["success"] = await cache.flush_db()
        
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )
        ]
    
    async def _handle_agent_manage(self, arguments: Dict) -> List[TextContent]:
        """Handle agent management tool execution"""
        action = arguments.get("action", "list")
        agent_id = arguments.get("agent_id", "")
        config = arguments.get("config", {})
        
        result = {"action": action, "agent_id": agent_id}
        
        # This would integrate with the agent system
        # For now, return a placeholder
        result["message"] = f"Agent action '{action}' executed"
        
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )
        ]
    
    async def _handle_experiment_manage(self, arguments: Dict) -> List[TextContent]:
        """Handle experiment management tool execution"""
        action = arguments.get("action", "list")
        experiment_id = arguments.get("experiment_id", "")
        config = arguments.get("config", {})
        
        result = {"action": action, "experiment_id": experiment_id}
        result["message"] = f"Experiment action '{action}' executed"
        
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )
        ]
    
    async def _handle_metrics_query(self, arguments: Dict) -> List[TextContent]:
        """Handle metrics query tool execution"""
        metric_name = arguments.get("metric_name", "")
        time_range = arguments.get("time_range", "1h")
        
        result = {
            "metric_name": metric_name,
            "time_range": time_range,
            "message": "Metrics query executed - connect to Prometheus for actual data"
        }
        
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )
        ]
    
    async def handle_tool_call(self, tool_name: str, arguments: Dict) -> List[TextContent]:
        """Handle a tool call from MCP client"""
        with tracer.start_as_current_span(f"mcp.tool.{tool_name}") as span:
            span.set_attribute("tool.name", tool_name)
            start_time = time.time()
            
            if tool_name not in self.tools:
                from observability.metrics import MCP_TOOL_CALLS_TOTAL
                MCP_TOOL_CALLS_TOTAL.labels(tool_name=tool_name, status="error").inc()
                return [
                    TextContent(
                        type="text",
                        text=f"Error: Unknown tool '{tool_name}'"
                    )
                ]
            
            try:
                tool = self.tools[tool_name]
                handler = tool["handler"]
                result = await handler(arguments)
                
                duration = time.time() - start_time
                span.set_attribute("tool.duration_ms", duration * 1000)
                span.set_attribute("tool.status", "success")
                
                from observability.metrics import MCP_TOOL_CALLS_TOTAL, MCP_TOOL_EXECUTION_TIME
                MCP_TOOL_CALLS_TOTAL.labels(tool_name=tool_name, status="success").inc()
                MCP_TOOL_EXECUTION_TIME.labels(tool_name=tool_name).observe(duration)
                
                return result
                
            except Exception as e:
                span.record_exception(e)
                span.set_attribute("tool.status", "error")
                
                from observability.metrics import MCP_TOOL_CALLS_TOTAL
                MCP_TOOL_CALLS_TOTAL.labels(tool_name=tool_name, status="error").inc()
                
                return [
                    TextContent(
                        type="text",
                        text=f"Error executing tool: {str(e)}"
                    )
                ]
    
    def get_tool_definitions(self) -> List[Tool]:
        """Get tool definitions for MCP protocol"""
        tools = []
        for name, tool in self.tools.items():
            tools.append(
                Tool(
                    name=name,
                    description=tool["description"],
                    inputSchema=tool["parameters"]
                )
            )
        return tools
    
    async def run(self):
        """Run the MCP server"""
        from mcp.server.stdio import stdio_server
        
        logger.info(f"Starting MCP server on {self.host}:{self.port}")
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )


# Global MCP server instance
_mcp_server: Optional[MCPServer] = None


def get_mcp_server(host: str = "0.0.0.0", port: int = 8002) -> MCPServer:
    """Get or create MCP server instance"""
    global _mcp_server
    if _mcp_server is None:
        _mcp_server = MCPServer(host, port)
    return _mcp_server
