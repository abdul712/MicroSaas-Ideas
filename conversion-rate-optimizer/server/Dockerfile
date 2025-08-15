# Multi-stage Dockerfile for Conversion Rate Optimizer API

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
COPY . .
COPY .env.example .env

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p logs uploads

# Production stage
FROM base AS production
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create directories with proper permissions
RUN mkdir -p logs uploads tmp
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Expose port
EXPOSE 5000

# Start application
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

# Development stage
FROM deps-dev AS development
COPY . .
RUN npx prisma generate
RUN mkdir -p logs uploads
EXPOSE 5000
CMD ["npm", "run", "dev"]