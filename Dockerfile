FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts && npm cache clean --force

COPY . .

RUN npx prisma generate
RUN npm run build
RUN mkdir -p /app/.next/cache

FROM node:20 AS runner

RUN useradd -m appuser

WORKDIR /app

# Кэш npm из стадии сборки не попадёт в production-образ.
COPY --from=builder --chown=appuser:appuser /app ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER appuser

CMD ["./node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
