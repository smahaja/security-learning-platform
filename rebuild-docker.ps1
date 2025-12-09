# Docker Rebuild Script - Fixes File Upload Permissions
# Run this script to apply the permission fixes

Write-Host "🔧 Security Platform - Docker Permission Fix" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop existing container
Write-Host "📦 Step 1: Stopping existing container..." -ForegroundColor Yellow
docker-compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container stopped successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  No running container found (this is OK)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Ensure data directory exists and has proper permissions
Write-Host "📁 Step 2: Setting up data directory..." -ForegroundColor Yellow
if (-not (Test-Path ".\data")) {
    New-Item -ItemType Directory -Path ".\data" -Force | Out-Null
    Write-Host "✅ Created data directory" -ForegroundColor Green
}
if (-not (Test-Path ".\data\tutorials")) {
    New-Item -ItemType Directory -Path ".\data\tutorials" -Force | Out-Null
    Write-Host "✅ Created tutorials directory" -ForegroundColor Green
}

# Set permissions on Windows
try {
    icacls .\data /grant Everyone:(OI)(CI)F /T 2>$null | Out-Null
    Write-Host "✅ Set directory permissions" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not set permissions (may require admin rights)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Rebuild Docker image
Write-Host "🏗️  Step 3: Rebuilding Docker image (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image rebuilt successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed! Check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Start container
Write-Host "🚀 Step 4: Starting container..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start container! Check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Wait for container to be ready
Write-Host "⏳ Step 5: Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if container is running
$containerStatus = docker ps --filter "name=security-platform" --format "{{.Status}}"
if ($containerStatus) {
    Write-Host "✅ Container is running: $containerStatus" -ForegroundColor Green
} else {
    Write-Host "❌ Container is not running!" -ForegroundColor Red
    Write-Host "Check logs with: docker logs security-platform" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Verify permissions inside container
Write-Host "🔍 Step 6: Verifying permissions..." -ForegroundColor Yellow
$permCheck = docker exec security-platform ls -la /app/data 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Data directory is accessible inside container" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not verify permissions" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "  2. Go to admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "  3. Try uploading HTML content" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:    docker logs security-platform -f" -ForegroundColor White
Write-Host "  Stop app:     docker-compose down" -ForegroundColor White
Write-Host "  Restart app:  docker-compose restart" -ForegroundColor White
Write-Host "  Check status: docker ps" -ForegroundColor White
Write-Host ""
Write-Host "📁 Data Location:" -ForegroundColor Cyan
Write-Host "  Host:      .\data\" -ForegroundColor White
Write-Host "  Container: /app/data" -ForegroundColor White
Write-Host ""
