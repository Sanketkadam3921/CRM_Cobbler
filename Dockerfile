# Multi-stage Dockerfile for Cobbler CRM Full-Stack Application with MySQL
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime with MySQL
FROM ubuntu:22.04 AS production

# Install Node.js, MySQL, and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    mysql-server \
    mysql-client \
    dumb-init \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create users
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Set working directory
WORKDIR /app

# Copy built backend from builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./public

# Create necessary directories
RUN mkdir -p logs && chown nodejs:nodejs logs
RUN mkdir -p /var/lib/mysql && chown -R mysql:mysql /var/lib/mysql
RUN mkdir -p /var/run/mysqld && chown -R mysql:mysql /var/run/mysqld

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port (backend serves both API and frontend)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application (run as root for MySQL operations)
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
