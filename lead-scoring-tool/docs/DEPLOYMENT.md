# 🚀 Lead Scoring Tool - Deployment Guide

Complete deployment guide for the AI-Powered Lead Qualification Platform covering development, staging, and production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Docker**: 20.10+ with Docker Compose
- **Node.js**: 18+ (for local frontend development)
- **Python**: 3.11+ (for local backend development)
- **PostgreSQL**: 14+ (production database)
- **Redis**: 7+ (caching and sessions)
- **Kubernetes**: 1.25+ (production orchestration)

### Hardware Requirements

#### Development
- **CPU**: 4+ cores
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 20GB available space
- **Network**: Broadband internet connection

#### Production
- **CPU**: 8+ cores per node
- **RAM**: 32GB+ per node
- **Storage**: 100GB+ SSD storage
- **Network**: High-speed, low-latency connection

## 🏠 Development Setup

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd lead-scoring-tool

# Quick setup with all services
make quickstart
```

### Manual Setup

1. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit configuration
   vim .env
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies
   make install
   
   # Or install individually
   cd frontend && npm install
   cd ../backend && pip install -r requirements.txt
   ```

3. **Start Infrastructure Services**
   ```bash
   # Start database and cache services
   docker-compose up -d postgres redis clickhouse mongodb kafka
   
   # Wait for services to be ready
   make health
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   make migrate
   
   # Seed development data (optional)
   make seed-data
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   make dev
   
   # Or start individually
   make dev-frontend  # Frontend on :3000
   make dev-backend   # Backend on :8000
   ```

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ML Services**: http://localhost:8001
- **Grafana**: http://localhost:3001
- **MLflow**: http://localhost:5000

## 🧪 Staging Deployment

### Docker Compose Staging

1. **Prepare Staging Environment**
   ```bash
   # Create staging configuration
   cp .env.example .env.staging
   
   # Update staging-specific values
   vim .env.staging
   ```

2. **Deploy to Staging**
   ```bash
   # Deploy with staging configuration
   make deploy-staging
   
   # Or manually
   docker-compose -f docker-compose.staging.yml up -d
   ```

3. **Run Migrations**
   ```bash
   # Run database migrations
   docker-compose exec backend alembic upgrade head
   ```

4. **Verify Deployment**
   ```bash
   # Check service health
   curl https://staging-api.yourdomain.com/health
   
   # Run smoke tests
   make test-staging
   ```

### Kubernetes Staging

1. **Prepare Kubernetes Manifests**
   ```bash
   # Update staging configurations
   kubectl apply -f deploy/k8s/staging/
   ```

2. **Deploy Application**
   ```bash
   # Deploy to staging namespace
   kubectl apply -f deploy/k8s/staging/ -n lead-scoring-staging
   
   # Check deployment status
   kubectl get pods -n lead-scoring-staging
   ```

## 🏭 Production Deployment

### Prerequisites for Production

1. **Domain & SSL**
   - Domain name configured
   - SSL certificates obtained
   - DNS records properly set

2. **External Services**
   - PostgreSQL database (AWS RDS/Google Cloud SQL)
   - Redis cluster (AWS ElastiCache/Google Memorystore)
   - Object storage (AWS S3/Google Cloud Storage)
   - CDN configured (CloudFlare/AWS CloudFront)

3. **Monitoring Setup**
   - Logging aggregation (ELK Stack/Fluentd)
   - Metrics collection (Prometheus/Grafana)
   - Error tracking (Sentry)
   - Uptime monitoring

### Kubernetes Production Deployment

1. **Cluster Setup**
   ```bash
   # Create production cluster (example with AWS EKS)
   eksctl create cluster --name lead-scoring-prod --region us-west-2
   
   # Configure kubectl
   aws eks update-kubeconfig --region us-west-2 --name lead-scoring-prod
   ```

2. **Secrets Management**
   ```bash
   # Create namespace
   kubectl create namespace lead-scoring-prod
   
   # Create secrets
   kubectl create secret generic app-secrets \
     --from-literal=database-url="postgresql://..." \
     --from-literal=redis-url="redis://..." \
     --from-literal=secret-key="..." \
     -n lead-scoring-prod
   ```

3. **Deploy Infrastructure Components**
   ```bash
   # Deploy PostgreSQL (if not using managed service)
   kubectl apply -f deploy/k8s/production/postgres.yaml
   
   # Deploy Redis
   kubectl apply -f deploy/k8s/production/redis.yaml
   
   # Deploy monitoring stack
   kubectl apply -f deploy/k8s/production/monitoring/
   ```

