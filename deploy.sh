#!/bin/bash

set -e

cd /opt/julekalender

echo "Pulling latest code (should already be done by CI)..."
git pull origin main

echo "Stopping existing containers (keeping named volumes, including postgres_data)..."
podman-compose -f docker-compose.prod.yml down

echo "Building and starting containers with Podman..."
podman-compose -f docker-compose.prod.yml up -d --build

echo "Waiting a few seconds for services to settle..."
sleep 10

echo "Current container status:"
podman-compose -f docker-compose.prod.yml ps

echo "Deployment completed."