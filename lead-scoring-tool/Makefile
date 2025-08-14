# Lead Scoring Tool - Development Makefile
# Comprehensive automation for development, testing, and deployment

.PHONY: help quickstart dev build test clean deploy

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED    := $(shell echo -e "\033[31m")
GREEN  := $(shell echo -e "\033[32m")
YELLOW := $(shell echo -e "\033[33m")
BLUE   := $(shell echo -e "\033[34m")
RESET  := $(shell echo -e "\033[0m")

##@ Setup and Development

quickstart: ## Complete setup and start development environment
	@echo "$(GREEN)🚀 Starting Lead Scoring Tool quickstart...$(RESET)"
	@$(MAKE) setup
	@$(MAKE) dev
	@echo "$(GREEN)✅ Development environment is ready!$(RESET)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(RESET)"
	@echo "$(BLUE)Backend API: http://localhost:8000$(RESET)"
	@echo "$(BLUE)ML Services: http://localhost:8001$(RESET)"
	@echo "$(BLUE)Grafana: http://localhost:3001$(RESET)"

setup: ## Initial project setup and dependency installation
	@echo "$(YELLOW)📦 Setting up development environment...$(RESET)"
	@docker --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker is required$(RESET)" && exit 1)
	@docker-compose --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker Compose is required$(RESET)" && exit 1)
	@echo "$(GREEN)✅ Dependencies verified$(RESET)"
	@$(MAKE) create-env
	@$(MAKE) build-base

create-env: ## Create environment files from templates
	@echo "$(YELLOW)🔧 Creating environment files...$(RESET)"
	@test -f .env || cp .env.example .env
	@test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
	@echo "$(GREEN)✅ Environment files created$(RESET)"

dev: ## Start development environment with hot reloading
	@echo "$(YELLOW)🔥 Starting development environment...$(RESET)"
	@docker-compose up -d postgres redis clickhouse
	@echo "$(YELLOW)⏳ Waiting for databases to start...$(RESET)"
	@sleep 10
	@docker-compose up -d --build frontend backend ml-service integration-service
	@echo "$(GREEN)✅ Development environment started$(RESET)"

dev-logs: ## Show logs from all development services
	@docker-compose logs -f frontend backend ml-service integration-service

dev-stop: ## Stop development environment
	@echo "$(YELLOW)🛑 Stopping development environment...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ Development environment stopped$(RESET)"

##@ Building and Testing

build: ## Build all services for production
	@echo "$(YELLOW)🔨 Building all services...$(RESET)"
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ All services built$(RESET)"

build-base: ## Build base images and pull dependencies
	@echo "$(YELLOW)🔨 Building base images...$(RESET)"
	@docker-compose build --parallel
	@echo "$(GREEN)✅ Base images built$(RESET)"

test: ## Run complete test suite
	@echo "$(YELLOW)🧪 Running complete test suite...$(RESET)"
	@$(MAKE) test-unit
	@$(MAKE) test-integration
	@$(MAKE) test-e2e
	@echo "$(GREEN)✅ All tests passed$(RESET)"

test-unit: ## Run unit tests for all services
	@echo "$(YELLOW)🧪 Running unit tests...$(RESET)"
	@docker-compose exec -T frontend npm test -- --coverage --watchAll=false
	@docker-compose exec -T backend pytest --cov=app --cov-report=xml
	@docker-compose exec -T ml-service python -m pytest --cov=app
	@echo "$(GREEN)✅ Unit tests completed$(RESET)"

test-integration: ## Run integration tests
	@echo "$(YELLOW)🧪 Running integration tests...$(RESET)"
	@docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit integration-tests
	@docker-compose -f docker-compose.test.yml down
	@echo "$(GREEN)✅ Integration tests completed$(RESET)"

test-e2e: ## Run end-to-end tests with Playwright
	@echo "$(YELLOW)🧪 Running E2E tests...$(RESET)"
	@docker-compose exec -T frontend npm run test:e2e
	@echo "$(GREEN)✅ E2E tests completed$(RESET)"

test-load: ## Run load tests with K6
	@echo "$(YELLOW)🧪 Running load tests...$(RESET)"
	@docker run --rm -i --network=lead-scoring-tool_lead-scoring-network \
		grafana/k6:latest run --vus 10 --duration 30s - < tests/load/api-load-test.js
	@echo "$(GREEN)✅ Load tests completed$(RESET)"

lint: ## Run code quality checks on all services
	@echo "$(YELLOW)🔍 Running code quality checks...$(RESET)"
	@docker-compose exec -T frontend npm run lint
	@docker-compose exec -T backend black --check app/
	@docker-compose exec -T backend mypy app/
	@docker-compose exec -T ml-service black --check app/
	@echo "$(GREEN)✅ Code quality checks passed$(RESET)"

