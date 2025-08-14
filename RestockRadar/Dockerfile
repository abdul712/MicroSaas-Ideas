# Multi-stage Dockerfile for production optimization

# Base stage with Node.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy additional files needed for runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

# Development stage
FROM base AS development
WORKDIR /app

# Install all dependencies (including dev dependencies)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Expose port for development
EXPOSE 3000

# Install curl for health checks
RUN apk add --no-cache curl

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# Worker stage for background jobs
FROM base AS worker
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy built application
COPY --from=builder --chown=worker:nodejs /app/.next/standalone ./
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json

# Install production dependencies
COPY --from=deps --chown=worker:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER worker

# Health check for worker
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# Start worker processes
CMD ["node", "workers/index.js"]

# ML Service stage (Python)
FROM python:3.11-slim AS ml-service

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML service code
COPY ml-service/ .

# Create non-root user
RUN useradd --create-home --shell /bin/bash mluser
RUN chown -R mluser:mluser /app
USER mluser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start ML service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]