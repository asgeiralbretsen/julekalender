#!/bin/bash

# Fix for proxy issues
# This script restarts the services and ensures Caddy reloads the configuration

set -e

echo "🔧 Fixing proxy configuration..."
echo ""

echo "1️⃣ Stopping all containers..."
docker compose -f docker-compose.prod.yml down

echo ""
echo "2️⃣ Checking if Caddyfile exists..."
if [ ! -f "Caddyfile" ]; then
    echo "❌ ERROR: Caddyfile not found!"
    exit 1
fi

echo "✅ Caddyfile found"
cat Caddyfile

echo ""
echo "3️⃣ Starting containers..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "4️⃣ Waiting for services to start..."
sleep 10

echo ""
echo "5️⃣ Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep julekalender

echo ""
echo "6️⃣ Verifying backend is responding..."
for i in {1..10}; do
    if curl -f http://localhost:5002/api/health > /dev/null 2>&1; then
        echo "✅ Backend is responding on port 5002"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend not responding after 10 attempts"
        echo "Backend logs:"
        docker logs julekalender-backend --tail 50
        exit 1
    fi
    echo "   Waiting... ($i/10)"
    sleep 2
done

echo ""
echo "7️⃣ Testing API proxy through Caddy..."
echo "Testing: curl http://localhost/api/health"
curl -v http://localhost/api/health 2>&1 | head -20

echo ""
echo "8️⃣ Checking Caddy logs..."
docker logs julekalender-caddy --tail 20

echo ""
echo "✅ Proxy fix complete!"
echo ""
echo "Test the API with:"
echo "  curl http://localhost/api/health"
echo "  or from outside: curl https://julekalender.albretsen.no/api/health"

