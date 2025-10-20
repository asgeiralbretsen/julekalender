#!/bin/bash

# Production deployment script for julekalender
# Run this script on your VPS to deploy the application

set -e

echo "Starting deployment of julekalender..."

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
echo "🔨 Building and starting new containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Clean up unused Docker resources
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

# Show running containers
echo "📋 Current running containers:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo "🌐 Frontend should be available on port 3001"
echo "🔧 Backend should be available on port 5002"
echo "📊 Health endpoint: http://localhost:5002/health"
