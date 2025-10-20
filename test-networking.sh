#!/bin/bash

echo "Testing Julekalender Networking Setup"
echo "====================================="

echo ""
echo "1. Testing local backend (port 5002)..."
curl -s http://localhost:5002/api/health || echo "❌ Backend not accessible on localhost:5002"

echo ""
echo "2. Testing local frontend (port 3001)..."
curl -s http://localhost:3001 | head -n 5 || echo "❌ Frontend not accessible on localhost:3001"

echo ""
echo "3. Testing Caddy proxy (if running)..."
curl -s https://julekalender.albretsen.no/api/health || echo "❌ Caddy proxy not accessible"

echo ""
echo "4. Testing frontend through Caddy (if running)..."
curl -s https://julekalender.albretsen.no | head -n 5 || echo "❌ Frontend through Caddy not accessible"

echo ""
echo "5. Checking Docker containers..."
docker ps --filter "name=julekalender" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Test completed!"
