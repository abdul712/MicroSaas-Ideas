# Live Chat Widget - Customer Support Platform

A comprehensive customer support and sales chat platform with AI-powered features, multi-agent support, and advanced conversation management.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant messaging with WebSocket support
- **Embeddable Widget**: Lightweight, customizable chat widget (< 50KB)
- **Multi-agent Support**: Intelligent conversation routing and team collaboration
- **AI Chatbot Integration**: Automated responses with intent recognition
- **Mobile Optimized**: Perfect experience across all devices
- **Analytics Dashboard**: Detailed insights into chat performance

### Advanced Features
- **Visitor Tracking**: Automatic visitor identification and conversation persistence
- **File Sharing**: Support for images and document uploads
- **Typing Indicators**: Real-time typing status and read receipts
- **Conversation Management**: Assignment, transfer, and status tracking
- **Customizable Appearance**: Brand colors, positioning, and messaging
- **Multi-tenant Architecture**: Organization-level isolation and settings

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Sessions**: Redis
- **Real-time**: WebSocket with Socket.IO
- **Widget**: Preact for lightweight bundle size
- **Deployment**: Docker, Docker Compose

### System Components
1. **Chat Widget**: Embeddable customer-facing interface
2. **Agent Dashboard**: Real-time conversation management
3. **WebSocket Server**: Real-time message routing
4. **REST API**: Conversation and visitor management
5. **Analytics Engine**: Performance tracking and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Redis (if running locally)

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
```bash
git clone <repository-url>
cd live-chat-widget
```

2. **Environment configuration**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Run database migrations**:
```bash
docker-compose exec app npx prisma migrate deploy
```

5. **Access the application**:
- Main app: http://localhost:3000
- Widget demo: http://localhost:3000/widget/demo.html
- pgAdmin: http://localhost:8080
- Redis Commander: http://localhost:8081

### Option 2: Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Database setup**:
```bash
# Start PostgreSQL and Redis locally
npx prisma migrate dev
npx prisma generate
```

3. **Build the widget**:
```bash
npm run widget:build
```

4. **Start development server**:
```bash
npm run dev
```

## 📦 Widget Integration

### Basic Integration

Add this code to any website to embed the live chat widget:

```html
<script src="https://your-domain.com/widget/live-chat-widget.js"></script>
<script>
  LiveChatWidget.init({
    organizationId: 'your-org-id',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    greetingMessage: 'Hi there! 👋 How can we help you today?',
    placeholderText: 'Type your message...',
    showAvatar: true,
    enabled: true
  });
</script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `organizationId` | string | required | Your organization identifier |
| `apiUrl` | string | `/api` | API endpoint URL |
| `position` | string | `bottom-right` | Widget position (`bottom-right`, `bottom-left`) |
| `primaryColor` | string | `#3B82F6` | Primary theme color |
| `greetingMessage` | string | - | Welcome message for visitors |
| `placeholderText` | string | `Type your message...` | Input placeholder text |
| `showAvatar` | boolean | `true` | Show agent avatar |
| `enabled` | boolean | `true` | Enable/disable widget |

### WordPress Plugin

```php
// Add to your theme's functions.php
function add_livechat_widget() {
    ?>
    <script src="https://your-domain.com/widget/live-chat-widget.js"></script>
    <script>
      LiveChatWidget.init({
        organizationId: '<?php echo get_option('livechat_org_id'); ?>',
        primaryColor: '<?php echo get_theme_mod('primary_color', '#3B82F6'); ?>'
      });
    </script>
    <?php
}
add_action('wp_footer', 'add_livechat_widget');
```

## 🔧 API Documentation

### REST API Endpoints

#### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `PUT /api/conversations?id={id}` - Update conversation

#### Messages
- `GET /api/chat?conversationId={id}` - Get messages
- `POST /api/chat` - Send message

#### Visitors
- `GET /api/visitors` - List visitors
- `POST /api/visitors` - Create/update visitor

### WebSocket Events

#### Client to Server
- `join_conversation` - Join conversation room
- `send_message` - Send new message
- `start_typing` / `stop_typing` - Typing indicators
- `update_agent_status` - Agent availability

#### Server to Client
- `message_received` - New message notification
- `conversation_updated` - Conversation status change
- `typing_started` / `typing_stopped` - Typing indicators
- `agent_status_changed` - Agent availability update

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Widget Integration
1. Open http://localhost:3000/widget/demo.html
2. Test different configurations
3. Verify real-time messaging
4. Check mobile responsiveness

## 📊 Analytics & Monitoring

### Key Metrics
- **Response Times**: First response and resolution time tracking
- **Customer Satisfaction**: CSAT scores and feedback collection
- **Conversion Rates**: Chat-to-sale conversion tracking
- **Agent Performance**: Individual and team performance metrics

### Monitoring Setup
- Application logs: `/var/log/livechat/`
- Performance metrics: Built-in dashboard
- Error tracking: Console and database logs
- Uptime monitoring: Health check endpoint `/api/health`

## 🔒 Security

### Security Features
- **Message Encryption**: End-to-end encryption for sensitive conversations
- **Data Privacy**: GDPR compliance with data retention policies
- **Widget Security**: XSS prevention and secure iframe embedding
- **Authentication**: JWT with MFA for agent access
- **Rate Limiting**: Protection against spam and abuse

### Security Best Practices
- Use HTTPS in production
- Set strong JWT secrets
- Enable CORS protection
- Regular security updates
- Database backup encryption

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
```

2. **Deploy with Docker**:
```bash
docker build -t livechat-widget .
docker run -p 3000:3000 --env-file .env livechat-widget
```

3. **CDN Setup** (for widget delivery):
- Upload widget files to CDN
- Update widget src URL
- Enable gzip compression
- Set appropriate cache headers

### Scaling Considerations
- **Horizontal Scaling**: Multiple app instances behind load balancer
- **Database**: Read replicas for improved performance
- **Redis Cluster**: For high-availability caching
- **WebSocket**: Sticky sessions or Redis adapter for multiple instances

## 📈 Performance

### Optimization Features
- **Widget Performance**: Minimal JavaScript footprint with lazy loading
- **Message History**: Efficient pagination and search functionality
- **File Uploads**: Optimized file handling with cloud storage
- **Real-time Messaging**: Optimized WebSocket connections with horizontal scaling

### Performance Targets
- Widget load time: < 500ms
- Message delivery: < 100ms
- First response time: < 30 seconds
- Uptime: 99.9%

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.livechat.example.com](https://docs.livechat.example.com)
- **API Reference**: [api.livechat.example.com](https://api.livechat.example.com)
- **Support Email**: support@livechat.example.com
- **Community**: [Discord](https://discord.gg/livechat)

---

**Live Chat Widget** - Convert visitors into customers with instant conversations.