# FileForge - Windows Setup Guide

This guide provides Windows-specific instructions for running FileForge on Windows 10/11.

## Prerequisites

1. **Python 3.11+** - Download from [python.org](https://www.python.org/downloads/)
2. **Node.js 20.9.0+** - Download from [nodejs.org](https://nodejs.org/)
3. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
4. **uv package manager** - Install with:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
   Or using pip:
   ```powershell
   pip install uv
   ```

## Step-by-Step Setup

### 1. Install Dependencies

Open PowerShell in the project directory and run:

```powershell
# Install Python dependencies
uv sync

# Install frontend dependencies
cd apps/frontend
npm install
cd ../..
```

### 2. Create Environment File

Create a `.env` file in the project root with:

```env
# Database
DATABASE_URL=postgresql+asyncpg://fileforge:fileforge@localhost:15433/fileforge

# Redis
REDIS_URL=redis://localhost:16380/0

# Celery
CELERY_BROKER_URL=redis://localhost:16380/1
CELERY_RESULT_BACKEND=redis://localhost:16380/2

# File Processing
MAX_FILE_SIZE=104857600
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=100

# OCR (optional)
OCR_ENABLED=true
OCR_LANGUAGES=eng
```

### 3. Start Infrastructure (PostgreSQL + Redis)

```powershell
# Start Docker containers
docker compose up -d postgres redis

# Wait a few seconds for services to start
Start-Sleep -Seconds 5

# Verify containers are running
docker ps
```

You should see `fileforge-postgres` and `fileforge-redis` containers running.

### 4. Run Database Migrations

```powershell
uv run alembic upgrade head
```

### 5. Start Development Servers

You need to run three services. Open **three separate PowerShell windows**:

#### Terminal 1 - Converter API
```powershell
uv run uvicorn apps.converter_api.main:app --host 0.0.0.0 --port 19000 --reload
```

#### Terminal 2 - Celery Worker
```powershell
uv run celery -A packages.common.core.celery_app worker --loglevel=info --pool=solo
```

#### Terminal 3 - Frontend
```powershell
cd apps/frontend
npm run dev
```

## Access the Application

- **API Documentation**: http://localhost:19000/docs
- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:19000/health

## Windows-Specific Commands

### Start Infrastructure
```powershell
docker compose up -d postgres redis
```

### Stop Infrastructure
```powershell
docker compose stop postgres redis
```

### View Logs
```powershell
# All infrastructure logs
docker compose logs -f postgres redis

# Just PostgreSQL
docker compose logs -f postgres

# Just Redis
docker compose logs -f redis
```

### Database Commands
```powershell
# Run migrations
uv run alembic upgrade head

# Create new migration
uv run alembic revision --autogenerate -m "migration message"

# Rollback last migration
uv run alembic downgrade -1

# Open PostgreSQL shell
docker compose exec postgres psql -U fileforge -d fileforge
```

### Code Quality
```powershell
# Run linter
uv run ruff check packages apps tests

# Fix linting issues
uv run ruff check --fix packages apps tests

# Format code
uv run ruff format packages apps tests

# Type checking
uv run mypy packages apps
```

### Testing
```powershell
# Run all tests
uv run pytest tests/ -v

# Run with coverage
uv run pytest tests/ -v --cov=packages --cov=apps --cov-report=html
```

### Cleanup
```powershell
# Stop all Docker services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Clean Python cache
Get-ChildItem -Path . -Include __pycache__,*.pyc,*.pyo -Recurse | Remove-Item -Force -Recurse
```

## Troubleshooting

### Port Already in Use

If port 19000 or 3000 is already in use:

```powershell
# Find process using port 19000
netstat -ano | findstr :19000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# For port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Docker Not Running

Make sure Docker Desktop is running. Check with:
```powershell
docker ps
```

### Database Connection Issues

1. Verify containers are running: `docker ps`
2. Check container health: `docker compose ps`
3. Restart containers: `docker compose restart postgres redis`

### Python/uv Issues

If `uv` command is not found:
```powershell
# Add to PATH or use full path
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

Or reinstall uv:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Celery Worker Issues

If the worker fails to start, ensure Redis is running:
```powershell
docker compose ps redis
```

## Quick Start Script (Optional)

You can create a PowerShell script to start all services. Create `start-dev.ps1`:

```powershell
# start-dev.ps1
Write-Host "Starting FileForge development environment..." -ForegroundColor Green

# Start infrastructure
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker compose up -d postgres redis
Start-Sleep -Seconds 3

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
uv run alembic upgrade head

Write-Host "`nStarting services in separate windows..." -ForegroundColor Green
Write-Host "API: http://localhost:19000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan

# Start API in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; uv run uvicorn apps.converter_api.main:app --host 0.0.0.0 --port 19000 --reload"

# Start Worker in new window
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; uv run celery -A packages.common.core.celery_app worker --loglevel=info --pool=solo"

# Start Frontend in new window
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\frontend'; npm run dev"
```

Run it with:
```powershell
.\start-dev.ps1
```

## Notes

- The Makefile commands won't work directly in Windows PowerShell/CMD
- Use the PowerShell equivalents provided above
- Alternatively, use WSL2 (Windows Subsystem for Linux) if you prefer Linux commands
- All Docker commands work the same on Windows