format: ## Format code in all services
	@echo "$(YELLOW)🎨 Formatting code...$(RESET)"
	@docker-compose exec -T frontend npm run format
	@docker-compose exec -T backend black app/
	@docker-compose exec -T ml-service black app/
	@echo "$(GREEN)✅ Code formatting completed$(RESET)"

##@ Database Operations

db-migrate: ## Run database migrations
	@echo "$(YELLOW)📊 Running database migrations...$(RESET)"
	@docker-compose exec backend alembic upgrade head
	@echo "$(GREEN)✅ Database migrations completed$(RESET)"

db-seed: ## Seed database with sample data
	@echo "$(YELLOW)🌱 Seeding database...$(RESET)"
	@docker-compose exec backend python scripts/seed_data.py
	@echo "$(GREEN)✅ Database seeded with sample data$(RESET)"

db-reset: ## Reset database to clean state
	@echo "$(YELLOW)🗑️  Resetting database...$(RESET)"
	@docker-compose down -v
	@docker-compose up -d postgres redis clickhouse
	@sleep 10
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo "$(GREEN)✅ Database reset completed$(RESET)"

db-backup: ## Create database backup
	@echo "$(YELLOW)💾 Creating database backup...$(RESET)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U leadscoring lead_scoring_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Database backup created$(RESET)"

db-restore: ## Restore database from backup (usage: make db-restore BACKUP_FILE=backups/backup.sql)
	@echo "$(YELLOW)📥 Restoring database from backup...$(RESET)"
	@docker-compose exec -T postgres psql -U leadscoring -d lead_scoring_db < $(BACKUP_FILE)
	@echo "$(GREEN)✅ Database restored$(RESET)"

##@ Machine Learning Operations

ml-train: ## Train ML models
	@echo "$(YELLOW)🧠 Training ML models...$(RESET)"
	@docker-compose exec ml-service python scripts/train_models.py
	@echo "$(GREEN)✅ ML models trained$(RESET)"

ml-evaluate: ## Evaluate ML model performance
	@echo "$(YELLOW)📊 Evaluating ML models...$(RESET)"
	@docker-compose exec ml-service python scripts/evaluate_models.py
	@echo "$(GREEN)✅ ML model evaluation completed$(RESET)"

ml-deploy: ## Deploy trained models to production
	@echo "$(YELLOW)🚀 Deploying ML models...$(RESET)"
	@docker-compose exec ml-service python scripts/deploy_models.py
	@echo "$(GREEN)✅ ML models deployed$(RESET)"

ml-monitor: ## Monitor ML model performance and drift
	@echo "$(YELLOW)👁️  Monitoring ML models...$(RESET)"
	@docker-compose exec ml-service python scripts/monitor_models.py
	@echo "$(GREEN)✅ ML monitoring report generated$(RESET)"

##@ Monitoring and Observability

monitoring-up: ## Start monitoring stack (Prometheus, Grafana, ELK)
	@echo "$(YELLOW)📊 Starting monitoring stack...$(RESET)"
	@docker-compose up -d prometheus grafana elasticsearch kibana jaeger
	@echo "$(GREEN)✅ Monitoring stack started$(RESET)"
	@echo "$(BLUE)Grafana: http://localhost:3001 (admin/admin)$(RESET)"
	@echo "$(BLUE)Kibana: http://localhost:5601$(RESET)"
	@echo "$(BLUE)Jaeger: http://localhost:16686$(RESET)"

logs: ## View aggregated logs from all services
	@docker-compose logs -f --tail=100

logs-backend: ## View backend service logs
	@docker-compose logs -f backend

logs-ml: ## View ML service logs
	@docker-compose logs -f ml-service

logs-frontend: ## View frontend logs
	@docker-compose logs -f frontend

health-check: ## Check health of all services
	@echo "$(YELLOW)🏥 Checking service health...$(RESET)"
	@curl -s http://localhost:8000/health || echo "$(RED)❌ Backend unhealthy$(RESET)"
	@curl -s http://localhost:8001/health || echo "$(RED)❌ ML Service unhealthy$(RESET)"
	@curl -s http://localhost:3000 >/dev/null || echo "$(RED)❌ Frontend unhealthy$(RESET)"
	@echo "$(GREEN)✅ Health check completed$(RESET)"

##@ Deployment

deploy-staging: ## Deploy to staging environment
	@echo "$(YELLOW)🚀 Deploying to staging...$(RESET)"
	@docker-compose -f docker-compose.staging.yml up -d --build
	@echo "$(GREEN)✅ Staging deployment completed$(RESET)"

deploy-prod: ## Deploy to production using Kubernetes
	@echo "$(YELLOW)🚀 Deploying to production...$(RESET)"
	@helm upgrade --install lead-scoring-tool ./infrastructure/helm/ \
		--values ./infrastructure/helm/values.prod.yaml
	@echo "$(GREEN)✅ Production deployment completed$(RESET)"

