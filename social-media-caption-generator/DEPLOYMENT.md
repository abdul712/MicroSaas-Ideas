# 🚀 Deployment Guide - CaptionGenius

Complete deployment guide for the Social Media Caption Generator in production environments.

## 📋 Prerequisites

### System Requirements

- **CPU**: 2+ cores (4+ recommended for production)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB+ available space
- **OS**: Linux (Ubuntu 20.04+ recommended)

### Required Services

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Domain name** with DNS access
- **SSL certificate** (Let's Encrypt recommended)

### External Services

- **PostgreSQL** 15+ (managed service recommended)
- **Redis** 7+ (managed service recommended)
- **Email service** (Resend, SendGrid, etc.)
- **Object storage** (AWS S3, Google Cloud Storage, etc.)

## 🔧 Environment Configuration

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/captiongenius
sudo chown $USER:$USER /opt/captiongenius
cd /opt/captiongenius
```

### 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url> .

# Create production environment file
cp .env.example .env
```

### 3. Environment Variables

Configure `.env` with production values:

```bash
# Database (use managed service in production)
DATABASE_URL="postgresql://user:password@your-db-host:5432/captiongenius"

# Redis (use managed service in production)
REDIS_URL="redis://your-redis-host:6379"

# Application
APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-random-secret-32-chars+"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# AI Services
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"

# Google Cloud (for image analysis)
GOOGLE_APPLICATION_CREDENTIALS="/app/google-credentials.json"
GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_your-publishable-key"
STRIPE_SECRET_KEY="sk_live_your-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Price IDs (create in Stripe dashboard)
STRIPE_CREATOR_PRICE_ID="price_creator_monthly"
STRIPE_PROFESSIONAL_PRICE_ID="price_professional_monthly"
STRIPE_AGENCY_PRICE_ID="price_agency_monthly"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"

# Email
RESEND_API_KEY="re_your-resend-key"
FROM_EMAIL="noreply@your-domain.com"
SUPPORT_EMAIL="support@your-domain.com"
```

## 🐳 Docker Deployment

### 1. Prepare SSL Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Option A: Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*

# Option B: Self-signed (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 2. Configure Google Cloud Credentials

```bash
# Download service account key from Google Cloud Console
# Save as google-credentials.json in project root
```

### 3. Update Nginx Configuration

Edit `nginx.conf` to configure your domain:

```nginx
# Replace server_name with your domain
server_name your-domain.com www.your-domain.com;

# Uncomment and configure HTTPS section
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. Deploy Application

```bash
# Build and start services
docker-compose up -d

# Run database migrations
docker-compose run --rm migrations

# Verify deployment
docker-compose ps
docker-compose logs -f app
```

### 5. Enable Monitoring (Optional)

```bash
# Start with monitoring stack
docker-compose --profile monitoring up -d

# Access monitoring dashboards
echo "Grafana: https://your-domain.com:3001 (admin/admin123)"
echo "Prometheus: https://your-domain.com:9090"
```

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring ports (if needed)
sudo ufw allow 3001/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus

sudo ufw reload
```

### 2. SSL Security

```bash
# Generate strong DH parameters
openssl dhparam -out ssl/dhparam.pem 2048

# Set secure permissions
chmod 600 ssl/privkey.pem
chmod 644 ssl/fullchain.pem ssl/dhparam.pem
```

### 3. System Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Monitoring Setup

### 1. Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Nginx health
curl https://your-domain.com/health

# Database health (if accessible)
docker-compose exec db pg_isready -U postgres
```

### 2. Log Monitoring

```bash
# View application logs
docker-compose logs -f app

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f db

# Follow all logs
docker-compose logs -f
```

### 3. Metrics Collection

Configure monitoring endpoints:

- **Application Metrics**: `/api/metrics`
- **Health Status**: `/api/health`
- **Prometheus Metrics**: `:9090/metrics`

### 4. Alerting

Set up alerts for:

- **Application downtime**
- **High error rates** (>5%)
- **Response time degradation** (>3s)
- **Database connection failures**
- **High memory usage** (>80%)
- **SSL certificate expiration**

## 🔄 Maintenance

### 1. Regular Updates

```bash
# Update application
git pull origin main
docker-compose build app
docker-compose up -d app

# Update dependencies
docker-compose down
docker-compose pull
docker-compose up -d
```

### 2. Database Maintenance

```bash
# Backup database
docker-compose exec db pg_dump -U postgres captiongenius > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20240101.sql | docker-compose exec -T db psql -U postgres captiongenius

# Database migrations
docker-compose run --rm migrations
```

### 3. SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates
sudo certbot renew --dry-run
sudo certbot renew

# Update certificates in SSL directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# Reload nginx
docker-compose restart nginx
```

### 4. Log Rotation

```bash
# Configure logrotate for Docker logs
sudo tee /etc/logrotate.d/docker-compose << EOF
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    postrotate
        docker kill --signal=USR1 \$(docker ps -q) 2>/dev/null || true
    endscript
}
EOF
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Check database connectivity
docker-compose exec app npx prisma db pull
```

#### 2. Database Connection Issues

```bash
# Test database connection
docker-compose exec app npm run db:test

# Check database status
docker-compose exec db pg_isready -U postgres

# Reset database
docker-compose down db
docker volume rm captiongenius_postgres_data
docker-compose up -d db
docker-compose run --rm migrations
```

#### 3. SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in ssl/fullchain.pem -text -noout

# Test SSL configuration
curl -I https://your-domain.com

# Check certificate expiration
openssl x509 -in ssl/fullchain.pem -noout -dates
```

#### 4. High Memory Usage

```bash
# Check container memory usage
docker stats

# Restart specific service
docker-compose restart app

# Clean up unused resources
docker system prune -a
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_captions_user_created 
ON captions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_voices_user_active 
ON brand_voices(user_id, is_active);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM captions WHERE user_id = 'user-id';
```

#### 2. Redis Optimization

```bash
# Monitor Redis performance
docker-compose exec redis redis-cli monitor

# Check memory usage
docker-compose exec redis redis-cli info memory

# Configure memory limits
# Edit docker-compose.yml redis service:
# command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

#### 3. Application Optimization

```bash
# Enable production optimizations
docker-compose down
docker-compose up -d --build

# Monitor performance
curl https://your-domain.com/api/health
```

## 🌍 Scaling

### Horizontal Scaling

1. **Load Balancer**: Configure multiple app instances
2. **Database**: Use read replicas
3. **Cache**: Redis clustering
4. **CDN**: CloudFlare or similar
5. **Auto-scaling**: Kubernetes deployment

### Vertical Scaling

```bash
# Increase container resources
# Edit docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

## 📞 Support

For deployment issues:

1. **Check logs**: `docker-compose logs`
2. **Review configuration**: `docker-compose config`
3. **Health checks**: Visit `/api/health`
4. **Contact support**: support@captiongenius.com

---

## ✅ Deployment Checklist

- [ ] Server configured with Docker
- [ ] Domain name configured
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Database configured and migrated
- [ ] External services connected (Stripe, AI APIs)
- [ ] Security hardening applied
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Health checks passing
- [ ] Performance optimized
- [ ] Documentation updated

**🎉 Congratulations! Your CaptionGenius instance is now ready for production!**