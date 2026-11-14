#!/bin/bash
set -e

echo "=========================================="
echo "  Trip Planner - Docker Build & Deploy"
echo "=========================================="

if [ ! -f .env ]; then
  echo "⚠️  .env file not found! Copying from .env.example..."
  cp .env.example .env
  echo "⚠️  Please configure your .env file with real API keys before continuing."
  echo "    Specifically GROQ_API_KEY and TAVILY_API_KEY."
  exit 1
fi

echo "🚀 Building and starting containers..."
docker compose up -d --build

echo ""
echo "✅ Deployment successful!"
echo "------------------------------------------"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️  Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "------------------------------------------"
echo "To view logs, run: docker compose logs -f"
echo "To stop, run: docker compose down"
