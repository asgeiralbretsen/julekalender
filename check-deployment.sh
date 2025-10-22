#!/bin/bash

# Deployment diagnostic script
# Run this on your VPS to check what's wrong

echo "🔍 Checking deployment status..."
echo ""

echo "📦 Docker containers status:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep julekalender
echo ""

echo "🔍 Checking if backend is responding:"
if docker exec julekalender-backend curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding internally"
    docker exec julekalender-backend curl -s http://localhost:5000/health
else
    echo "❌ Backend is NOT responding internally"
    echo "Backend logs:"
    docker logs --tail 20 julekalender-backend
fi
echo ""

echo "🔍 Checking if Caddy can reach backend:"
if docker exec julekalender-caddy wget -qO- http://julekalender-backend:5000/health > /dev/null 2>&1; then
    echo "✅ Caddy can reach backend"
else
    echo "❌ Caddy cannot reach backend"
fi
echo ""

echo "🔍 Checking Caddy configuration:"
docker exec julekalender-caddy cat /etc/caddy/Caddyfile | grep -A 5 "handle /api"
echo ""

echo "🔍 Caddy logs (last 20 lines):"
docker logs --tail 20 julekalender-caddy
echo ""

echo "🔍 Testing API endpoint from inside Caddy container:"
docker exec julekalender-caddy wget -qO- http://julekalender-backend:5000/api/health
echo ""

echo "🔍 Network connectivity:"
docker network inspect julekalender-network | grep -A 3 "julekalender-backend"

