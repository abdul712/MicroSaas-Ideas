# Inventory Management System

A comprehensive inventory management platform with real-time tracking, automated reordering, and multi-location warehouse management.

## 🚀 Features

- **Real-time Inventory Tracking** - Live stock level monitoring with automatic updates
- **Barcode/QR Code Scanning** - Mobile app integration for efficient operations  
- **Automated Reordering** - Smart reorder point calculations with demand forecasting
- **Multi-location Management** - Warehouse management with transfer tracking
- **Supplier Integration** - EDI integration and automated purchase orders
- **Advanced Analytics** - Comprehensive reporting and business intelligence
- **Mobile Responsive** - Works seamlessly on all devices
- **Security First** - Enterprise-grade security and authentication

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Query** - Data fetching and caching

### Backend
- **Node.js** - JavaScript runtime
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **Redis** - Caching and real-time features

### Infrastructure
- **Docker** - Containerization
- **nginx** - Reverse proxy and load balancer
- **AWS/GCP** - Cloud deployment ready

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Update the environment variables in .env.local
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

## 📊 Database Schema

The system uses a comprehensive database schema designed for scalability:

- **Users & Authentication** - Multi-tenant user management
- **Products & Variants** - Flexible product catalog with variants
- **Inventory & Locations** - Multi-location stock tracking
- **Stock Movements** - Complete audit trail
- **Suppliers & Purchase Orders** - Procurement management
- **Sales Channels** - E-commerce integration
- **Analytics & Reporting** - Business intelligence

## 🔧 Configuration

### Database Configuration
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db"
```

### Authentication Setup
```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Redis Configuration
```env
REDIS_URL="redis://localhost:6379"
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## 📱 Mobile App Features

- **Barcode Scanning** - Quick product identification
- **Inventory Updates** - Real-time stock adjustments
- **Offline Mode** - Continue working without internet
- **Receipt/Shipping** - Mobile warehouse operations

## 🔌 API Documentation

The system provides a comprehensive REST API:

### Products API
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory API
- `GET /api/inventory` - Get inventory levels
- `POST /api/inventory` - Update stock levels
- `POST /api/inventory/transfer` - Transfer between locations

### Purchase Orders API
- `GET /api/purchase-orders` - List orders
- `POST /api/purchase-orders` - Create order
- `PUT /api/purchase-orders/:id` - Update order

## 🚢 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run production server**
   ```bash
   npm start
   ```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment
The application is ready for deployment on:
- AWS (ECS, Lambda, RDS)
- Google Cloud Platform
- Digital Ocean
- Vercel (Frontend)
- Railway (Full-stack)

## 🔒 Security Features

- **Authentication** - Secure user authentication with JWT
- **Authorization** - Role-based access control (RBAC)
- **Data Encryption** - Encryption at rest and in transit
- **API Rate Limiting** - Protection against abuse
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy
- **CORS Configuration** - Secure cross-origin requests

## 📈 Monitoring & Analytics

- **Application Monitoring** - Performance and error tracking
- **Business Analytics** - Inventory insights and trends
- **Real-time Dashboards** - Live operational metrics
- **Custom Reports** - Flexible reporting system
- **Audit Logs** - Complete activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@inventorymanagement.com
- 📖 Documentation: [docs.inventorymanagement.com](https://docs.inventorymanagement.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core inventory tracking
- ✅ Product management
- ✅ Multi-location support
- ✅ Basic analytics

### Phase 2 (Next)
- 🔄 Advanced barcode scanning
- 🔄 Supplier integration
- 🔄 E-commerce sync
- 🔄 Mobile app

### Phase 3 (Future)
- 📋 AI demand forecasting
- 📋 Advanced reporting
- 📋 API marketplace
- 📋 Multi-currency support