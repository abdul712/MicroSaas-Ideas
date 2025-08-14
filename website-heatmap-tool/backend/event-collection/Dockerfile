# Multi-stage build for Event Collection Service
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    tini \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

FROM base AS dependencies

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

FROM dependencies AS build

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

FROM base AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application and production dependencies
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# Development target
FROM dependencies AS development

# Install nodemon globally
RUN npm install -g nodemon tsx

# Copy source code
COPY src ./src

# Switch to non-root user
USER nodejs

# Expose port and debug port
EXPOSE 3001 9229

# Start with nodemon for development
CMD ["npm", "run", "dev"]