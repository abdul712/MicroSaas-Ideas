# Lead Scoring Tool Frontend Dockerfile
# Multi-stage build for optimized production images

# Base stage with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY .nvmrc ./

# Dependencies stage
FROM base AS deps
RUN npm ci --only=production

# Development dependencies stage
FROM base AS dev-deps
RUN npm ci

# Development stage
FROM base AS development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Expose port and set development command
EXPOSE 3000
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client if needed
# RUN npx prisma generate

RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]