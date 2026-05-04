# Enterprise Agentic AI Platform

A production-ready, enterprise-grade AI agent platform with OpenTelemetry distributed tracing, MCP (Model Context Protocol), RAG engine, Redis caching, Prometheus metrics, and Grafana dashboards. Features a comprehensive web-based GUI with tabbed access to all functions.

## 🚀 Features

### Core Platform
- **FastAPI Backend** - High-performance async API framework
- **OpenTelemetry Integration** - Complete distributed tracing and observability
- **MCP Server** - Model Context Protocol for tool integration
- **RAG Engine** - Retrieval-Augmented Generation with ChromaDB vector store
- **Redis Caching** - Enterprise-grade caching layer with TTL support
- **Autonomous Agents** - Karpathy-style autoresearch for prompt/strategy optimization

### Observability Stack
- **OpenTelemetry Collector** - Centralized trace and metric collection
- **Prometheus** - Time-series metrics storage and querying
- **Grafana** - Beautiful dashboards with pre-configured visualizations
- **Jaeger** - Distributed trace visualization and analysis

### Web GUI
- **9 Tabbed Interfaces**:
  1. **Dashboard** - Platform overview and system health
  2. **Agents** - Create, manage, and monitor AI agents
  3. **Experiments** - Track and analyze autoresearch experiments
  4. **RAG Engine** - Document management and semantic search
  5. **MCP Tools** - Tool registry and testing interface
  6. **Redis Cache** - Cache operations and statistics
  7. **Metrics** - Live Prometheus metrics view
  8. **Traces** - OpenTelemetry trace configuration
  9. **Settings** - Platform configuration and API keys

## 📁 Project Structure

```
enterprise-agentic-ai/
├── api/                      # FastAPI application
│   ├── main.py              # Main application entry
│   └── routes.py            # API route definitions
├── core/                     # Core infrastructure
│   ├── config.py            # Configuration management
│   ├── models.py            # Database models
│   └── cache.py             # Redis cache manager
├── agents/                   # Agent implementations
│   └── autoresearch.py      # Autonomous research agent
├── rag/                      # RAG engine
│   └── engine.py            # ChromaDB-based RAG
├── mcp_server/               # MCP server
│   └── server.py            # Model Context Protocol server
├── observability/            # Observability stack
│   ├── tracing.py           # OpenTelemetry setup
│   └── metrics.py           # Prometheus metrics
├── gui/                      # Web-based GUI
│   ├── routes.py            # GUI routes
│   └── templates/           # HTML templates
│       └── index.html       # Main dashboard
├── config/                   # Configuration files
│   └── otel-config.yaml     # OpenTelemetry collector config
├── prometheus/               # Prometheus configuration
│   └── prometheus.yml
├── grafana/                  # Grafana dashboards
│   ├── datasources.yml
│   └── dashboards/
│       └── main-dashboard.json
├── docker-compose.yml        # Docker orchestration
├── Dockerfile               # Application container
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## 🛠️ Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.10+ (for local development)
- 4GB+ RAM recommended

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo-url> enterprise-agentic-ai
cd enterprise-agentic-ai

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

The platform will be available at:
- **Main GUI**: http://localhost:8100
- **API Docs**: http://localhost:8100/api/docs
- **Prometheus**: http://localhost:9100
- **Grafana**: http://localhost:3100 (admin/admin)
- **Jaeger**: http://localhost:8103
- **RedisInsight**: http://localhost:8101

### Option 2: Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run the application
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/agentic_ai

# OpenTelemetry
OTEL_SERVICE_NAME=agentic-ai-platform
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

## 📖 API Reference

### Agents API

```bash
# Create a new agent
curl -X POST http://localhost:8100/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prompt-optimizer",
    "agent_type": "autoresearch",
    "description": "Autonomous prompt optimization",
    "config": {
      "editable_file": "prompt.txt",
      "eval_script": "evaluate.py",
      "metric_name": "accuracy",
      "max_iterations": 100
    }
  }'

# List all agents
curl http://localhost:8100/api/v1/agents

# Start an agent
curl -X POST http://localhost:8100/api/v1/agents/prompt-optimizer/start

# Stop an agent
curl -X POST http://localhost:8100/api/v1/agents/prompt-optimizer/stop
```

### RAG Engine API

```bash
# Add a document
curl -X POST http://localhost:8100/api/v1/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "manual-001",
    "content": "Your document content here...",
    "metadata": {"source": "manual", "category": "docs"}
  }'

# Query documents
curl -X POST http://localhost:8100/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to configure the system?",
    "top_k": 5
  }'

# Get RAG stats
curl http://localhost:8100/api/v1/rag/stats
```

### Cache API

```bash
# Set cache
curl -X POST http://localhost:8100/api/v1/cache/operate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set",
    "key": "my:key",
    "value": {"data": "cached_value"},
    "ttl": 3600
  }'

# Get cache
curl -X POST http://localhost:8100/api/v1/cache/operate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get",
    "key": "my:key"
  }'

# Get cache stats
curl http://localhost:8100/api/v1/cache/stats
```

### MCP Tools API

```bash
# List available tools
curl http://localhost:8100/api/v1/mcp/tools

