# FileForge Development Startup Script for Windows
# This script starts all required services for development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileForge Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if uv is installed
Write-Host "Checking uv..." -ForegroundColor Yellow
try {
    uv --version | Out-Null
    Write-Host "✓ uv is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ uv is not installed. Installing..." -ForegroundColor Yellow
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
}

# Start infrastructure
Write-Host ""
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
docker compose up -d postgres redis

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if containers are healthy
$postgresStatus = docker compose ps postgres --format json | ConvertFrom-Json | Select-Object -ExpandProperty State
$redisStatus = docker compose ps redis --format json | ConvertFrom-Json | Select-Object -ExpandProperty State

if ($postgresStatus -ne "running" -or $redisStatus -ne "running") {
    Write-Host "✗ Services are not running properly" -ForegroundColor Red
    Write-Host "Run 'docker compose ps' to check status" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Infrastructure services are running" -ForegroundColor Green

# Run migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
uv run alembic upgrade head

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Migrations completed" -ForegroundColor Green

# Get current directory
$projectRoot = $PWD

# Kill existing processes on ports 19000 and 3000
Write-Host ""
Write-Host "Checking for existing processes..." -ForegroundColor Yellow

$port19000 = Get-NetTCPConnection -LocalPort 19000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port19000) {
    $pid = $port19000.OwningProcess
    Write-Host "Killing process on port 19000 (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

if ($port3000) {
    $pid = $port3000.OwningProcess
    Write-Host "Killing process on port 3000 (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Start services in separate windows
Write-Host ""
Write-Host "Starting development services..." -ForegroundColor Yellow
Write-Host ""

# Start API
Write-Host "  → Starting Converter API (port 19000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot'; Write-Host 'Converter API - Port 19000' -ForegroundColor Green; Write-Host 'API Docs: http://localhost:19000/docs' -ForegroundColor Cyan; uv run uvicorn apps.converter_api.main:app --host 0.0.0.0 --port 19000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Worker
Write-Host "  → Starting Celery Worker..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot'; Write-Host 'Celery Worker' -ForegroundColor Green; uv run celery -A packages.common.core.celery_app worker --loglevel=info --pool=solo"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "  → Starting Frontend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\apps\frontend'; Write-Host 'Frontend - Port 3000' -ForegroundColor Green; Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Yellow
Write-Host "  • API Documentation: http://localhost:19000/docs" -ForegroundColor Cyan
Write-Host "  • Frontend:          http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • API Health:        http://localhost:19000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Three PowerShell windows have been opened for:" -ForegroundColor Yellow
Write-Host "  1. Converter API (FastAPI)" -ForegroundColor White
Write-Host "  2. Celery Worker (Background tasks)" -ForegroundColor White
Write-Host "  3. Frontend (Next.js)" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  • Close the three PowerShell windows" -ForegroundColor White
Write-Host "  • Run: docker compose stop postgres redis" -ForegroundColor White
Write-Host ""


