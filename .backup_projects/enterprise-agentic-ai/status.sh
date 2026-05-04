#!/bin/bash
# Enterprise Agentic AI Platform - Status Check Script

set -e

echo "📊 Enterprise Agentic AI Platform - Status"
echo "============================================"
echo ""

if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Show container status
echo "🐳 Container Status:"
echo "--------------------"
docker compose ps

echo ""
echo "🔗 Service URLs:"
echo "----------------"
echo "Main GUI:       http://localhost:8100"
echo "API Docs:       http://localhost:8100/api/docs"
echo "Prometheus:     http://localhost:9100"
echo "Grafana:        http://localhost:3100"
echo "Jaeger:         http://localhost:8103"
echo "RedisInsight:   http://localhost:8101"
echo ""

# Check if services are responding
echo "🔍 Health Checks:"
echo "-----------------"

check_service() {
    local name=$1
    local url=$2
    
    if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
        echo "✓ $name is responding"
    else
        echo "✗ $name is not responding"
    fi
}

check_service "API" "http://localhost:8100/health"
check_service "Prometheus" "http://localhost:9100/-/healthy"
check_service "Grafana" "http://localhost:3100/api/health"
check_service "Jaeger" "http://localhost:8103/"

echo ""
echo "📝 Recent Logs (last 20 lines):"
echo "--------------------------------"
docker compose logs --tail=20 app

echo ""
