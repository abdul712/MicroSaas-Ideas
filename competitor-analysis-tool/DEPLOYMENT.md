# 🚀 Competitor Analysis Platform - Deployment Guide

## Enterprise-Grade Deployment Instructions

This comprehensive deployment guide covers everything needed to deploy the Competitor Analysis Platform in production environments following enterprise best practices.

## 📋 Prerequisites

### System Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 3.8+
- **Node.js**: Version 18+ (for local development)
- **Python**: Version 3.11+ (for scraper service)
- **RAM**: Minimum 8GB, Recommended 16GB+
- **Storage**: Minimum 100GB SSD, Recommended 500GB+
- **CPU**: Minimum 4 cores, Recommended 8+ cores

### External Services
- **Domain**: Custom domain with SSL certificate
- **Email Service**: SMTP server (Gmail, SendGrid, AWS SES)
- **Cloud Storage**: AWS S3, Google Cloud Storage, or Azure Blob
- **Monitoring**: Sentry for error tracking (optional)
- **Payment Processing**: Stripe account (optional)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Scraper Service│
│   (Next.js)     │    │   (Node.js)     │    │   (Python)      │
│   Port 3000     │    │   Port 8000     │    │   Port 8001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────────┐
         │                 Infrastructure                          │
         ├─────────────────┬─────────────────┬─────────────────────┤
         │   PostgreSQL    │     Redis       │    ClickHouse       │
         │   Port 5432     │   Port 6379     │    Port 8123        │
         └─────────────────┴─────────────────┴─────────────────────┘
```

## 🔧 Environment Configuration

### 1. Environment Variables

Create `.env` files in each service directory:

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/competitor_analysis
REDIS_URL=redis://redis:6379
CLICKHOUSE_URL=http://clickhouse:8123

# Security
JWT_SECRET=your-super-secure-jwt-secret-256-bit-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-256-bit-key

# External APIs
OPENAI_API_KEY=sk-your-openai-api-key
HUGGINGFACE_API_KEY=hf_your-huggingface-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=your-email@company.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Payment (if using subscriptions)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

#### Scraper (.env)
```bash
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/competitor_analysis
REDIS_URL=redis://redis:6379
BACKEND_URL=http://backend:8000
OPENAI_API_KEY=sk-your-openai-api-key
HUGGINGFACE_API_KEY=hf_your-huggingface-key
```

## 🐳 Docker Production Setup

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/competitor_analysis
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.your-domain.com`)"
      - "traefik.http.routers.backend.tls=true"

  # Scraper Service
  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/competitor_analysis
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: competitor_analysis
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backup:/backup
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    restart: unless-stopped
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # ClickHouse
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    environment:
      CLICKHOUSE_DB: analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    restart: unless-stopped

  # Reverse Proxy & SSL
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@your-domain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt_data:/letsencrypt
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  clickhouse_data:
  letsencrypt_data:

networks:
  default:
    name: competitor-network
```

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/competitor-analysis
sudo chown $USER:$USER /opt/competitor-analysis
cd /opt/competitor-analysis
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url> .

# Set up environment variables
cp .env.example .env
# Edit .env with your production values

# Generate secure passwords
export POSTGRES_PASSWORD=$(openssl rand -hex 32)
export REDIS_PASSWORD=$(openssl rand -hex 32)
export CLICKHOUSE_PASSWORD=$(openssl rand -hex 32)

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose exec backend npm run db:migrate

# Seed initial data (optional)
docker-compose exec backend npm run db:seed
```

### 3. SSL Certificate Setup

```bash
# Verify Traefik is running
docker-compose ps traefik

# Check certificate generation
docker-compose logs traefik

# Verify SSL is working
curl -I https://your-domain.com
curl -I https://api.your-domain.com
```

## 🔒 Security Hardening

### 1. Database Security
```bash
# Create database backup user
docker-compose exec postgres psql -U postgres -c "
CREATE USER backup WITH PASSWORD 'secure_backup_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup;
"

# Set up automated backups
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/competitor-analysis/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres competitor_analysis > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
EOF

chmod +x backup-db.sh
echo "0 2 * * * /opt/competitor-analysis/backup-db.sh" | crontab -
```

### 2. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 3. Log Monitoring
```bash
# Set up log rotation
sudo tee /etc/logrotate.d/competitor-analysis << EOF
/opt/competitor-analysis/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 docker docker
}
EOF
```

## 📊 Monitoring & Maintenance

### 1. Health Checks
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
services=(frontend backend scraper postgres redis clickhouse)
for service in "${services[@]}"; do
    if ! docker-compose ps | grep -q "${service}.*Up"; then
        echo "Service $service is down!"
        docker-compose restart $service
    fi
done
EOF

# Run every 5 minutes
echo "*/5 * * * * /opt/competitor-analysis/health-check.sh" | crontab -
```

### 2. Log Monitoring
```bash
# Monitor application logs
docker-compose logs -f --tail=100

# Monitor specific service
docker-compose logs -f backend

# Check resource usage
docker stats
```

### 3. Performance Monitoring
```bash
# Database performance
docker-compose exec postgres psql -U postgres -c "
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
"

# Redis monitoring
docker-compose exec redis redis-cli info memory
docker-compose exec redis redis-cli info stats
```

## 🔄 Updates & Maintenance

### 1. Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose exec backend npm run db:migrate
```

### 2. Database Maintenance
```bash
# Analyze and vacuum
docker-compose exec postgres psql -U postgres -c "ANALYZE; VACUUM;"

# Reindex if needed
docker-compose exec postgres psql -U postgres -c "REINDEX DATABASE competitor_analysis;"
```

## 🚨 Troubleshooting

### Common Issues

1. **Services not starting**: Check logs and environment variables
2. **SSL certificate issues**: Verify DNS settings and Traefik configuration
3. **Database connection errors**: Check credentials and network connectivity
4. **Memory issues**: Increase server resources or adjust container limits

### Debug Commands
```bash
# Check all services status
docker-compose ps

# View service logs
docker-compose logs <service-name>

# Connect to database
docker-compose exec postgres psql -U postgres competitor_analysis

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 📞 Support

For deployment assistance or enterprise support:
- 📧 Email: support@competitor-analysis.com
- 📞 Phone: +1 (555) 123-4567
- 💬 Slack: [Join our community](https://slack.competitor-analysis.com)

---

**🔐 Security Note**: Always use strong passwords, keep systems updated, and regularly backup your data. This deployment guide assumes basic server administration knowledge.