# Call a tool
curl -X POST http://localhost:8100/api/v1/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "rag_query",
    "arguments": {
      "query": "test query",
      "top_k": 5
    }
  }'
```

### Metrics API

```bash
# Prometheus metrics
curl http://localhost:8100/api/v1/metrics/prometheus

# Metrics summary
curl http://localhost:8100/api/v1/metrics/summary
```

## 🤖 Using the Autoresearch Agent

The autoresearch agent implements Karpathy's autonomous research pattern for optimizing prompts, strategies, or any editable asset.

### Setup an Experiment

```python
from agents.autoresearch import create_agent
from core.config import get_settings

settings = get_settings()
agent = create_agent(settings, "prompt-optimizer")

# Setup experiment
agent.setup_experiment(
    repo_path="/path/to/your/project",
    tag="prompt-apr3",
    editable_file="prompt.txt",
    eval_script="evaluate.py",
    metric_name="accuracy"
)

# Run autonomous loop
import asyncio
asyncio.run(agent.run_autonomous_loop(max_iterations=100))
```

### Experiment Structure

```
your-experiment/
├── prompt.txt           # The ONLY file the agent edits
├── evaluate.py          # Fixed evaluation script (read-only)
├── eval_set.jsonl       # Test cases with ground truth
├── program.md           # Experiment instructions
├── results.tsv          # Auto-generated results log
└── last_run.json        # Failure analysis
```

### How It Works

1. **Baseline**: Agent runs evaluation with current prompt to establish baseline
2. **Hypothesize**: Agent analyzes failures and generates improvement hypothesis
3. **Edit**: Agent modifies `prompt.txt` based on hypothesis
4. **Evaluate**: Agent runs full evaluation suite
5. **Keep/Discard**: If accuracy improved → keep, else → discard
6. **Repeat**: Loop continues autonomously

## 📊 Observability

### OpenTelemetry Tracing

All operations are instrumented with OpenTelemetry. Traces are exported to Jaeger for visualization.

```python
from observability.tracing import get_tracer, trace_agent_operation

tracer = get_tracer("my_component")

@trace_agent_operation("my_agent", "custom_operation")
async def my_function():
    with tracer.start_as_current_span("custom_span") as span:
        span.set_attribute("custom.attribute", "value")
        # Your code here
```

### Prometheus Metrics

The platform exports comprehensive metrics:

- **HTTP**: Request count, duration, in-progress requests
- **Agents**: Iterations, accuracy, active experiments
- **RAG**: Query count, retrieval time, document count
- **Cache**: Hits, misses, size
- **MCP**: Tool calls, execution time
- **System**: Uptime, health status

### Grafana Dashboards

Pre-configured dashboards are automatically provisioned:

1. **Main Dashboard**: Platform overview with key metrics
2. Access via http://localhost:3100 (admin/admin)

## 🔐 Security

### API Key Management

The platform supports API key authentication and rate limiting:

```bash
# Generate API key
curl -X POST http://localhost:8100/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-api-key",
    "permissions": ["read", "write"],
    "rate_limit": 1000
  }'
```

### Best Practices

1. **Never commit `.env` file** - It contains sensitive API keys
2. **Use strong passwords** - For database and Grafana admin
3. **Enable TLS** - In production, use reverse proxy with TLS
4. **Rate limiting** - Configure appropriate rate limits for API keys
5. **Network isolation** - Use Docker networks to isolate services

## 🧪 Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

## 🚀 Production Deployment

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml agentic-ai
```

### Kubernetes

Create deployment manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentic-ai-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentic-ai
  template:
    metadata:
      labels:
        app: agentic-ai
    spec:
      containers:
      - name: app
        image: your-registry/agentic-ai:latest
        ports:
        - containerPort: 8000
        envFrom:
        - secretRef:
            name: agentic-ai-secrets
```

### Scaling

- **App**: Scale horizontally with multiple replicas
- **Redis**: Use Redis Cluster for high availability
- **Database**: Use PostgreSQL with read replicas
- **Prometheus**: Use Thanos for long-term storage

## 🔍 Troubleshooting

### Check Service Status

```bash
docker-compose ps
docker-compose logs -f app
```

### Common Issues

**Redis Connection Failed**
```bash
# Check Redis is running
docker-compose ps redis
docker-compose logs redis
```

**Database Connection Failed**
```bash
# Check PostgreSQL is running
docker-compose ps db
docker-compose logs db
```

**OpenTelemetry Not Exporting**
```bash
# Check OTel collector
docker-compose ps otel-collector
docker-compose logs otel-collector
```

### View Metrics

```bash
# Prometheus targets
curl http://localhost:9100/api/v1/targets

# Export metrics directly
curl http://localhost:8100/api/v1/metrics/prometheus
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Karpathy's autoresearch for the autonomous research pattern
- OpenTelemetry community for observability standards
- LangChain for RAG infrastructure
- FastAPI for the excellent web framework

---

**Built with ❤️ for the AI community**

For questions or support, please open an issue on GitHub.
