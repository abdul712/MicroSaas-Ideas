# Lead Scoring Tool - Development Makefile
# Comprehensive automation for development, testing, and deployment

.PHONY: help install dev test build deploy clean lint format security
.DEFAULT_GOAL := help

# Colors for terminal output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
MAGENTA := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
RESET := \033[0m

# Project configuration
PROJECT_NAME := lead-scoring-tool
DOCKER_REGISTRY := localhost:5000
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
TIMESTAMP := $(shell date +%Y%m%d%H%M%S)

# Environment configuration
ENV ?= development
COMPOSE_FILE := docker-compose.yml
COMPOSE_FILE_OVERRIDE := docker-compose.override.yml

# Help target
help: ## Show this help message
	@echo "$(CYAN)Lead Scoring Tool - Development Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)Quick Start:$(RESET)"
	@echo "  make quickstart    - Complete setup and start all services"
	@echo "  make dev          - Start development environment"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean up everything"
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

##@ Quick Start Commands

quickstart: ## Complete setup and start all services (one-command start)
	@echo "$(GREEN)🚀 Starting Lead Scoring Tool - Complete Setup$(RESET)"
	@echo "$(YELLOW)📋 This will:$(RESET)"
	@echo "  - Install all dependencies"
	@echo "  - Set up development environment"
	@echo "  - Start all services"
	@echo "  - Run initial database setup"
	@echo ""
	@make install
	@make setup-env
	@make db-setup
	@make dev-start
	@echo ""
	@echo "$(GREEN)✅ Lead Scoring Tool is ready!$(RESET)"
	@echo "$(CYAN)🌐 Access Points:$(RESET)"
	@echo "  Frontend:     http://localhost:3000"
	@echo "  Backend API:  http://localhost:8000"
	@echo "  ML Services:  http://localhost:8001"
	@echo "  Grafana:      http://localhost:3001"
	@echo "  Docs:         http://localhost:8000/docs"

##@ Installation & Setup

install: ## Install all dependencies
	@echo "$(GREEN)📦 Installing dependencies...$(RESET)"
	@make install-frontend
	@make install-backend
	@make install-ml
	@make install-tools
	@echo "$(GREEN)✅ All dependencies installed$(RESET)"

install-frontend: ## Install frontend dependencies
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	@cd frontend && npm install

install-backend: ## Install backend dependencies
	@echo "$(CYAN)Installing backend dependencies...$(RESET)"
	@cd backend && pip install -r requirements.txt -r requirements-dev.txt

install-ml: ## Install ML service dependencies
	@echo "$(CYAN)Installing ML service dependencies...$(RESET)"
	@cd ml-services && pip install -r requirements.txt -r requirements-dev.txt

install-tools: ## Install development tools
	@echo "$(CYAN)Installing development tools...$(RESET)"
	@npm install -g @commitlint/cli @commitlint/config-conventional
	@pip install pre-commit black isort flake8 mypy
	@pre-commit install

setup-env: ## Set up environment variables
	@echo "$(CYAN)Setting up environment variables...$(RESET)"
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(YELLOW)⚠️  Please configure .env file with your settings$(RESET)"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/.env.example frontend/.env.local; fi
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
	@if [ ! -f ml-services/.env ]; then cp ml-services/.env.example ml-services/.env; fi

##@ Development Commands

dev: dev-start ## Start development environment (alias for dev-start)

dev-start: ## Start all development services
	@echo "$(GREEN)🔧 Starting development environment...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) -f $(COMPOSE_FILE_OVERRIDE) up -d --build
	@echo "$(GREEN)✅ Development environment started$(RESET)"
	@make show-services

dev-stop: ## Stop all development services
	@echo "$(YELLOW)⏹️  Stopping development environment...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) -f $(COMPOSE_FILE_OVERRIDE) down
	@echo "$(GREEN)✅ Development environment stopped$(RESET)"

dev-restart: ## Restart development environment
	@make dev-stop
	@make dev-start

dev-logs: ## Show logs from all services
	@docker-compose -f $(COMPOSE_FILE) -f $(COMPOSE_FILE_OVERRIDE) logs -f

dev-frontend: ## Start frontend development server only
	@echo "$(CYAN)Starting frontend development server...$(RESET)"
	@cd frontend && npm run dev

dev-backend: ## Start backend development server only
	@echo "$(CYAN)Starting backend development server...$(RESET)"
	@cd backend && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-ml: ## Start ML services development server only
	@echo "$(CYAN)Starting ML services development server...$(RESET)"
	@cd ml-services && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8001

show-services: ## Show running services and their URLs
	@echo "$(CYAN)🌐 Service URLs:$(RESET)"
	@echo "  Frontend (Next.js):     http://localhost:3000"
	@echo "  Backend API (FastAPI):  http://localhost:8000"
	@echo "  ML Services:            http://localhost:8001"
	@echo "  PostgreSQL:             localhost:5432"
	@echo "  Redis:                  localhost:6379"
	@echo "  ClickHouse:             localhost:8123"
	@echo "  Kafka:                  localhost:9092"
	@echo "  Grafana:                http://localhost:3001"
	@echo "  Prometheus:             http://localhost:9090"
	@echo "  Jupyter:                http://localhost:8888"
	@echo ""
	@echo "$(CYAN)📖 Documentation:$(RESET)"
	@echo "  API Docs (Swagger):     http://localhost:8000/docs"
	@echo "  API Docs (ReDoc):       http://localhost:8000/redoc"
	@echo "  ML API Docs:            http://localhost:8001/docs"

##@ Database Commands

db-setup: ## Set up databases and run migrations
	@echo "$(GREEN)🗄️  Setting up databases...$(RESET)"
	@make db-wait
	@make db-migrate
	@make db-seed
	@echo "$(GREEN)✅ Database setup complete$(RESET)"

db-wait: ## Wait for database services to be ready
	@echo "$(CYAN)Waiting for database services...$(RESET)"
	@docker-compose exec -T postgres pg_isready -U postgres || (echo "Starting databases..." && sleep 10)
	@docker-compose exec -T redis redis-cli ping || sleep 5

db-migrate: ## Run database migrations
	@echo "$(CYAN)Running database migrations...$(RESET)"
	@cd backend && python -m alembic upgrade head

db-seed: ## Seed database with initial data
	@echo "$(CYAN)Seeding database with initial data...$(RESET)"
	@cd backend && python -m src.scripts.seed_data

db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)⚠️  Resetting database - ALL DATA WILL BE LOST$(RESET)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	@docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS lead_scoring;"
	@docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE lead_scoring;"
	@make db-migrate
	@make db-seed

