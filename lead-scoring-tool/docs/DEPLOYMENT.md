# Lead Scoring Tool - Deployment Guide

## 🚀 Deployment Options

### Local Development
```bash
# Quick start - complete environment in one command
make quickstart

# Access the application
Frontend: http://localhost:3000
Backend API: http://localhost:8000/docs  
ML Services: http://localhost:8001/docs
Grafana: http://localhost:3001 (admin/admin)
```

### Production Deployment

#### Prerequisites
- Docker and Docker Compose
- Kubernetes cluster (for production)
- PostgreSQL database
- Redis instance
- Domain with SSL certificate

#### Environment Configuration

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Update production values:**
```bash
# Application
ENVIRONMENT=production
DEBUG=false

# Database (use production database)
DATABASE_URL=postgresql://user:password@your-db-host:5432/lead_scoring_prod
REDIS_URL=redis://your-redis-host:6379/0

# Security (generate secure keys)
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-256-bits
ENCRYPTION_KEY=your-32-char-base64-encoded-encryption-key

# External APIs (add your API keys)
SENDGRID_API_KEY=your_sendgrid_api_key
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
```

#### Docker Compose Production

1. **Build production images:**
```bash
make build
```

2. **Deploy with production compose:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Run database migrations:**
```bash
make db-migrate
```

4. **Verify deployment:**
```bash
make health-check
```

#### Kubernetes Production

1. **Create namespace:**
```bash
kubectl create namespace lead-scoring
```

2. **Create secrets:**
```bash
# Database secret
kubectl create secret generic database-secret \
  --from-literal=url="postgresql://user:pass@host:5432/db" \
  -n lead-scoring

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=key="your-jwt-secret" \
  -n lead-scoring

# Redis secret  
kubectl create secret generic redis-secret \
  --from-literal=url="redis://host:6379/0" \
  -n lead-scoring
```

3. **Deploy application:**
```bash
kubectl apply -f infrastructure/kubernetes/ -n lead-scoring
```

4. **Verify deployment:**
```bash
kubectl get pods -n lead-scoring
kubectl get services -n lead-scoring
```

## 🔧 Configuration Management

### Environment Variables

#### Core Application Settings
```bash
APP_NAME="Lead Scoring Tool"
APP_VERSION="1.0.0"  
DEBUG=false
ENVIRONMENT=production
```

#### Database Configuration
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
REDIS_URL=redis://host:6379/0
CLICKHOUSE_URL=http://host:8123
```

#### Security Settings
```bash
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRATION_HOURS=24
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### External API Keys
```bash
# Email Services
SENDGRID_API_KEY=your_sendgrid_key
SMTP_HOST=smtp.yourdomain.com

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CRM Integrations
SALESFORCE_CLIENT_ID=your_salesforce_client_id
HUBSPOT_API_KEY=your_hubspot_api_key
```

#### Feature Flags
```bash
FEATURE_ADVANCED_ML=true
FEATURE_REAL_TIME_SCORING=true
FEATURE_SOCIAL_MEDIA_INTEGRATION=false
FEATURE_WHITE_LABEL=false
```

### Scaling Configuration

#### Backend Service Scaling
```yaml
# In Kubernetes deployment
replicas: 3  # Adjust based on load
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi" 
    cpu: "500m"
```

#### ML Service Scaling
```yaml
# ML services require more resources
replicas: 2
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

#### Auto-scaling Configuration
```yaml
# HPA configuration
minReplicas: 2
maxReplicas: 10
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
```

## 📊 Monitoring and Observability

### Health Checks
```bash
# Application health
curl http://localhost:8000/health
curl http://localhost:8001/health

# Detailed health with dependencies
curl http://localhost:8000/health/detailed
```

### Metrics and Monitoring

#### Prometheus Metrics
- Available at: `http://localhost:8000/metrics`
- Custom metrics for leads processed, scoring operations, API requests

#### Grafana Dashboards
- Access: `http://localhost:3001` (admin/admin)
- Pre-configured dashboards for:
  - Application performance
  - Lead scoring metrics
  - Database performance
  - ML model accuracy

#### Log Aggregation
```bash
# View aggregated logs
make logs

# View specific service logs
make logs-backend
make logs-ml
make logs-frontend
```

### Performance Monitoring

#### Response Time Targets
- API endpoints: < 200ms average
- ML scoring: < 100ms per prediction
- Dashboard loading: < 2 seconds
- Real-time updates: < 1 second

#### Capacity Planning
- Concurrent users: 10,000+
- Leads processed: 1M+ per day
- API requests: 100,000+ per hour
- Database size: 100GB+ supported

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### Database Security
```bash
# PostgreSQL security
# - Enable SSL connections
# - Use strong passwords
# - Limit connection IPs
# - Regular backups

# Redis security  
# - Enable authentication
# - Disable dangerous commands
# - Use SSL connections
```

### Application Security Headers
```nginx
# Nginx configuration
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'";
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: make test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build images
        run: make build
      - name: Push to registry
        run: make push
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: kubectl apply -f infrastructure/kubernetes/
```

### Deployment Checklist

#### Pre-deployment
- [ ] Environment variables configured
- [ ] Secrets created in Kubernetes
- [ ] Database migrations ready
- [ ] SSL certificates configured
- [ ] Monitoring dashboards configured

#### Deployment
- [ ] Build and push images
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks

#### Post-deployment
- [ ] Monitor application metrics
- [ ] Check error logs
- [ ] Verify all integrations
- [ ] Update documentation
- [ ] Notify stakeholders

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
make db-status

# View database logs
docker logs lead-scoring-postgres

# Test connection manually
psql postgresql://user:password@host:5432/database
```

#### ML Service Issues
```bash
# Check ML service logs
make logs-ml

# Verify model loading
curl http://localhost:8001/models/status

# Test prediction endpoint
curl -X POST http://localhost:8001/api/v1/scoring/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"company_name": "test"}}'
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost:8000/metrics

# View slow queries
make db-slow-queries
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
make db-restore BACKUP_FILE=backups/backup_20231201.sql

# Reset database if corrupted
make db-reset
```

#### Application Recovery
```bash
# Rolling restart
kubectl rollout restart deployment/lead-scoring-backend -n lead-scoring

# Rollback deployment
make rollback
```

## 📈 Scaling Strategies

### Horizontal Scaling
- Add more application replicas
- Use load balancers
- Implement database read replicas
- Cache frequently accessed data

### Vertical Scaling
- Increase container resource limits
- Optimize database queries
- Tune ML model performance
- Implement connection pooling

### Database Scaling
- Implement sharding by organization_id
- Use read replicas for analytics
- Archive old data regularly
- Optimize indexes

This deployment guide provides comprehensive instructions for deploying the Lead Scoring Tool in production environments with enterprise-grade security, monitoring, and scalability.