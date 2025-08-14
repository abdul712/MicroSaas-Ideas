# Event Collection Service Dockerfile
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 heatmap

WORKDIR /app

# Copy built application
COPY --from=builder --chown=heatmap:nodejs /app/dist ./dist
COPY --from=builder --chown=heatmap:nodejs /app/package*.json ./
COPY --from=builder --chown=heatmap:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p /app/logs && chown heatmap:nodejs /app/logs

USER heatmap

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/server.js"]