db-shell: ## Open database shell
	@docker-compose exec postgres psql -U postgres -d lead_scoring

db-backup: ## Create database backup
	@echo "$(CYAN)Creating database backup...$(RESET)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U postgres lead_scoring > backups/backup_$(TIMESTAMP).sql
	@echo "$(GREEN)✅ Backup created: backups/backup_$(TIMESTAMP).sql$(RESET)"

##@ Testing Commands

test: ## Run all tests
	@echo "$(GREEN)🧪 Running all tests...$(RESET)"
	@make test-frontend
	@make test-backend
	@make test-ml
	@make test-integration
	@echo "$(GREEN)✅ All tests completed$(RESET)"

test-frontend: ## Run frontend tests
	@echo "$(CYAN)Running frontend tests...$(RESET)"
	@cd frontend && npm run test

test-backend: ## Run backend tests
	@echo "$(CYAN)Running backend tests...$(RESET)"
	@cd backend && python -m pytest tests/ -v --cov=src --cov-report=html --cov-report=term

test-ml: ## Run ML service tests
	@echo "$(CYAN)Running ML service tests...$(RESET)"
	@cd ml-services && python -m pytest tests/ -v --cov=src --cov-report=html --cov-report=term

test-integration: ## Run integration tests
	@echo "$(CYAN)Running integration tests...$(RESET)"
	@cd tests && python -m pytest integration/ -v

test-e2e: ## Run end-to-end tests
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	@cd frontend && npm run test:e2e

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	@cd frontend && npm run test:watch

coverage: ## Generate comprehensive test coverage report
	@echo "$(GREEN)📊 Generating coverage reports...$(RESET)"
	@make test-backend
	@make test-ml
	@cd frontend && npm run coverage
	@echo "$(GREEN)✅ Coverage reports generated$(RESET)"
	@echo "$(CYAN)📖 Coverage Reports:$(RESET)"
	@echo "  Backend:  backend/htmlcov/index.html"
	@echo "  ML:       ml-services/htmlcov/index.html"
	@echo "  Frontend: frontend/coverage/lcov-report/index.html"

