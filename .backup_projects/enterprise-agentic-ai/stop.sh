#!/bin/bash
# Enterprise Agentic AI Platform - Stop Script

set -e

echo "🛑 Stopping Enterprise Agentic AI Platform..."
echo "==============================================="
echo ""

if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

docker compose down

echo ""
echo "✅ Platform stopped successfully!"
echo ""
echo "To remove all data (volumes): docker compose down -v"
echo ""
