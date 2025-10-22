#!/bin/bash

echo "🔍 Deep diagnostic for API routing issue..."
echo ""

echo "=== TEST 1: Backend directly ==="
echo "curl http://localhost:5002/api/health"
BACKEND_RESULT=$(curl -s http://localhost:5002/api/health)
echo "$BACKEND_RESULT"
if echo "$BACKEND_RESULT" | grep -q "healthy"; then
    echo "✅ Backend works"
else
    echo "❌ Backend broken"
fi
echo ""

echo "=== TEST 2: Frontend directly ==="
echo "curl http://localhost:3001/api/health"
FRONTEND_RESULT=$(curl -s http://localhost:3001/api/health | head -3)
echo "$FRONTEND_RESULT"
if echo "$FRONTEND_RESULT" | grep -q "<!doctype html>"; then
    echo "✅ Frontend returns HTML (expected for /api/* since it's SPA mode)"
else
    echo "❓ Frontend didn't return HTML"
fi
echo ""

echo "=== TEST 3: Through Caddy (internal) ==="
echo "curl http://localhost:80/api/health"
CADDY_INTERNAL_RESULT=$(curl -s http://localhost:80/api/health)
echo "$CADDY_INTERNAL_RESULT"
if echo "$CADDY_INTERNAL_RESULT" | grep -q "healthy"; then
    echo "✅ Caddy proxies correctly internally"
elif echo "$CADDY_INTERNAL_RESULT" | grep -q "<!doctype html>"; then
    echo "❌ Caddy returning HTML instead of JSON!"
fi
echo ""

echo "=== TEST 4: Caddy access logs ==="
echo "Watch live requests hitting Caddy:"
echo "docker logs -f julekalender-caddy &"
echo "Then in another terminal: curl https://julekalender.albretsen.no/api/health"
echo ""
echo "Press Ctrl+C after you see the request come through"
echo ""
timeout 5 docker logs -f julekalender-caddy 2>&1 &
LOGS_PID=$!
sleep 1
echo "Making external request..."
curl -s https://julekalender.albretsen.no/api/health > /dev/null 2>&1 &
sleep 3
kill $LOGS_PID 2>/dev/null || true
echo ""

echo "=== TEST 5: Check Caddy routing configuration ==="
echo "Current Caddyfile handle blocks:"
docker exec julekalender-caddy cat /etc/caddy/Caddyfile | grep -E "handle|reverse_proxy" | head -20
echo ""

echo "=== TEST 6: Is Caddy actually receiving requests? ==="
echo "Recent Caddy access logs:"
docker logs julekalender-caddy 2>&1 | grep -i "api" | tail -10
echo ""

echo "=== DIAGNOSIS ==="
if [ "$CADDY_INTERNAL_RESULT" = "$BACKEND_RESULT" ]; then
    echo "✅ Caddy is correctly proxying /api/* to backend internally"
    echo "❓ Issue is with external routing - Cloudflare might be hitting wrong container"
    echo ""
    echo "Check:"
    echo "1. Is Cloudflare DNS proxy enabled (orange cloud)?"
    echo "2. Cloudflare DNS should point to your VPS IP"
    echo "3. Requests should hit port 80/443 (Caddy), not 3001 (frontend)"
else
    echo "❌ Caddy is NOT proxying correctly even internally!"
    echo "The Caddyfile configuration is wrong"
fi