##@ Code Quality Commands

lint: ## Run linting for all code
	@echo "$(GREEN)🔍 Running linting...$(RESET)"
	@make lint-frontend
	@make lint-backend
	@make lint-ml
	@echo "$(GREEN)✅ Linting completed$(RESET)"

lint-frontend: ## Run frontend linting
	@echo "$(CYAN)Linting frontend code...$(RESET)"
	@cd frontend && npm run lint

lint-backend: ## Run backend linting
	@echo "$(CYAN)Linting backend code...$(RESET)"
	@cd backend && flake8 src tests
	@cd backend && mypy src

lint-ml: ## Run ML service linting
	@echo "$(CYAN)Linting ML service code...$(RESET)"
	@cd ml-services && flake8 src tests
	@cd ml-services && mypy src

format: ## Format all code
	@echo "$(GREEN)🎨 Formatting code...$(RESET)"
	@make format-frontend
	@make format-backend
	@make format-ml
	@echo "$(GREEN)✅ Code formatting completed$(RESET)"

format-frontend: ## Format frontend code
	@echo "$(CYAN)Formatting frontend code...$(RESET)"
	@cd frontend && npm run format

format-backend: ## Format backend code
	@echo "$(CYAN)Formatting backend code...$(RESET)"
	@cd backend && black src tests
	@cd backend && isort src tests

format-ml: ## Format ML service code
	@echo "$(CYAN)Formatting ML service code...$(RESET)"
	@cd ml-services && black src tests
	@cd ml-services && isort src tests

type-check: ## Run type checking
	@echo "$(CYAN)Running type checks...$(RESET)"
	@cd frontend && npm run type-check
	@cd backend && mypy src
	@cd ml-services && mypy src

##@ Security Commands

security: ## Run security scans
	@echo "$(GREEN)🔒 Running security scans...$(RESET)"
	@make security-deps
	@make security-code
	@make security-containers
	@echo "$(GREEN)✅ Security scans completed$(RESET)"

security-deps: ## Check for dependency vulnerabilities
	@echo "$(CYAN)Scanning dependencies for vulnerabilities...$(RESET)"
	@cd frontend && npm audit
	@cd backend && safety check
	@cd ml-services && safety check

security-code: ## Run static code security analysis
	@echo "$(CYAN)Running static code security analysis...$(RESET)"
	@cd backend && bandit -r src/
	@cd ml-services && bandit -r src/

security-containers: ## Scan Docker images for vulnerabilities
	@echo "$(CYAN)Scanning Docker images for vulnerabilities...$(RESET)"
	@docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(PROJECT_NAME)-frontend:latest
	@docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(PROJECT_NAME)-backend:latest

##@ Build Commands

build: ## Build all services for production
	@echo "$(GREEN)🏗️  Building all services...$(RESET)"
	@make build-frontend
	@make build-backend
	@make build-ml
	@echo "$(GREEN)✅ All services built$(RESET)"

build-frontend: ## Build frontend for production
	@echo "$(CYAN)Building frontend...$(RESET)"
	@cd frontend && npm run build

build-backend: ## Build backend Docker image
	@echo "$(CYAN)Building backend Docker image...$(RESET)"
	@docker build -t $(PROJECT_NAME)-backend:$(VERSION) -f backend/Dockerfile backend/

build-ml: ## Build ML services Docker image
	@echo "$(CYAN)Building ML services Docker image...$(RESET)"
	@docker build -t $(PROJECT_NAME)-ml:$(VERSION) -f ml-services/Dockerfile ml-services/

build-prod: ## Build production Docker images
	@echo "$(GREEN)🏭 Building production images...$(RESET)"
	@docker-compose -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ Production images built$(RESET)"

##@ Deployment Commands

deploy: deploy-staging ## Deploy to staging (default)

deploy-staging: ## Deploy to staging environment
	@echo "$(GREEN)🚀 Deploying to staging...$(RESET)"
	@kubectl apply -f k8s/staging/ --recursive
	@echo "$(GREEN)✅ Deployed to staging$(RESET)"

