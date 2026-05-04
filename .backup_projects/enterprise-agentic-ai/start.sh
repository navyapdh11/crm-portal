#!/bin/bash
# Enterprise Agentic AI Platform - Quick Start Script

set -e

echo "🚀 Enterprise Agentic AI Platform - Quick Start"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker is installed"
echo "✓ Docker Compose is installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before starting!"
    echo ""
    read -p "Press Enter to continue after editing .env..."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data/chroma_db

# Start services
echo ""
echo "🚀 Starting all services..."
docker compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ Platform is starting up!"
echo ""
echo "📊 Access points:"
echo "   Main GUI:       http://localhost:8100"
echo "   API Docs:       http://localhost:8100/api/docs"
echo "   Prometheus:     http://localhost:9100"
echo "   Grafana:        http://localhost:3100 (admin/admin)"
echo "   Jaeger:         http://localhost:8103"
echo "   RedisInsight:   http://localhost:8101"
echo ""
echo "🛑 To stop the platform: docker-compose down"
echo "📝 To view logs: docker-compose logs -f"
echo ""
