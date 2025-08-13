# Appointment Booking Widget - MicroSaaS

A comprehensive appointment booking widget with embeddable widgets, calendar integrations, and automated booking management for service-based businesses.

## 🚀 Features

### Core Functionality
- ✅ **Multi-tenant SaaS Architecture** - Complete business isolation
- ✅ **Real-time Availability Engine** - Smart conflict detection and prevention
- ✅ **Embeddable Widget System** - Iframe and JavaScript embedding options
- ✅ **Mobile-first Design** - Responsive booking experience
- ✅ **Professional Dashboard** - Business management interface

### Advanced Features
- 🔄 **Calendar Synchronization** - Google, Outlook, Apple Calendar integration
- 💳 **Payment Processing** - Stripe, PayPal, Square support
- 📧 **Automated Notifications** - Email and SMS reminders
- 🌍 **Multi-timezone Support** - Global scheduling capabilities
- 📊 **Analytics & Reporting** - Booking insights and metrics

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with multi-tenant schema
- **Real-time**: Socket.io for live updates
- **Caching**: Redis for performance optimization
- **Payments**: Stripe integration
- **Calendar APIs**: Google Calendar, Microsoft Graph, CalDAV

### Database Design
The application uses a comprehensive multi-tenant PostgreSQL schema with 15+ tables:

- **Business Management**: Multi-tenant business isolation
- **Service Management**: Flexible service configuration
- **Staff & Availability**: Complex scheduling rules
- **Booking Engine**: Real-time conflict detection
- **Payment Processing**: Secure transaction handling
- **Notification System**: Automated communication
- **Analytics**: Performance tracking

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone and Setup**
```bash
cd appointment-booking-widget
cp .env.example .env.local
npm install
```

2. **Database Setup**
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

3. **Development Server**
```bash
npm run dev
```

### Environment Variables
Configure the following in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/appointment_booking_widget"

# Authentication
AUTH0_SECRET="your-auth0-secret"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"

# Payment Processing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID="your-google-client-id"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"

# Notifications
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
```

## 📱 Widget Integration

### Iframe Embedding
```html
<iframe
  src="https://widget.bookingapp.com/your-business"
  width="100%"
  height="600px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>
```

### JavaScript Integration
```html
<div id="booking-widget"></div>
<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://widget.bookingapp.com/widget.js';
  script.onload = function() {
    AppointmentWidget.init({
      businessSlug: 'your-business',
      containerId: 'booking-widget',
      options: {
        theme: 'light',
        primaryColor: '#3B82F6'
      }
    });
  };
  document.head.appendChild(script);
})();
</script>
```

## 🔧 API Documentation

### Core Endpoints

#### Availability API
```http
GET /api/availability?businessId={id}&serviceId={id}&date=2024-01-15
```

Returns available time slots for booking.

#### Booking API
```http
POST /api/bookings
Content-Type: application/json

{
  "businessId": "business_id",
  "serviceId": "service_id", 
  "staffId": "staff_id",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "startTime": "2024-01-15T14:00:00Z",
  "timezone": "America/New_York"
}
```

Creates a new booking with automatic conflict detection.

## 🧪 Testing

### Unit Tests
```bash
npm test
npm run test:coverage
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Performance Testing
```bash
npm run test:performance
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Environment
```bash
npm run build
npm start
```

## 📊 Business Model

### Pricing Tiers
- **Starter**: $19/month - 100 bookings, 1 staff
- **Professional**: $49/month - 500 bookings, 5 staff, payments
- **Business**: $99/month - Unlimited bookings, multi-location

### Revenue Streams
- Monthly SaaS subscriptions
- Payment processing fees (1.5%)
- SMS credits as add-on
- Custom development services

## 🔐 Security Features

- **GDPR Compliance** - Data protection and user rights
- **PCI DSS Compliance** - Secure payment processing
- **OAuth 2.0** - Secure calendar integration
- **Rate Limiting** - API protection
- **Input Validation** - Comprehensive data sanitization
- **Encryption** - Data at rest and in transit

## 🌐 Internationalization

- Multi-language support
- Timezone-aware scheduling
- Currency localization
- Regional payment methods

## 📈 Performance Optimizations

- **Database Indexing** - Optimized availability queries
- **Redis Caching** - Frequently accessed data
- **CDN Integration** - Global widget delivery
- **Code Splitting** - Minimal JavaScript bundles
- **Image Optimization** - Next.js automatic optimization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.bookingwidget.com](https://docs.bookingwidget.com)
- **Support Email**: support@bookingwidget.com
- **Community Forum**: [https://community.bookingwidget.com](https://community.bookingwidget.com)

## 🏆 Success Metrics

### Technical KPIs
- **Uptime**: 99.9% SLA
- **Performance**: <2s widget load time
- **Availability**: <500ms query response
- **Test Coverage**: >90%

### Business KPIs
- **Conversion Rate**: >75% booking completion
- **Customer Retention**: >70% at 12 months
- **Net Promoter Score**: >50
- **Revenue Growth**: 25% MoM

---

Built with ❤️ for service-based businesses worldwide.