deploy-prod: ## Deploy to production environment
	@echo "$(RED)🚀 Deploying to production...$(RESET)"
	@read -p "Are you sure you want to deploy to PRODUCTION? (y/N): " confirm && [ "$$confirm" = "y" ]
	@kubectl apply -f k8s/production/ --recursive
	@echo "$(GREEN)✅ Deployed to production$(RESET)"

deploy-local: ## Deploy locally using Kubernetes
	@echo "$(CYAN)🚀 Deploying to local Kubernetes...$(RESET)"
	@kubectl apply -f k8s/local/ --recursive
	@echo "$(GREEN)✅ Deployed to local Kubernetes$(RESET)"

##@ Monitoring Commands

monitor: ## Start monitoring stack
	@echo "$(GREEN)📊 Starting monitoring stack...$(RESET)"
	@docker-compose -f docker-compose.monitoring.yml up -d
	@echo "$(GREEN)✅ Monitoring stack started$(RESET)"
	@echo "$(CYAN)📊 Monitoring URLs:$(RESET)"
	@echo "  Grafana:     http://localhost:3001"
	@echo "  Prometheus:  http://localhost:9090"
	@echo "  Jaeger:      http://localhost:16686"

logs: ## Show application logs
	@docker-compose logs -f --tail=100

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-ml: ## Show ML service logs
	@docker-compose logs -f ml-services

health: ## Check health of all services
	@echo "$(CYAN)🏥 Checking service health...$(RESET)"
	@curl -f http://localhost:8000/health || echo "Backend: DOWN"
	@curl -f http://localhost:8001/health || echo "ML Services: DOWN"
	@curl -f http://localhost:3000/api/health || echo "Frontend: DOWN"

##@ Data Commands

data-import: ## Import sample data
	@echo "$(CYAN)📊 Importing sample data...$(RESET)"
	@cd backend && python -m src.scripts.import_sample_data

data-export: ## Export data
	@echo "$(CYAN)📤 Exporting data...$(RESET)"
	@cd backend && python -m src.scripts.export_data

data-anonymize: ## Anonymize sensitive data
	@echo "$(CYAN)🔒 Anonymizing sensitive data...$(RESET)"
	@cd backend && python -m src.scripts.anonymize_data

##@ Machine Learning Commands

ml-train: ## Train ML models
	@echo "$(GREEN)🤖 Training ML models...$(RESET)"
	@cd ml-services && python -m src.training.train_models

ml-evaluate: ## Evaluate ML model performance
	@echo "$(CYAN)📊 Evaluating ML models...$(RESET)"
	@cd ml-services && python -m src.evaluation.evaluate_models

ml-deploy-models: ## Deploy trained models to serving
	@echo "$(CYAN)🚀 Deploying ML models...$(RESET)"
	@cd ml-services && python -m src.deployment.deploy_models

ml-notebook: ## Start Jupyter notebook for ML experimentation
	@echo "$(CYAN)📓 Starting Jupyter notebook...$(RESET)"
	@cd ml-services && jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root

##@ Documentation Commands

docs: ## Generate documentation
	@echo "$(GREEN)📚 Generating documentation...$(RESET)"
	@make docs-api
	@make docs-frontend
	@echo "$(GREEN)✅ Documentation generated$(RESET)"

docs-api: ## Generate API documentation
	@echo "$(CYAN)Generating API documentation...$(RESET)"
	@cd backend && python -m src.scripts.generate_api_docs

docs-frontend: ## Generate frontend documentation
	@echo "$(CYAN)Generating frontend documentation...$(RESET)"
	@cd frontend && npm run docs

docs-serve: ## Serve documentation locally
	@echo "$(CYAN)Serving documentation...$(RESET)"
	@cd docs && python -m http.server 8080

##@ Utility Commands

clean: ## Clean up all generated files and containers
	@echo "$(YELLOW)🧹 Cleaning up...$(RESET)"
	@make clean-docker
	@make clean-files
	@echo "$(GREEN)✅ Cleanup completed$(RESET)"

clean-docker: ## Clean up Docker containers and images
	@echo "$(CYAN)Cleaning Docker containers and images...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f

clean-files: ## Clean up generated files
	@echo "$(CYAN)Cleaning generated files...$(RESET)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true

shell: ## Open shell in backend container
	@docker-compose exec backend bash

shell-ml: ## Open shell in ML services container
	@docker-compose exec ml-services bash

