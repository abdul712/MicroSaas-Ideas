# Customer Segmentation Tool - AI-Powered Marketing Analytics

A comprehensive SaaS platform for customer segmentation and targeting using machine learning capabilities, real-time analytics, and seamless integrations.

![Customer Segmentation Tool](./docs/images/dashboard-preview.png)

## 🌟 Features

### 🧠 AI-Powered Segmentation
- **Machine Learning Clustering**: Automatic customer discovery using K-means, DBSCAN, and hierarchical clustering
- **RFM Analysis**: Recency, Frequency, Monetary value analysis for customer categorization
- **Behavioral Segmentation**: Pattern recognition based on user actions and engagement
- **Predictive Analytics**: Churn prediction and Customer Lifetime Value (CLV) forecasting

### 📊 Advanced Analytics
- **Real-time Dashboard**: Live customer metrics and segment performance
- **Interactive Visualizations**: D3.js powered charts and data exploration
- **Customer Journey Mapping**: Visual representation of customer touchpoints
- **Performance Metrics**: Conversion rates, engagement scores, and ROI tracking

### 🔗 Data Integration
- **Multi-source Connectors**: Shopify, Stripe, Mailchimp, HubSpot, Salesforce, Google Analytics
- **Real-time Sync**: Automatic data updates with webhook support
- **Data Quality**: Cleaning, normalization, and validation
- **Custom APIs**: RESTful APIs for custom integrations

### 🎯 Targeting & Activation
- **Campaign Management**: Email and SMS campaign targeting
- **Audience Export**: Seamless export to Facebook Ads, Google Ads, and marketing platforms
- **Automation Rules**: Trigger-based marketing automation
- **A/B Testing**: Segment-based testing and optimization

### 🔒 Enterprise Security
- **GDPR & CCPA Compliance**: Built-in privacy controls and data management
- **Role-based Access**: Fine-grained permissions and user management
- **Audit Logging**: Comprehensive activity tracking and compliance reporting
- **Data Encryption**: End-to-end encryption for sensitive data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/customer-segmentation-tool.git
   cd customer-segmentation-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

This will start all services including the app, database, Redis, ML service, and monitoring tools.

## 📁 Project Structure

```
customer-segmentation-tool/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # Reusable UI components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   └── dashboard/         # Dashboard-specific components
│   ├── lib/                   # Utility libraries
│   ├── services/              # Business logic services
│   ├── types/                 # TypeScript type definitions
│   └── __tests__/             # Test files
├── prisma/                    # Database schema and migrations
├── ml-service/                # Python ML service
├── docs/                      # Documentation
├── monitoring/                # Prometheus & Grafana configs
└── docker-compose.yml        # Docker services configuration
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run E2E tests
```bash
npm run test:e2e
```

### Test commands
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Segmentation Platform               │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14 + TypeScript)                            │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway & Load Balancer                                   │
├─────────────────────────────────────────────────────────────────┤
│  Core Application Services (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  ML/AI Services (Python/FastAPI)                               │
├─────────────────────────────────────────────────────────────────┤
│  Data Processing Pipeline                                       │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL, Redis, ClickHouse)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL, Redis, ClickHouse
- **ML/AI**: Python, FastAPI, scikit-learn, PyTorch
- **Authentication**: NextAuth.js with OAuth providers
- **Monitoring**: Prometheus, Grafana
- **Deployment**: Docker, Kubernetes

## 📊 Segmentation Algorithms

### 1. RFM Analysis
Categorizes customers based on:
- **Recency**: Days since last purchase
- **Frequency**: Number of purchases
- **Monetary**: Total purchase value

Segments include Champions, Loyal Customers, At-Risk, and more.

### 2. Behavioral Clustering
- **K-means**: Groups customers by similar behaviors
- **DBSCAN**: Identifies density-based clusters
- **Hierarchical**: Creates nested customer segments

### 3. Predictive Models
- **Churn Prediction**: Identifies customers likely to leave
- **CLV Forecasting**: Predicts customer lifetime value
- **Next Best Action**: Recommends optimal customer interactions

## 🔌 Integrations

### Supported Platforms
- **E-commerce**: Shopify, WooCommerce, Magento
- **CRM**: HubSpot, Salesforce, Pipedrive
- **Email Marketing**: Mailchimp, Klaviyo, SendGrid
- **Analytics**: Google Analytics, Mixpanel, Amplitude
- **Payment**: Stripe, PayPal, Square
- **Advertising**: Facebook Ads, Google Ads, LinkedIn Ads

### API Documentation
Comprehensive API documentation is available at `/api/docs` when running the development server.

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL=your_production_db_url
   export REDIS_URL=your_production_redis_url
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml up -d

# Scale services
docker-compose up -d --scale app=3
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 📈 Monitoring & Observability

### Metrics
- Application performance (response times, throughput)
- Business metrics (conversion rates, segment performance)
- Infrastructure metrics (CPU, memory, database performance)
- ML model performance (accuracy, drift detection)

### Dashboards
- **Grafana**: System and business metrics visualization
- **Application Dashboard**: Real-time segment analytics
- **Admin Panel**: System health and user management

### Alerts
- High error rates
- Performance degradation
- Failed integrations
- ML model accuracy drops

## 🔒 Security

### Data Protection
- **Encryption**: AES-256 encryption at rest, TLS 1.3 in transit
- **Access Control**: Role-based permissions (RBAC)
- **Audit Logging**: Comprehensive activity tracking
- **Data Anonymization**: PII protection and pseudonymization

### Compliance
- **GDPR**: Data portability, right to deletion, consent management
- **CCPA**: Data transparency and opt-out mechanisms
- **SOC 2**: Security controls and monitoring
- **OWASP**: Security best practices implementation

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Integration Guide](./docs/integrations.md)
- [ML Models Guide](./docs/ml-models.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](./docs/user-guide.md)
- [FAQ](./docs/faq.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Community
- [Discord Community](https://discord.gg/customer-segmentation)
- [GitHub Discussions](https://github.com/your-org/customer-segmentation-tool/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/customer-segmentation-tool)

### Professional Support
- Email: support@segmentai.com
- Enterprise Support: enterprise@segmentai.com

## 🎯 Roadmap

### Q1 2024
- [ ] Advanced ML algorithms (neural networks, ensemble methods)
- [ ] Real-time personalization engine
- [ ] Mobile app (React Native)

### Q2 2024
- [ ] Advanced A/B testing framework
- [ ] Custom ML model training interface
- [ ] Enterprise SSO integration

### Q3 2024
- [ ] Multi-channel campaign orchestration
- [ ] Advanced attribution modeling
- [ ] API marketplace for third-party extensions

---

Built with ❤️ by the SegmentAI Team