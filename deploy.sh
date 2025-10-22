#!/bin/bash

# Production deployment script
# This script performs a complete clean rebuild with no cache
# Run in CI/CD after merging to production

set -e

echo "🚀 Starting production deployment with clean rebuild..."

# Stop and remove all existing containers
echo "🛑 Stopping and removing existing containers..."
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans

# Remove dangling images and build cache
echo "🧹 Cleaning up Docker build cache..."
docker builder prune -f
docker image prune -f

# Remove old images for this project (optional - uncomment if needed)
echo "🗑️  Removing old project images..."
docker images | grep julekalender | awk '{print $3}' | xargs -r docker rmi -f || true

# Build with no cache
echo "🔨 Building images with no cache..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull

# Start production containers
echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Show running containers
echo "📋 Running containers:"
docker-compose -f docker-compose.prod.yml ps

# Check if services are running
echo "🔍 Checking service health..."

# Wait for backend to be ready (with retries)
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:5002/health > /dev/null 2>&1; then
        echo "✅ Backend API is responding"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend API failed to start"
        echo "📋 Backend logs:"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

# Test frontend
echo "🧪 Testing frontend..."
for i in {1..15}; do
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Frontend is responding"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Frontend failed to start"
        echo "📋 Frontend logs:"
        docker-compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
    echo "   Attempt $i/15..."
    sleep 2
done

# Test database connection
echo "🧪 Testing database connection..."
if docker exec julekalender-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
    exit 1
fi

# Show resource usage
echo "📊 Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🎉 Production deployment completed successfully!"
echo "🌐 Application is available at:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:5002"
echo "   - Backend Health: http://localhost:5002/health"
echo "   - Database: localhost:5432"
echo "   - Sanity Studio: http://localhost:3333"
echo "   - pgAdmin: http://localhost:8081"
echo ""
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f [service]"