shell-db: ## Open PostgreSQL shell
	@docker-compose exec postgres psql -U postgres -d lead_scoring

redis-cli: ## Open Redis CLI
	@docker-compose exec redis redis-cli

backup: ## Create full system backup
	@echo "$(GREEN)💾 Creating system backup...$(RESET)"
	@mkdir -p backups/$(TIMESTAMP)
	@make db-backup
	@docker run --rm -v $(PWD):/backup alpine tar czf /backup/backups/$(TIMESTAMP)/files.tar.gz /backup --exclude=backups
	@echo "$(GREEN)✅ Backup created in backups/$(TIMESTAMP)/$(RESET)"

restore: ## Restore from backup
	@echo "$(RED)⚠️  Restore functionality - Please specify backup timestamp$(RESET)"
	@ls backups/

update-deps: ## Update all dependencies
	@echo "$(CYAN)📦 Updating dependencies...$(RESET)"
	@cd frontend && npm update
	@cd backend && pip-compile requirements.in
	@cd ml-services && pip-compile requirements.in
	@echo "$(GREEN)✅ Dependencies updated$(RESET)"

##@ Git Hooks

hooks-install: ## Install git hooks
	@echo "$(CYAN)Installing git hooks...$(RESET)"
	@pre-commit install
	@pre-commit install --hook-type commit-msg

hooks-run: ## Run git hooks on all files
	@echo "$(CYAN)Running git hooks on all files...$(RESET)"
	@pre-commit run --all-files

##@ Performance Commands

perf-test: ## Run performance tests
	@echo "$(GREEN)⚡ Running performance tests...$(RESET)"
	@cd tests && python -m pytest performance/ -v

load-test: ## Run load tests
	@echo "$(GREEN)🔥 Running load tests...$(RESET)"
	@cd tests && locust -f load_tests/locustfile.py --host=http://localhost:8000

benchmark: ## Run benchmarks
	@echo "$(GREEN)📊 Running benchmarks...$(RESET)"
	@cd backend && python -m src.benchmarks.run_benchmarks

##@ Release Commands

release-check: ## Check if ready for release
	@echo "$(GREEN)🔍 Checking release readiness...$(RESET)"
	@make test
	@make security
	@make lint
	@echo "$(GREEN)✅ Release checks passed$(RESET)"

release-notes: ## Generate release notes
	@echo "$(CYAN)📝 Generating release notes...$(RESET)"
	@git log --pretty=format:"- %s" $(shell git describe --tags --abbrev=0)..HEAD

version: ## Show current version
	@echo "$(CYAN)Current version: $(VERSION)$(RESET)"

##@ Info Commands

info: ## Show project information
	@echo "$(CYAN)📋 Lead Scoring Tool - Project Information$(RESET)"
	@echo ""
	@echo "$(GREEN)Project:$(RESET)     $(PROJECT_NAME)"
	@echo "$(GREEN)Version:$(RESET)     $(VERSION)"
	@echo "$(GREEN)Environment:$(RESET) $(ENV)"
	@echo "$(GREEN)Registry:$(RESET)    $(DOCKER_REGISTRY)"
	@echo ""
	@echo "$(GREEN)Services:$(RESET)"
	@echo "  - Frontend (Next.js 14 + TypeScript)"
	@echo "  - Backend (FastAPI + PostgreSQL)"
	@echo "  - ML Services (TensorFlow + scikit-learn)"
	@echo "  - Analytics (ClickHouse + Elasticsearch)"
	@echo "  - Monitoring (Prometheus + Grafana)"
	@echo ""
	@echo "$(GREEN)Commands:$(RESET) Run 'make help' for available commands"

status: ## Show system status
	@echo "$(CYAN)🔍 System Status$(RESET)"
	@echo ""
	@echo "$(GREEN)Docker Containers:$(RESET)"
	@docker-compose ps 2>/dev/null || echo "No containers running"
	@echo ""
	@echo "$(GREEN)Disk Usage:$(RESET)"
	@df -h . | tail -1
	@echo ""
	@echo "$(GREEN)Memory Usage:$(RESET)"
	@free -h 2>/dev/null || echo "Memory info not available"

# Environment-specific targets
ifneq (,$(wildcard ./Makefile.local))
include Makefile.local
endif