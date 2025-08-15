# 🚀 Competitor Analysis Platform - Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or Docker-compatible environment
- **Memory**: Minimum 8GB RAM (16GB+ recommended for production)
- **Storage**: 100GB+ SSD storage
- **CPU**: 4+ cores recommended
- **Network**: Stable internet connection with good bandwidth

### Required Software
- Docker & Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- Python 3.11+ (for scraper service)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd competitor-analysis-tool
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Required Environment Variables
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/competitor_analysis"
REDIS_URL="redis://localhost:6379"
CLICKHOUSE_URL="http://localhost:8123"
ELASTICSEARCH_URL="http://localhost:9200"
KAFKA_BROKER="localhost:9092"

# Security
JWT_SECRET="your-256-bit-secret-key-here"
BCRYPT_ROUNDS=12

# API Keys
OPENAI_API_KEY="your-openai-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"

# Social Media APIs (Optional)
TWITTER_BEARER_TOKEN="your-twitter-bearer-token"
FACEBOOK_ACCESS_TOKEN="your-facebook-access-token"
LINKEDIN_ACCESS_TOKEN="your-linkedin-access-token"

# SEO APIs (Optional)
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"
SEMRUSH_API_KEY="your-semrush-api-key"
AHREFS_API_KEY="your-ahrefs-api-key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Production Settings
NODE_ENV=production
SSL_ENABLED=true
CORS_ORIGIN="https://yourdomain.com"
```

## 🐳 Docker Deployment

### Quick Start (Recommended)
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Individual Service Management
```bash
# Start specific services
docker-compose up -d postgres redis clickhouse

# Scale services
docker-compose up -d --scale backend=3 --scale scraper=2

# Update a service
docker-compose up -d --no-deps --build frontend
```

## 🌐 Production Deployment

### 1. Domain & SSL Setup
```bash
# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/competitor-analysis
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### 3. Process Management with PM2
```bash
# Install PM2
npm install -g pm2

# Start services with PM2
pm2 start ecosystem.config.js

# PM2 ecosystem configuration
# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'competitor-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'competitor-backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 'max',
      exec_mode: 'cluster'
    }
  ]
}
```

## 📊 Database Setup

### 1. PostgreSQL Initialization
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d competitor_analysis

# Run initialization script
\i /docker-entrypoint-initdb.d/init.sql

# Verify tables
\dt
```

### 2. Prisma Migration
```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 3. ClickHouse Setup
```bash
# Initialize ClickHouse analytics database
docker-compose exec clickhouse clickhouse-client --query="source /docker-entrypoint-initdb.d/init.sql"
```

## 🔍 Health Checks & Monitoring

### Service Health Endpoints
- **Frontend**: `https://yourdomain.com/api/health`
- **Backend**: `https://yourdomain.com/api/health`
- **Scraper**: `https://yourdomain.com:8001/health`

### Monitoring Setup
```bash
# Install monitoring tools
docker-compose -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### Log Management
```bash
# View service logs
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 scraper

# Log rotation setup
sudo nano /etc/logrotate.d/competitor-analysis
# Add log rotation configuration
```

## 🔐 Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Docker Security
```bash
# Run containers as non-root
# Already configured in Dockerfiles

# Limit container resources
docker-compose up -d --memory=2g --cpus=1.5
```

### 3. Database Security
```bash
# Change default passwords
# Configure SSL/TLS for database connections
# Enable audit logging
# Restrict network access
```

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET max_connections = '200';
SELECT pg_reload_conf();
```

### 2. Redis Optimization
```bash
# Redis configuration
echo "maxmemory 512mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
```

### 3. Application Optimization
```bash
# Enable compression
# Optimize Docker images
# Use CDN for static assets
# Implement caching strategies
```

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres competitor_analysis > backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql s3://your-backup-bucket/
```

### 2. Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### 3. Recovery Procedures
```bash
# Restore database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS competitor_analysis;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE competitor_analysis;"
docker-compose exec postgres psql -U postgres competitor_analysis < backup_file.sql
```

## 🚀 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3 --scale scraper=2

# Load balancer configuration
# Use Nginx upstream or cloud load balancers
```

### Vertical Scaling
```bash
# Increase resource limits
docker-compose up -d --memory=4g --cpus=2
```

### Database Scaling
```bash
# Read replicas for PostgreSQL
# Redis clustering
# ClickHouse distributed setup
```

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service_name

# Check port conflicts
netstat -tulpn | grep :3000

# Verify environment variables
docker-compose config
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose exec backend npm run db:test

# Check database status
docker-compose exec postgres pg_isready
```

#### High Memory Usage
```bash
# Monitor resource usage
docker stats

# Optimize services
docker-compose restart
```

### Performance Issues
```bash
# Monitor system resources
htop
iotop
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Daily**: Monitor service health and logs
2. **Weekly**: Review performance metrics and alerts
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Database maintenance and optimization

### Update Procedures
```bash
# Pull latest changes
git pull origin main

# Update services
docker-compose pull
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

### Emergency Procedures
1. **Service Down**: Check logs, restart services
2. **Database Issues**: Switch to read replicas, restore from backup
3. **High Load**: Scale services, implement rate limiting
4. **Security Breach**: Isolate affected systems, rotate credentials

## 📧 Contact Information

- **Technical Support**: tech@competitor-analysis.com
- **Security Issues**: security@competitor-analysis.com
- **Documentation**: https://docs.competitor-analysis.com

---

**Last Updated**: December 2024
**Version**: 1.0.0