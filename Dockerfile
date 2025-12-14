# Multi-stage Dockerfile for Next.js + Prisma

FROM node:20-alpine AS builder
ARG ALPINE_MIRROR=https://mirrors.aliyun.com/alpine/
ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# Install deps
COPY package*.json ./
# Switch Alpine mirror for restricted networks
RUN sed -i "s#https://dl-cdn.alpinelinux.org/alpine/#${ALPINE_MIRROR}#g" /etc/apk/repositories

# Use alternate npm registry for Russia-friendly mirror
RUN npm config set registry ${NPM_REGISTRY}
RUN npm ci

# Native runtime needed for Next.js (SWC/Turbopack) on Alpine
RUN apk add --no-cache libc6-compat

# Prisma generate (needed for build and runtime)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


FROM node:20-alpine AS runner
ARG ALPINE_MIRROR=https://mirrors.aliyun.com/alpine/
ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure native deps exist in runtime too (sharp/swc)
RUN sed -i "s#https://dl-cdn.alpinelinux.org/alpine/#${ALPINE_MIRROR}#g" /etc/apk/repositories
RUN apk add --no-cache libc6-compat

# Install only production deps
COPY package*.json ./
RUN npm config set registry ${NPM_REGISTRY}
RUN npm ci --omit=dev

# Copy build output and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy Prisma client that was generated in the builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

ENV PORT=3000
EXPOSE 3000

CMD ["npm","run","start"]
