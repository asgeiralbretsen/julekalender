#!/bin/bash

echo "🔍 Debugging routing issue..."
echo ""

echo "1️⃣ Check which ports are exposed to the internet:"
netstat -tlnp | grep -E ':(80|443|3001|5002)' || ss -tlnp | grep -E ':(80|443|3001|5002)'
echo ""

echo "2️⃣ Check Docker port mappings:"
docker ps --format "table {{.Names}}\t{{.Ports}}"
echo ""

echo "3️⃣ Test backend directly (should work):"
curl -s http://localhost:5002/api/health
echo ""

echo "4️⃣ Test frontend directly on port 3001 (should return HTML for /api/health):"
curl -s http://localhost:3001/api/health | head -5
echo ""

echo "5️⃣ Test through Caddy on port 80 (should return JSON):"
curl -s http://localhost:80/api/health
echo ""

echo "6️⃣ Check if Cloudflare might be hitting port 3001 instead of 80:"
echo "Your docker-compose exposes:"
docker compose -f docker-compose.prod.yml config | grep -A 2 "ports:"
echo ""

echo "💡 If step 4 returns HTML and step 5 returns JSON,"
echo "   then Cloudflare is bypassing Caddy and hitting the frontend container directly."
echo ""
echo "   Fix: Make sure Cloudflare points to port 80 (Caddy), not port 3001 (frontend)"

