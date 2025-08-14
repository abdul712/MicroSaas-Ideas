# Lead Scoring Tool - Development Makefile

.PHONY: help install dev build test clean deploy

# Default target
help: ## Show this help message
	@echo "Lead Scoring Tool - Development Commands"
	@echo "======================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Setup
install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm run install:all
	@echo "Dependencies installed successfully!"

setup: ## Setup development environment
	@echo "Setting up development environment..."
	cp .env.example .env
	docker-compose up -d postgres redis clickhouse mongodb kafka elasticsearch minio mlflow
	@echo "Waiting for services to be ready..."
	sleep 30
	npm run install:all
	make migrate
	@echo "Development environment ready!"

# Development
dev: ## Start development servers
	@echo "Starting development servers..."
	docker-compose up -d postgres redis clickhouse mongodb kafka
	npm run dev

dev-full: ## Start full development environment
	@echo "Starting full development environment..."
	docker-compose up -d

# Database
migrate: ## Run database migrations
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

migrate-create: ## Create new migration
	@echo "Creating new migration..."
	@read -p "Enter migration name: " name; \
	cd backend && alembic revision --autogenerate -m "$$name"

migrate-rollback: ## Rollback last migration
	@echo "Rolling back last migration..."
	cd backend && alembic downgrade -1

# Testing
test: ## Run all tests
	@echo "Running tests..."
	npm run test

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm test

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	cd backend && python -m pytest

test-ml: ## Run ML service tests
	@echo "Running ML service tests..."
	cd ml-services && python -m pytest

test-e2e: ## Run end-to-end tests
	@echo "Running E2E tests..."
	cd frontend && npm run test:e2e

coverage: ## Generate test coverage reports
	@echo "Generating coverage reports..."
	cd frontend && npm run test:coverage
	cd backend && python -m pytest --cov=app --cov-report=html
	cd ml-services && python -m pytest --cov=. --cov-report=html

# Code Quality
lint: ## Run linting
	@echo "Running linters..."
	cd frontend && npm run lint
	cd backend && black . && isort . && flake8 .
	cd ml-services && black . && isort . && flake8 .

format: ## Format code
	@echo "Formatting code..."
	cd frontend && npm run lint:fix
	cd backend && black . && isort .
	cd ml-services && black . && isort .

type-check: ## Run type checking
	@echo "Running type checks..."
	cd frontend && npm run type-check
	cd backend && mypy .
	cd ml-services && mypy .

# Building
build: ## Build production images
	@echo "Building production images..."
	docker-compose build

build-frontend: ## Build frontend only
	@echo "Building frontend..."
	cd frontend && npm run build

build-backend: ## Build backend only
	@echo "Building backend..."
	docker build -t lead-scoring-backend ./backend

build-ml: ## Build ML services only
	@echo "Building ML services..."
	docker build -t lead-scoring-ml ./ml-services

# Data Management
seed-data: ## Seed development data
	@echo "Seeding development data..."
	cd backend && python scripts/seed_data.py

reset-db: ## Reset database (WARNING: Destroys all data)
	@echo "Resetting database..."
	@read -p "Are you sure? This will destroy all data. Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose down postgres; \
		docker volume rm lead-scoring-tool_postgres_data; \
		docker-compose up -d postgres; \
		sleep 10; \
		make migrate; \
		make seed-data; \
	else \
		echo "Database reset cancelled."; \
	fi

backup-db: ## Backup database
	@echo "Backing up database..."
	mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres lead_scoring > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database from backup
	@echo "Available backups:"
	@ls -la backups/
	@read -p "Enter backup filename: " filename; \
	docker-compose exec -T postgres psql -U postgres lead_scoring < backups/$$filename

# ML Operations
train-models: ## Train ML models
	@echo "Training ML models..."
	cd ml-services && python scripts/train_models.py

deploy-models: ## Deploy trained models
	@echo "Deploying ML models..."
	cd ml-services && python scripts/deploy_models.py

# Deployment
deploy-staging: ## Deploy to staging
	@echo "Deploying to staging..."
	docker-compose -f docker-compose.staging.yml up -d

deploy-prod: ## Deploy to production
	@echo "Deploying to production..."
	@echo "Please use your production deployment pipeline"
	@echo "Example: kubectl apply -f deploy/k8s/"

# Monitoring
logs: ## View application logs
	@echo "Viewing logs..."
	docker-compose logs -f backend frontend ml-services

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-ml: ## View ML service logs
	docker-compose logs -f ml-services

metrics: ## View metrics
	@echo "Opening Grafana dashboard..."
	open http://localhost:3001

# Cleanup
clean: ## Clean up development environment
	@echo "Cleaning up..."
	docker-compose down
	docker system prune -f
	rm -rf frontend/.next frontend/node_modules backend/__pycache__ ml-services/__pycache__

clean-all: ## Clean everything including volumes
	@echo "Cleaning everything..."
	docker-compose down -v
	docker system prune -af
	rm -rf frontend/.next frontend/node_modules backend/__pycache__ ml-services/__pycache__

# Security
security-scan: ## Run security scans
	@echo "Running security scans..."
	cd frontend && npm audit
	cd backend && safety check
	cd ml-services && safety check

# Documentation
docs: ## Generate documentation
	@echo "Generating documentation..."
	cd backend && mkdocs build
	@echo "Documentation available at: backend/site/index.html"

docs-serve: ## Serve documentation locally
	@echo "Serving documentation..."
	cd backend && mkdocs serve

# Environment Management
env-example: ## Create .env.example file
	@echo "Creating .env.example..."
	cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lead_scoring

# Redis
REDIS_URL=redis://localhost:6379/0

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_DATABASE=lead_scoring_analytics

# MongoDB
MONGODB_URL=mongodb://admin:admin@localhost:27017/lead_scoring_logs?authSource=admin

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# Security
SECRET_KEY=your-secret-key-here

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# External APIs (optional)
OPENAI_API_KEY=
SENDGRID_API_KEY=
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring (optional)
SENTRY_DSN=
EOF
	@echo ".env.example created!"

# Health Checks
health: ## Check service health
	@echo "Checking service health..."
	@echo "Backend API:"
	@curl -s http://localhost:8000/health | jq . || echo "Backend not running"
	@echo "Frontend:"
	@curl -s http://localhost:3000/api/health | jq . || echo "Frontend not running"
	@echo "ML Services:"
	@curl -s http://localhost:8001/health | jq . || echo "ML services not running"

# Quick start for new developers
quickstart: ## Quick start for new developers
	@echo "🚀 Lead Scoring Tool - Quick Start"
	@echo "================================="
	@echo "1. Setting up environment..."
	make env-example
	@echo "2. Starting services..."
	make setup
	@echo "3. Starting development servers..."
	make dev
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "🌐 Access points:"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  ML Services: http://localhost:8001"
	@echo "  Grafana:     http://localhost:3001"
	@echo "  MLflow:      http://localhost:5000"
	@echo ""
	@echo "📖 Next steps:"
	@echo "  - Edit .env file with your settings"
	@echo "  - Run 'make test' to verify everything works"
	@echo "  - Check 'make help' for all available commands"