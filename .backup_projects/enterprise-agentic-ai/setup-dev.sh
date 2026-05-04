#!/bin/bash
# Enterprise Agentic AI Platform - Development Setup Script

set -e

echo "🛠️  Enterprise Agentic AI Platform - Development Setup"
echo "========================================================"
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $REQUIRED_VERSION or higher is required. Found: Python $PYTHON_VERSION"
    exit 1
fi

echo "✓ Python $PYTHON_VERSION detected"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "✓ Virtual environment created"
echo ""

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "✓ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data/chroma_db

echo ""
echo "✅ Development setup complete!"
echo ""
echo "🚀 To start the platform:"
echo "   source venv/bin/activate"
echo "   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "📊 Or use Docker Compose:"
echo "   docker-compose up -d"
echo ""
