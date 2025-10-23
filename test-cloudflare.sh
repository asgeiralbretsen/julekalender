#!/bin/bash

echo "🔍 Testing Cloudflare → VPS routing..."
echo ""

echo "1️⃣ Test from localhost (bypassing Cloudflare):"
echo "curl http://localhost/api/health"
curl -s http://localhost/api/health | head -5
echo ""

echo "2️⃣ Test through Cloudflare IP directly:"
echo "curl -H 'Host: julekalender.albretsen.no' http://YOUR_VPS_IP/api/health"
echo "(Replace YOUR_VPS_IP with your actual IP)"
echo ""

echo "3️⃣ Check Caddy logs for recent /api/health requests:"
docker logs julekalender-caddy --tail 50 | grep "/api"
echo ""

echo "4️⃣ Check what Caddy sees for requests:"
echo "Run this and then curl the API from outside:"
echo "docker logs -f julekalender-caddy"

