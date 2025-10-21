#!/bin/bash

# Production deployment script
# This script should be run in CI/CD after merging to production

set -e

echo "🚀 Starting production deployment..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Pull latest images (if using registry)
# docker-compose -f docker-compose.prod.yml pull

# Build and start production containers
echo "🔨 Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test API endpoint
echo "🧪 Testing API endpoint..."
if curl -f http://localhost:5002/api/users > /dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding"
    exit 1
fi

# Test frontend
echo "🧪 Testing frontend..."
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo "🌐 Application is available at:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:5002"
echo "   - Database: localhost:5432"
