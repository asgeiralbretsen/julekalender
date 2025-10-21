#!/bin/bash

# Database setup script for the Julekalender backend

echo "Setting up database..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec julekalender-postgres pg_isready -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Run migrations
echo "Running database migrations..."
cd /Users/asgeiralbretsen/Repositories/julekalender/apps/backend
dotnet ef database update

echo "Database setup complete!"
