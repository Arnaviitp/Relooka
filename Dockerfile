# Multi-stage production Dockerfile for Relooka
# Serves both the Flutter Web SPA and the Express REST APIs in a unified container

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy root and backend dependency manifests
COPY package.json ./
COPY backend/package.json ./backend/

# Install production dependencies only
RUN npm --prefix backend install --omit=dev

# Copy backend source code
COPY backend/src ./backend/src

# Copy pre-compiled Flutter Web production bundle
COPY build/web ./build/web

# Expose default port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/api/v1/health || exit 1

# Start the Express server
CMD ["node", "backend/src/server.js"]
