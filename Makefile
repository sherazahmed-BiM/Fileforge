# FileForge Makefile
# Development commands for the project

.PHONY: help install setup dev infra-up infra-down down logs clean lint format typecheck test migrate db-reset

# Default target
help:
	@echo "FileForge - Available Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup:"
	@echo "  make install        Install dependencies with uv"
	@echo "  make setup          Initial setup (copy .env, install deps)"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Start all services (API + Worker + Frontend) with Honcho"
	@echo "  make infra-up       Start PostgreSQL and Redis (Docker)"
	@echo "  make infra-down     Stop infrastructure services"
	@echo "  make down           Stop all Docker services"
	@echo "  make logs           View Docker logs (postgres, redis)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        Run database migrations"
	@echo "  make migrate-create Create new migration"
	@echo "  make db-reset       Reset database (WARNING: deletes data)"
	@echo "  make db-shell       Open PostgreSQL shell"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           Run linter (ruff)"
	@echo "  make lint-fix       Auto-fix linting issues"
	@echo "  make format         Format code"
	@echo "  make typecheck      Run type checker (mypy)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           Run all tests"
	@echo "  make test-cov       Run tests with coverage"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          Remove cache files"
	@echo "  make clean-all      Remove all generated files and volumes"

# ==================== Setup ====================

install:
	@echo "Installing Python dependencies..."
	uv sync
	@echo "Installing frontend dependencies..."
	cd apps/frontend && npm install
	@echo "Done! Run 'make infra-up' to start infrastructure."

setup:
	@echo "Setting up FileForge..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo "Please edit .env and configure your settings"; \
	fi
	@echo "Installing dependencies..."
	$(MAKE) install
	@echo "Setup complete! Run 'make dev' to start"

# ==================== Infrastructure ====================

infra-up:
	@echo "Starting infrastructure services (PostgreSQL + Redis)..."
	docker compose up -d postgres redis
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@echo "Infrastructure started on ports 15433 (PostgreSQL) and 16380 (Redis)"

infra-down:
	@echo "Stopping infrastructure services..."
	docker compose stop postgres redis
	@echo "Infrastructure stopped"

down:
	@echo "Stopping all Docker services..."
	docker compose down
	@echo "Docker services stopped"

logs:
	@echo "Viewing Docker infrastructure logs (PostgreSQL + Redis)..."
	docker compose logs -f postgres redis

logs-postgres:
	docker compose logs -f postgres

logs-redis:
	docker compose logs -f redis

# ==================== Development ====================

dev:
	@echo "Killing existing processes on ports 19000 and 3000..."
	@bash -c 'for port in 19000 3000; do for pid in $$(lsof -ti:$$port 2>/dev/null); do [ -n "$$pid" ] && kill -9 $$pid 2>/dev/null || true; done; done' || true
	@echo "Killing existing Celery workers..."
	@bash -c 'for pid in $$(ps aux | grep -E "[c]elery.*worker" | awk "{print \$$2}" 2>/dev/null); do [ -n "$$pid" ] && kill -9 $$pid 2>/dev/null || true; done' || true
	@sleep 1
	@echo "Starting Converter API (19000), Worker, and Frontend (3000)..."
	@echo "API Docs: http://localhost:19000/docs"
	@echo "Frontend: http://localhost:3000"
	uv run honcho start -f Procfile.dev

api:
	@echo "Starting Converter API only..."
	@echo "Docs: http://localhost:19000/docs"
	uv run uvicorn apps.converter_api.main:app --host 0.0.0.0 --port 19000 --reload

worker:
	@echo "Starting Celery worker only..."
	uv run celery -A packages.common.core.celery_app worker --loglevel=info --pool=solo

worker-beat:
	@echo "Starting Celery beat scheduler..."
	uv run celery -A packages.common.core.celery_app beat --loglevel=info

# ==================== Database ====================

migrate:
	@echo "Running database migrations..."
	uv run alembic upgrade head

migrate-create:
	@read -p "Enter migration message: " msg; \
	uv run alembic revision --autogenerate -m "$$msg"

migrate-down:
	@echo "Rolling back last migration..."
	uv run alembic downgrade -1

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker compose down -v; \
		docker compose up -d; \
		sleep 5; \
		uv run alembic upgrade head; \
		echo "Database reset complete."; \
	fi

db-shell:
	docker compose exec postgres psql -U fileforge -d fileforge

# ==================== Code Quality ====================

lint:
	@echo "Running linter..."
	uv run ruff check packages apps tests

lint-fix:
	@echo "Fixing linting issues..."
	uv run ruff check --fix packages apps tests

format:
	@echo "Formatting code..."
	uv run ruff format packages apps tests

typecheck:
	@echo "Running type checker..."
	uv run mypy packages apps

check: lint typecheck
	@echo "All checks passed!"

# ==================== Testing ====================

test:
	@echo "Running tests..."
	uv run pytest tests/ -v

test-cov:
	@echo "Running tests with coverage..."
	uv run pytest tests/ -v --cov=packages --cov=apps --cov-report=html --cov-report=term-missing

test-unit:
	@echo "Running unit tests..."
	uv run pytest tests/unit -v

test-integration:
	@echo "Running integration tests..."
	uv run pytest tests/integration -v

# ==================== Cleanup ====================

clean:
	@echo "Cleaning Python cache files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov .coverage
	@echo "Cache cleaned"

clean-all: down clean
	@echo "Removing all Docker volumes..."
	docker compose down -v
	@echo "All cleaned"

# ==================== Docker ====================

docker-build:
	@echo "Building Docker images..."
	docker build -f Dockerfile.converter-api -t fileforge-api .
	docker build -f Dockerfile.worker -t fileforge-worker .

docker-run:
	@echo "Running with Docker Compose..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ==================== API Endpoints (for testing) ====================

health:
	@curl -s http://localhost:19000/health | jq .

api-docs:
	@echo "Opening API documentation..."
	@xdg-open http://localhost:19000/docs 2>/dev/null || open http://localhost:19000/docs
