# Multi-stage Docker build for Social Media Caption Generator
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set up proper file permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Install runtime dependencies
RUN apk add --no-cache curl

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="Social Media Caption Generator Team"
LABEL version="1.0.0"
LABEL description="AI-powered social media caption generation platform"