4. **Deploy Application**
   ```bash
   # Deploy application components
   kubectl apply -f deploy/k8s/production/
   
   # Check deployment
   kubectl get deployments -n lead-scoring-prod
   kubectl get services -n lead-scoring-prod
   kubectl get ingress -n lead-scoring-prod
   ```

5. **Configure Ingress**
   ```yaml
   # ingress.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: lead-scoring-ingress
     annotations:
       kubernetes.io/ingress.class: nginx
       cert-manager.io/cluster-issuer: letsencrypt-prod
   spec:
     tls:
     - hosts:
       - api.yourdomain.com
       - app.yourdomain.com
       secretName: lead-scoring-tls
     rules:
     - host: api.yourdomain.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: backend-service
               port:
                 number: 8000
     - host: app.yourdomain.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: frontend-service
               port:
                 number: 3000
   ```

### Cloud Provider Specific Deployments

#### AWS Deployment

1. **ECS/Fargate Deployment**
   ```bash
   # Build and push images
   aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com
   
   docker build -t lead-scoring-backend ./backend
   docker tag lead-scoring-backend:latest <account>.dkr.ecr.us-west-2.amazonaws.com/lead-scoring-backend:latest
   docker push <account>.dkr.ecr.us-west-2.amazonaws.com/lead-scoring-backend:latest
   
   # Deploy with ECS
   aws ecs update-service --cluster lead-scoring --service backend-service --force-new-deployment
   ```

2. **Lambda Functions (for ML inference)**
   ```bash
   # Package ML services for Lambda
   cd ml-services
   pip install -r requirements.txt -t .
   zip -r ml-lambda.zip .
   
   # Deploy Lambda function
   aws lambda update-function-code --function-name lead-scoring-ml --zip-file fileb://ml-lambda.zip
   ```

#### Google Cloud Platform

1. **Cloud Run Deployment**
   ```bash
   # Build and deploy to Cloud Run
   gcloud builds submit --tag gcr.io/PROJECT_ID/lead-scoring-backend ./backend
   gcloud run deploy backend --image gcr.io/PROJECT_ID/lead-scoring-backend --platform managed --region us-central1
   ```

2. **GKE Deployment**
   ```bash
   # Create GKE cluster
   gcloud container clusters create lead-scoring-cluster --zone us-central1-a
   
   # Deploy application
   kubectl apply -f deploy/k8s/production/
   ```

## ⚙️ Environment Configuration

### Production Environment Variables

```bash
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<strong-secret-key>

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/lead_scoring
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Cache
REDIS_URL=redis://prod-redis:6379/0

# Security
CORS_ORIGINS=https://app.yourdomain.com
ALLOWED_HOSTS=api.yourdomain.com,app.yourdomain.com

# External Services
STRIPE_API_KEY=sk_live_...
SENDGRID_API_KEY=SG...
SENTRY_DSN=https://...

# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true
```

### Kubernetes ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  REDIS_URL: "redis://redis:6379/0"
  ENABLE_METRICS: "true"
```

## 🗃️ Database Migration

### Production Migration Strategy

1. **Pre-Migration Backup**
   ```bash
   # Create database backup
   pg_dump -h prod-db -U postgres lead_scoring > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run Migrations**
   ```bash
   # Run migrations with downtime
   kubectl scale deployment backend --replicas=0
   kubectl exec -it postgres-pod -- psql -U postgres -d lead_scoring -c "SELECT version();"
   alembic upgrade head
   kubectl scale deployment backend --replicas=3
   ```

3. **Zero-Downtime Migration**
   ```bash
   # For backward-compatible migrations
   alembic upgrade head
   kubectl rollout restart deployment/backend
   ```

### Data Migration Scripts

```python
# data_migration.py
import asyncio
from backend.app.core.database import database
from backend.app.models.database import Lead, LeadScore

async def migrate_lead_scores():
    """Migrate lead scores to new format"""
    query = "SELECT * FROM leads WHERE current_score IS NULL"
    leads = await database.fetch_all(query)
    
    for lead in leads:
        # Calculate new score
        new_score = calculate_score(lead)
        
        # Update lead
        update_query = """
        UPDATE leads SET current_score = :score WHERE id = :id
        """
        await database.execute(update_query, {
            "score": new_score,
            "id": lead["id"]
        })

if __name__ == "__main__":
    asyncio.run(migrate_lead_scores())
```

## 📊 Monitoring & Observability

### Health Checks