k8s-deploy: ## Deploy to local Kubernetes cluster
	@echo "$(YELLOW)☸️  Deploying to Kubernetes...$(RESET)"
	@kubectl apply -f infrastructure/kubernetes/
	@echo "$(GREEN)✅ Kubernetes deployment completed$(RESET)"

k8s-status: ## Check Kubernetes deployment status
	@kubectl get pods -l app=lead-scoring-tool
	@kubectl get services -l app=lead-scoring-tool

rollback: ## Rollback to previous deployment version
	@echo "$(YELLOW)⏪ Rolling back deployment...$(RESET)"
	@helm rollback lead-scoring-tool
	@echo "$(GREEN)✅ Rollback completed$(RESET)"

##@ Data and Analytics

analytics-init: ## Initialize ClickHouse analytics database
	@echo "$(YELLOW)📈 Initializing analytics database...$(RESET)"
	@docker-compose exec clickhouse clickhouse-client --query "CREATE DATABASE IF NOT EXISTS analytics"
	@docker-compose exec backend python scripts/init_analytics.py
	@echo "$(GREEN)✅ Analytics database initialized$(RESET)"

data-export: ## Export lead data for analysis
	@echo "$(YELLOW)📤 Exporting lead data...$(RESET)"
	@mkdir -p exports
	@docker-compose exec -T postgres psql -U leadscoring -d lead_scoring_db \
		-c "COPY leads TO STDOUT WITH CSV HEADER" > exports/leads_$(shell date +%Y%m%d).csv
	@echo "$(GREEN)✅ Lead data exported$(RESET)"

data-import: ## Import lead data from CSV (usage: make data-import CSV_FILE=path/to/file.csv)
	@echo "$(YELLOW)📥 Importing lead data...$(RESET)"
	@docker-compose exec backend python scripts/import_data.py $(CSV_FILE)
	@echo "$(GREEN)✅ Lead data imported$(RESET)"

##@ Security and Compliance

security-scan: ## Run security vulnerability scans
	@echo "$(YELLOW)🔒 Running security scans...$(RESET)"
	@docker run --rm -v $(PWD):/app securecodewarrior/docker-security-scan /app
	@echo "$(GREEN)✅ Security scan completed$(RESET)"

compliance-check: ## Run GDPR/CCPA compliance checks
	@echo "$(YELLOW)⚖️  Running compliance checks...$(RESET)"
	@docker-compose exec backend python scripts/compliance_check.py
	@echo "$(GREEN)✅ Compliance check completed$(RESET)"

audit-logs: ## Generate audit trail report
	@echo "$(YELLOW)📋 Generating audit logs...$(RESET)"
	@docker-compose exec backend python scripts/generate_audit_report.py
	@echo "$(GREEN)✅ Audit report generated$(RESET)"

##@ Utilities

clean: ## Clean up containers, images, and volumes
	@echo "$(YELLOW)🧹 Cleaning up Docker resources...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed$(RESET)"

clean-all: ## Clean up everything including images
	@echo "$(YELLOW)🧹 Deep cleaning all Docker resources...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -af --volumes
	@echo "$(GREEN)✅ Deep cleanup completed$(RESET)"

shell-backend: ## Open shell in backend container
	@docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	@docker-compose exec frontend sh

shell-ml: ## Open shell in ML service container
	@docker-compose exec ml-service bash

psql: ## Open PostgreSQL command line
	@docker-compose exec postgres psql -U leadscoring -d lead_scoring_db

redis-cli: ## Open Redis command line
	@docker-compose exec redis redis-cli

update-deps: ## Update dependencies in all services
	@echo "$(YELLOW)📦 Updating dependencies...$(RESET)"
	@docker-compose exec frontend npm update
	@docker-compose exec backend pip install -U -r requirements.txt
	@docker-compose exec ml-service pip install -U -r requirements.txt
	@echo "$(GREEN)✅ Dependencies updated$(RESET)"

docs-generate: ## Generate API documentation
	@echo "$(YELLOW)📚 Generating API documentation...$(RESET)"
	@docker-compose exec backend python scripts/generate_docs.py
	@echo "$(GREEN)✅ API documentation generated$(RESET)"

performance-test: ## Run comprehensive performance tests
	@echo "$(YELLOW)⚡ Running performance tests...$(RESET)"
	@$(MAKE) test-load
	@docker-compose exec backend python scripts/benchmark_api.py
	@echo "$(GREEN)✅ Performance testing completed$(RESET)"

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Lead Scoring Tool - Development Commands$(RESET)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@printf "\n$(BLUE)Examples:$(RESET)\n"
	@printf "  $(GREEN)make quickstart$(RESET)     # Complete setup and start development\n"
	@printf "  $(GREEN)make dev$(RESET)            # Start development environment\n"
	@printf "  $(GREEN)make test$(RESET)           # Run complete test suite\n"
	@printf "  $(GREEN)make deploy-prod$(RESET)    # Deploy to production\n\n"