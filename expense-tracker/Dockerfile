# ExpenseTracker Pro - Multi-stage Docker build
# Production-ready Node.js 18 Alpine container with security optimizations

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for node-gyp and Prisma
RUN apk add --no-cache libc6-compat openssl1.1-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    openssl1.1-compat \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy node_modules and set ownership
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create uploads directory with proper permissions
RUN mkdir -p ./uploads && chown nextjs:nodejs ./uploads

# Set proper permissions for Next.js files
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Metadata
LABEL maintainer="ExpenseTracker Pro Team"
LABEL version="1.0.0"
LABEL description="Enterprise-grade expense tracking SaaS with OCR and AI"
LABEL org.opencontainers.image.source="https://github.com/expensetracker-pro/app"