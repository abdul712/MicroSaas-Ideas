# Digital Business Card Platform

A comprehensive digital business card platform that allows professionals to create, share, and track digital business cards with QR codes, contact sharing, analytics, and team management features.

## 🚀 Features

- **Smart Card Builder**: Create stunning digital business cards with 20+ professional templates
- **Dynamic QR Codes**: Generate customizable QR codes that update automatically
- **Real-time Analytics**: Track views, engagement, and networking performance
- **Team Management**: Manage team cards, enforce branding, and track performance
- **Mobile Optimized**: Perfect viewing experience on all devices with PWA capabilities
- **Contact Management**: CRM-like features with contact exports and integrations
- **Privacy First**: GDPR compliant with full control over data and sharing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with multiple providers
- **Styling**: Tailwind CSS, Framer Motion, Radix UI
- **Storage**: AWS S3 for file storage
- **QR Codes**: react-qr-code, qrcode libraries
- **Deployment**: Docker, Vercel/AWS

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/digital-business-card.git
   cd digital-business-card
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables in `.env.local`.

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

## 🐳 Docker Setup

1. **Using Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**:
   ```bash
   docker-compose exec app npx prisma db push
   ```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users**: User accounts and subscription information
- **Cards**: Digital business cards with customization options
- **Templates**: Card design templates and layouts
- **CardFields**: Dynamic fields for contact information
- **Analytics**: View tracking and engagement metrics
- **Teams**: Team management and branding
- **Connections**: Contact management and networking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | No |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |

### OAuth Providers

Currently supported authentication providers:
- Google
- GitHub
- LinkedIn
- Email/Password

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📱 API Documentation

### Cards API

- `GET /api/cards` - Get user's cards
- `POST /api/cards` - Create a new card
- `PUT /api/cards/[id]` - Update a card
- `DELETE /api/cards/[id]` - Delete a card

### Analytics API

- `GET /api/analytics/[cardId]` - Get card analytics
- `POST /api/analytics/track` - Track a view event

### Templates API

- `GET /api/templates` - Get available templates
- `GET /api/templates/[id]` - Get template details

## 🎨 Customization

### Adding New Templates

1. Create a new template design in `src/templates/`
2. Add template metadata to the database
3. Update the template selector component

### Custom Fields

The platform supports custom field types. To add new field types:

1. Update the `FieldType` enum in `src/types/index.ts`
2. Add validation logic in field components
3. Update the card builder interface

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables
4. Deploy

### AWS Deployment

1. Build the Docker image
2. Push to ECR
3. Deploy using ECS or EKS
4. Set up RDS for PostgreSQL
5. Configure environment variables

## 📊 Performance

- **Lighthouse Score**: 95+ performance score
- **Core Web Vitals**: Optimized for all metrics
- **Bundle Size**: < 200KB gzipped
- **Load Time**: < 2 seconds on 3G networks

## 🔒 Security

- **Authentication**: Secure OAuth implementation
- **Data Protection**: Encrypted at rest and in transit
- **Rate Limiting**: API endpoint protection
- **GDPR Compliance**: Privacy-first design
- **CSP Headers**: Content Security Policy implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@digitalbusinesscard.com
- 📖 Documentation: [docs.digitalbusinesscard.com](https://docs.digitalbusinesscard.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/digital-business-card/issues)

## 🗺️ Roadmap

- [ ] NFC tag integration
- [ ] Apple Wallet integration
- [ ] Advanced analytics dashboard
- [ ] Video business cards
- [ ] AR card preview
- [ ] Multi-language support
- [ ] White-label solutions
- [ ] API marketplace

---

Made with ❤️ by the Digital Business Card Team