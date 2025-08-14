import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { Server } from 'socket.io';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { validateRequest } from './middleware/validation';

// Import routes
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import dashboardRoutes from './routes/dashboards';
import integrationRoutes from './routes/integrations';
import teamRoutes from './routes/teams';
import userRoutes from './routes/users';
import webhookRoutes from './routes/webhooks';

// Import services
import { SocketService } from './services/socket';
import { QueueService } from './services/queue';
import { DatabaseService } from './services/database';

class Application {
  public app: express.Application;
  public server: any;
  public io: Server;
  private socketService: SocketService;
  private queueService: QueueService;
  private databaseService: DatabaseService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
    });

    this.initializeServices();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocketHandlers();
  }

  private initializeServices(): void {
    this.databaseService = new DatabaseService();
    this.queueService = new QueueService();
    this.socketService = new SocketService(this.io);
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Logging
    if (config.env !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
      }));
    }

    // Session configuration
    this.initializeSession();

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Request validation middleware
    this.app.use(validateRequest);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.env,
      });
    });
  }

  private async initializeSession(): Promise<void> {
    // Initialize Redis client for sessions
    const redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    await redisClient.connect();

    // Initialize store
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: 'sales-dashboard:sess:',
    });

    this.app.use(session({
      store: redisStore,
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      name: 'sales-dashboard-session',
      cookie: {
        secure: config.env === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
    }));
  }

  private initializeRoutes(): void {
    const apiV1 = express.Router();

    // Mount routes
    apiV1.use('/auth', authRoutes);
    apiV1.use('/analytics', authMiddleware, analyticsRoutes);
    apiV1.use('/dashboards', authMiddleware, dashboardRoutes);
    apiV1.use('/integrations', authMiddleware, integrationRoutes);
    apiV1.use('/teams', authMiddleware, teamRoutes);
    apiV1.use('/users', authMiddleware, userRoutes);
    apiV1.use('/webhooks', webhookRoutes); // No auth for webhooks

    // Mount API routes
    this.app.use('/v1', apiV1);

    // Legacy support
    this.app.use('/api', apiV1);

    // Catch-all route for undefined endpoints
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  private initializeSwagger(): void {
    const specs = swaggerJsdoc({
      definition: {
        openapi: '3.0.3',
        info: {
          title: 'Sales Performance Dashboard API',
          version: '1.0.0',
          description: 'Enterprise-grade Sales Analytics and Business Intelligence API',
        },
        servers: [
          {
            url: config.app.url,
            description: 'API Server',
          },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
      apis: ['./src/routes/*.ts'], // Path to the API docs
    });

    this.app.use('/docs', swaggerUi.serve);
    this.app.get('/docs', swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Sales Dashboard API Documentation',
    }));

    // Serve OpenAPI spec as JSON
    this.app.get('/docs/openapi.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeSocketHandlers(): void {
    this.io.use((socket, next) => {
      // Socket authentication middleware
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token and attach user to socket
      // Implementation depends on your auth service
      next();
    });

    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('join-organization', (organizationId: string) => {
        socket.join(`org:${organizationId}`);
        logger.info(`Socket ${socket.id} joined organization ${organizationId}`);
      });

      socket.on('leave-organization', (organizationId: string) => {
        socket.leave(`org:${organizationId}`);
        logger.info(`Socket ${socket.id} left organization ${organizationId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });

      // Handle real-time analytics subscriptions
      socket.on('subscribe-metrics', (params: any) => {
        this.socketService.subscribeToMetrics(socket, params);
      });

      socket.on('unsubscribe-metrics', () => {
        this.socketService.unsubscribeFromMetrics(socket);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.connect();
      logger.info('Database connected successfully');

      // Initialize queue service
      await this.queueService.initialize();
      logger.info('Queue service initialized');

      // Start server
      const port = config.port;
      this.server.listen(port, () => {
        logger.info(`🚀 Server is running on port ${port}`);
        logger.info(`📖 API Documentation: ${config.app.url}/docs`);
        logger.info(`🔗 Health Check: ${config.app.url}/health`);
        
        if (config.env === 'development') {
          logger.info(`🛠️  Environment: ${config.env}`);
          logger.info(`📊 Redis URL: ${config.redis.url}`);
          logger.info(`🗄️  Database: Connected`);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Close server
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          await this.databaseService.disconnect();
          logger.info('Database connections closed');

          // Close queue connections
          await this.queueService.close();
          logger.info('Queue connections closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Initialize and start application
const application = new Application();

if (require.main === module) {
  application.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default application;