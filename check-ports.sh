#!/bin/bash

echo "🔍 Checking which ports are exposed to the internet..."
echo ""

echo "1️⃣ Docker port mappings:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep julekalender
echo ""

echo "2️⃣ Ports listening on all interfaces (0.0.0.0):"
netstat -tlnp 2>/dev/null | grep "0.0.0.0:" || ss -tlnp | grep "0.0.0.0:"
echo ""

echo "3️⃣ Which process owns port 80 and 443:"
netstat -tlnp 2>/dev/null | grep -E ':(80|443)' || ss -tlnp | grep -E ':(80|443)'
echo ""

echo "4️⃣ Test if frontend is accessible directly from outside:"
echo "Run this from your LOCAL machine (not VPS):"
echo "  curl http://YOUR_VPS_IP:3001/api/health"
echo ""
echo "If that returns HTML, then port 3001 is exposed to internet"
echo "and Cloudflare might be hitting it directly"
echo ""

echo "5️⃣ Check Cloudflare origin settings:"
echo "In Cloudflare dashboard, check:"
echo "  - DNS: Should point to your VPS IP with proxy enabled (orange cloud)"
echo "  - SSL/TLS → Origin Server: Should use port 80 or 443"
echo "  - NOT port 3001!"