```bash
# Application health
curl https://api.yourdomain.com/health

# Database connectivity
kubectl exec -it postgres-pod -- pg_isready

# Redis connectivity
kubectl exec -it redis-pod -- redis-cli ping
```

### Metrics Collection

1. **Prometheus Configuration**
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
   
   scrape_configs:
   - job_name: 'lead-scoring-backend'
     static_configs:
     - targets: ['backend:8000']
     metrics_path: '/metrics'
   
   - job_name: 'lead-scoring-ml'
     static_configs:
     - targets: ['ml-services:8001']
   ```

2. **Grafana Dashboards**
   - Application Performance Dashboard
   - ML Model Performance Dashboard
   - Infrastructure Metrics Dashboard
   - Business Metrics Dashboard

### Logging Strategy

1. **Structured Logging**
   ```python
   import structlog
   
   logger = structlog.get_logger(__name__)
   logger.info("Lead scored", 
              lead_id=lead.id, 
              score=score, 
              model_version="v1.2.3")
   ```

2. **Log Aggregation**
   ```yaml
   # fluentd configuration
   <source>
     @type tail
     path /var/log/app/*.log
     pos_file /var/log/fluentd/app.log.pos
     tag app.*
     format json
   </source>
   ```

### Alerting Rules

```yaml
# alerts.yml
groups:
- name: lead-scoring-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High error rate detected"
  
  - alert: DatabaseConnections
    expr: pg_stat_database_numbackends > 80
    for: 2m
    annotations:
      summary: "High database connection count"
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   kubectl exec -it backend-pod -- python -c "
   from app.core.database import database
   import asyncio
   asyncio.run(database.connect())
   print('Database connected successfully')
   "
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   kubectl top pods -n lead-scoring-prod
   
   # Increase memory limits
   kubectl patch deployment backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
   ```

3. **ML Model Loading Issues**
   ```bash
   # Check model files
   kubectl exec -it ml-services-pod -- ls -la /app/models/
   
   # Reload models
   kubectl exec -it ml-services-pod -- python -c "
   from core.model_manager import ModelManager
   manager = ModelManager()
   manager.reload_models()
   "
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   
   -- Add indexes for common queries
   CREATE INDEX CONCURRENTLY idx_leads_score_created 
   ON leads(current_score, created_at);
   ```

2. **Cache Optimization**
   ```bash
   # Check Redis memory usage
   kubectl exec -it redis-pod -- redis-cli info memory
   
   # Clear cache if needed
   kubectl exec -it redis-pod -- redis-cli flushdb
   ```

3. **Application Scaling**
   ```bash
   # Scale application pods
   kubectl scale deployment backend --replicas=5
   kubectl scale deployment ml-services --replicas=3
   
   # Configure horizontal pod autoscaler
   kubectl autoscale deployment backend --cpu-percent=70 --min=3 --max=10
   ```

### Disaster Recovery

1. **Backup Strategy**
   ```bash
   # Daily database backup
   kubectl create cronjob db-backup \
     --image=postgres:15 \
     --schedule="0 2 * * *" \
     -- pg_dump -h postgres -U postgres lead_scoring > /backups/daily_$(date +%Y%m%d).sql
   ```

2. **Recovery Procedures**
   ```bash
   # Restore from backup
   kubectl exec -it postgres-pod -- psql -U postgres -d lead_scoring < backup.sql
   
   # Verify data integrity
   kubectl exec -it backend-pod -- python scripts/verify_data.py
   ```

### Log Analysis

```bash
# View recent errors
kubectl logs -f deployment/backend | grep ERROR

# Search for specific issues
kubectl logs deployment/backend --since=1h | grep "database"

# Export logs for analysis
kubectl logs deployment/backend --since=24h > backend_logs.txt
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly Tasks**
   - Review application logs
   - Check system metrics
   - Update dependencies
   - Run security scans

2. **Monthly Tasks**
   - Performance optimization
   - Database maintenance
   - Backup verification
   - Capacity planning review

3. **Quarterly Tasks**
   - Security audit
   - Disaster recovery testing
   - Documentation updates
   - Technology stack review

### Contact Information

- **Emergency**: 🚨 On-call engineer via PagerDuty
- **Support**: 📧 support@leadscoring.app
- **Documentation**: 📚 https://docs.leadscoring.app
- **Status Page**: 📊 https://status.leadscoring.app

---

**⚡ Pro Tips:**
- Always test deployments in staging first
- Use blue-green deployments for zero downtime
- Monitor business metrics alongside technical metrics
- Keep deployment scripts in version control
- Document all runbook procedures

🤖 *Generated with [Claude Code](https://claude.ai/code)*