# Multi-stage Dockerfile for Conversion Rate Optimizer Web App

# Base image with Node.js
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies
FROM base AS deps-dev
COPY package*.json ./
RUN npm ci

# Build stage
FROM deps-dev AS build
WORKDIR /app
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Create required directories
RUN mkdir -p .next/cache/images
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3000

# Start application
CMD ["node", "server.js"]

# Development stage
FROM deps-dev AS development
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]