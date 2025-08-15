# QR Code Menu Generator

A comprehensive QR code menu platform for restaurants to create digital menus, manage updates, track customer interactions, and provide contactless dining experiences with multilingual support.

## 🚀 Features

### Core Features
- **Quick Menu Setup**: Create digital menus in minutes with intuitive builder
- **QR Code Generation**: Dynamic QR codes with custom branding options
- **Mobile-First Design**: Fast-loading, responsive menus optimized for mobile
- **Real-time Updates**: Instant menu updates without reprinting
- **Multi-language Support**: Serve international customers with automatic translations
- **Analytics Dashboard**: Track popular items, customer preferences, and usage metrics

### Advanced Features
- **Restaurant Management**: Multi-location support with centralized control
- **Staff Permissions**: Role-based access control for team members
- **Menu Customization**: Custom branding, themes, and layouts
- **Customer Insights**: Detailed analytics on menu performance and customer behavior
- **Integration Ready**: API-first design with webhook support

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Hook Form** for form handling
- **Zustand** for state management

### Backend
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication
- **tRPC** for type-safe APIs
- **Stripe** for payment processing
- **Resend** for email notifications

### Infrastructure
- **Cloudinary** for image optimization
- **Redis** for caching and rate limiting
- **Docker** for containerization
- **Vercel** ready for deployment

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/qr-code-menu-generator.git
   cd qr-code-menu-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🗃️ Database Setup

This project uses PostgreSQL with Prisma ORM. Make sure you have PostgreSQL running and update your `DATABASE_URL` in the `.env.local` file.

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed the database
npm run db:seed

# Reset database (development)
npm run db:reset
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t qr-menu-generator .
   ```

2. **Run with docker-compose**
   ```bash
   docker-compose up -d
   ```

### Using Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `RESEND_API_KEY` | Resend email API key | ✅ |

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── landing/           # Landing page components
│   ├── dashboard/         # Dashboard components
│   └── menu/              # Menu viewer components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── services/              # Business logic services
├── stores/                # Zustand stores
└── types/                 # TypeScript type definitions
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler |
| `npm test` | Run tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |

## 🎯 Roadmap

### Phase 1: MVP (Current)
- [x] Project setup and configuration
- [x] Database schema design
- [x] Authentication system
- [x] Basic menu management
- [x] QR code generation
- [ ] Mobile menu viewer
- [ ] Analytics dashboard

### Phase 2: Enhanced Features
- [ ] Multi-language support
- [ ] Advanced menu customization
- [ ] Staff management
- [ ] Payment integration
- [ ] Email notifications

### Phase 3: Advanced Features
- [ ] POS system integrations
- [ ] Advanced analytics
- [ ] Customer feedback system
- [ ] Marketing tools
- [ ] API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.qrmenu.app](https://docs.qrmenu.app)
- **Email**: support@qrmenu.app
- **GitHub Issues**: [Create an issue](https://github.com/your-org/qr-code-menu-generator/issues)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- QR codes generated with [qrcode](https://github.com/soldair/node-qrcode)

---

**Built with ❤️ for the restaurant industry**