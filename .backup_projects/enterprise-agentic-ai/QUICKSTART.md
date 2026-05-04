# Quick Start Guide - Enterprise Agentic AI Platform

## 🚀 60-Second Quick Start

```bash
# Clone and start
git clone <your-repo> enterprise-agentic-ai
cd enterprise-agentic-ai
cp .env.example .env

# Start everything
docker-compose up -d

# Access the platform
# Main GUI: http://localhost:8100
# Grafana: http://localhost:3100 (admin/admin)
```

## 📋 What You Get

### ✅ Complete Platform
- **FastAPI Backend** - Production-ready async API
- **9-Tab Web GUI** - Full visual control panel
- **OpenTelemetry** - Complete distributed tracing
- **MCP Server** - Model Context Protocol support
- **RAG Engine** - ChromaDB vector search
- **Redis Cache** - High-performance caching
- **Autonomous Agents** - Karpathy-style autoresearch

### ✅ Observability Stack
- **Prometheus** - Metrics collection
- **Grafana** - Pre-configured dashboards
- **Jaeger** - Trace visualization
- **RedisInsight** - Cache monitoring

### ✅ Production Features
- Docker Compose orchestration
- Health checks and auto-restart
- API key management
- Rate limiting support
- Comprehensive logging
- CORS support for web embedding

## 🎯 Use Cases

### 1. Prompt Optimization
```bash
# Create an agent
curl -X POST http://localhost:8100/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prompt-opt",
    "agent_type": "autoresearch",
    "config": {
      "editable_file": "prompt.txt",
      "eval_script": "evaluate.py",
      "metric_name": "accuracy"
    }
  }'

# Start it
curl -X POST http://localhost:8100/api/v1/agents/prompt-opt/start
```

### 2. RAG-Powered Search
```python
from rag.engine import get_rag_engine
from core.config import get_settings

settings = get_settings()
rag = get_rag_engine(settings)

# Add documents
rag.add_document("doc1", "Your content here", {"category": "docs"})

# Search
results = rag.query("How to configure?", top_k=5)
```

### 3. MCP Tool Integration
```python
from mcp_server.server import get_mcp_server

mcp = get_mcp_server()

# Call a tool
result = await mcp.handle_tool_call("rag_query", {
    "query": "documentation",
    "top_k": 3
})
```

### 4. Redis Caching
```python
from core.cache import get_cache_manager
from core.config import get_settings

settings = get_settings()
cache = get_cache_manager(settings)

# Cache with TTL
await cache.set("my:key", {"data": "value"}, ttl=3600)

# Retrieve
value = await cache.get("my:key")
```

## 📊 Monitoring

### View Dashboards
1. **Platform GUI**: http://localhost:8100
2. **Grafana**: http://localhost:3100
3. **Jaeger Traces**: http://localhost:8103
4. **Prometheus**: http://localhost:9100

### Key Metrics
- HTTP request rate and latency
- Agent iterations and accuracy
- Cache hit/miss ratio
- RAG query performance
- MCP tool execution time
- System uptime

## 🔧 Configuration

### Minimal .env
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
REDIS_HOST=localhost
DATABASE_URL=sqlite+aiosqlite:///./agentic_ai.db
```

### Production .env
```bash
# Add these for production
REDIS_PASSWORD=your_redis_password
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.your-domain.com
LOG_LEVEL=WARNING
DEBUG=false
```

## 🐛 Troubleshooting

### Check Status
```bash
./status.sh
```

### View Logs
```bash
docker-compose logs -f app
```

### Restart Service
```bash
docker-compose restart app
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
```

## 📚 Next Steps

1. **Read the full README.md** for comprehensive documentation
2. **Explore the API** at http://localhost:8100/api/docs
3. **Customize agents** for your use case
4. **Add your data** to the RAG engine
5. **Set up monitoring** alerts in Grafana

## 💡 Pro Tips

- **Embed in websites**: The GUI is designed to be embedded via iframe
- **Scale horizontally**: Run multiple app instances behind a load balancer
- **Use Redis Cluster**: For high availability in production
- **Custom dashboards**: Grafana dashboards are JSON files you can duplicate
- **Agent autonomy**: Agents run indefinitely until you stop them

## 🎓 Learning Resources

- **Karpathy's Autoresearch**: https://github.com/karpathy/autoresearch
- **OpenTelemetry**: https://opentelemetry.io/docs/
- **MCP Protocol**: https://modelcontextprotocol.io
- **RAG Patterns**: https://blog.langchain.dev/

---

**Ready to deploy?** See the Production Deployment section in README.md
