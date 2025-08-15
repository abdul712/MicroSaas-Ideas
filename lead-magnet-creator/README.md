# Lead Magnet Creator - Enterprise MicroSaaS Platform

A comprehensive lead magnet creation platform that allows businesses to create, customize, and deploy lead magnets (PDFs, templates, checklists) with integrated landing pages and email capture functionality.

## ✨ Features

### 🎨 Design Studio
- **Drag & Drop Editor**: Visual canvas-based editor powered by Fabric.js
- **Professional Templates**: 50+ professionally designed templates
- **Custom Branding**: Brand colors, fonts, and styling options
- **Asset Management**: Upload and organize images, icons, and media

### 📄 PDF Generation
- **High-Quality Output**: Export to PDF, PNG, JPG formats
- **Print-Ready**: Professional formatting and resolution
- **Batch Export**: Generate multiple variations simultaneously
- **Watermarking**: Custom branding and protection options

### 🚀 Landing Pages
- **Auto-Generated**: Instant landing pages for each lead magnet
- **Mobile-Responsive**: Optimized for all devices
- **SEO-Optimized**: Meta tags, structured data, and performance
- **A/B Testing**: Test different variations for optimization

### 📧 Email Capture
- **Built-in Forms**: Customizable opt-in forms
- **CRM Integration**: Connect to Mailchimp, ConvertKit, ActiveCampaign
- **GDPR Compliant**: Full compliance with data protection regulations
- **Lead Scoring**: Automatic quality scoring and segmentation

### 📊 Analytics
- **Real-time Metrics**: Track views, downloads, and conversions
- **Performance Insights**: Detailed analytics and reporting
- **A/B Testing**: Compare form and page performance
- **Export Data**: CSV and API access to lead data

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** with Shadcn/ui components
- **Fabric.js** for drag-and-drop editor
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Next.js API Routes** with Edge functions
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication
- **Redis** for caching and queues
- **Bull** for background job processing

### Infrastructure
- **Docker** containerization
- **AWS S3** for file storage
- **Puppeteer/Playwright** for PDF generation
- **SendGrid/Resend** for email delivery
- **Stripe** for subscription management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lead-magnet-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed (optional)
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
# Development
docker-compose up -d

# Production
docker build -t lead-magnet-creator .
docker run -p 3000:3000 lead-magnet-creator
```

## 📋 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lead_magnet_creator"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket"

# Payment
STRIPE_PUBLIC_KEY="your-stripe-public-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### Lead Magnets
- `GET /api/lead-magnets` - List user's lead magnets
- `POST /api/lead-magnets` - Create new lead magnet
- `PUT /api/lead-magnets/[id]` - Update lead magnet
- `DELETE /api/lead-magnets/[id]` - Delete lead magnet
- `POST /api/lead-magnets/[id]/generate-pdf` - Generate PDF

### Templates
- `GET /api/templates` - List available templates
- `GET /api/templates/[id]` - Get template details

### Forms
- `GET /api/forms` - List user's forms
- `POST /api/forms` - Create new form
- `POST /api/forms/[id]/submit` - Submit form (public)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/lead-magnets/[id]` - Lead magnet analytics

## 🔒 Security Features

- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Prisma ORM with prepared statements
- **XSS Protection**: Content sanitization and CSP headers
- **CSRF Protection**: Built-in CSRF token validation
- **Rate Limiting**: API endpoint protection
- **GDPR Compliance**: Data protection and consent management

## 📈 Performance

- **Server-Side Rendering**: Fast initial page loads
- **Image Optimization**: Next.js automatic image optimization
- **Caching Strategy**: Redis caching for database queries
- **CDN Integration**: Static asset delivery optimization
- **Code Splitting**: Automatic bundle optimization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [docs.leadmagnetcreator.com](https://docs.leadmagnetcreator.com)
- Email: support@leadmagnetcreator.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## 🎯 Roadmap

- [ ] Advanced template marketplace
- [ ] Real-time collaboration
- [ ] White-label solutions
- [ ] Advanced A/B testing
- [ ] Webhook integrations
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app companion

---

**Built with ❤️ for marketers, creators, and businesses worldwide.**