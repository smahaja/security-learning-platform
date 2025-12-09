#!/bin/bash
# Docker Permission Fix - Ubuntu/Linux Deployment Script
# Run this script on your Ubuntu machine after pulling the changes

set -e  # Exit on error

echo "🔧 Security Platform - Docker Permission Fix (Ubuntu)"
echo "====================================================="
echo ""

# Step 1: Pull latest changes
echo "📥 Step 1: Pulling latest changes from git..."
git pull origin master
if [ $? -eq 0 ]; then
    echo "✅ Changes pulled successfully"
else
    echo "❌ Failed to pull changes!"
    exit 1
fi
echo ""

# Step 2: Stop existing container
echo "📦 Step 2: Stopping existing container..."
docker-compose down
if [ $? -eq 0 ]; then
    echo "✅ Container stopped successfully"
else
    echo "⚠️  No running container found (this is OK)"
fi
echo ""

# Step 3: Ensure data directory exists and has proper permissions
echo "📁 Step 3: Setting up data directory..."
mkdir -p ./data/tutorials
chmod -R 755 ./data
echo "✅ Data directory permissions set"
echo ""

# Step 4: Rebuild Docker image
echo "🏗️  Step 4: Rebuilding Docker image (this may take a few minutes)..."
docker-compose build --no-cache
if [ $? -eq 0 ]; then
    echo "✅ Image rebuilt successfully"
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi
echo ""

# Step 5: Start container
echo "🚀 Step 5: Starting container..."
docker-compose up -d
if [ $? -eq 0 ]; then
    echo "✅ Container started successfully"
else
    echo "❌ Failed to start container! Check the error messages above."
    exit 1
fi
echo ""

# Step 6: Wait for container to be ready
echo "⏳ Step 6: Waiting for application to start..."
sleep 5

# Check if container is running
if docker ps --filter "name=security-platform" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running!"
    echo "Check logs with: docker logs security-platform"
    exit 1
fi
echo ""

# Step 7: Verify permissions inside container
echo "🔍 Step 7: Verifying permissions..."
if docker exec security-platform ls -la /app/data > /dev/null 2>&1; then
    echo "✅ Data directory is accessible inside container"
    echo ""
    echo "Directory contents:"
    docker exec security-platform ls -la /app/data
else
    echo "⚠️  Could not verify permissions"
fi
echo ""

# Final summary
echo "====================================================="
echo "🎉 Deployment Complete!"
echo "====================================================="
echo ""
echo "📊 Next Steps:"
echo "  1. Open browser: http://localhost:3000"
echo "  2. Go to admin: http://localhost:3000/admin"
echo "  3. Try uploading HTML content"
echo ""
echo "🔧 Useful Commands:"
echo "  View logs:    docker logs security-platform -f"
echo "  Stop app:     docker-compose down"
echo "  Restart app:  docker-compose restart"
echo "  Check status: docker ps"
echo ""
echo "📁 Data Location:"
echo "  Host:      ./data/"
echo "  Container: /app/data"
echo ""
