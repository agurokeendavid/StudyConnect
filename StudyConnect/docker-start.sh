#!/bin/bash

# StudyConnect Docker Quick Start Script

echo "========================================="
echo "  StudyConnect Docker Setup"
echo "========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "? Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "? Docker is running"
echo ""

# Navigate to the StudyConnect directory
cd "$(dirname "$0")"

echo "?? Building and starting containers..."
echo ""

# Build and start containers
docker-compose up --build -d

# Wait for containers to be healthy
echo ""
echo "? Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "========================================="
    echo "  ? StudyConnect is now running!"
    echo "========================================="
    echo ""
    echo "?? Web Application: http://localhost:5000"
    echo "???  MySQL Database: localhost:3006"
    echo ""
    echo "?? View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "?? Stop containers:"
    echo "   docker-compose down"
    echo ""
    echo "========================================="
else
    echo ""
    echo "? Error: Containers failed to start. Check logs with:"
    echo "   docker-compose logs"
fi
